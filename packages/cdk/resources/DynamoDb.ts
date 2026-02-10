import {Construct} from "constructs"

import {
  AttributeType,
  Billing,
  TableEncryptionV2,
  TableV2
} from "aws-cdk-lib/aws-dynamodb"
import {
  AccountRootPrincipal,
  AnyPrincipal,
  Effect,
  ManagedPolicy,
  PolicyDocument,
  PolicyStatement
} from "aws-cdk-lib/aws-iam"
import {Key} from "aws-cdk-lib/aws-kms"
import {Duration, RemovalPolicy} from "aws-cdk-lib"

export interface DynamodbProps {
  readonly stackName: string
}

/**
 * Dynamodb tables used for user state information
 */
export class Dynamodb extends Construct {
  public readonly processStatus: TableV2
  public readonly useProcessStatusKmsKeyPolicy: ManagedPolicy
  public readonly processStatusTableWritePolicy: ManagedPolicy
  public readonly processStatusTableReadPolicy: ManagedPolicy
  //

  public constructor(scope: Construct, id: string, props: DynamodbProps) {
    super(scope, id)

    // KMS key for token mapping table
    const processStatusKey = new Key(this, "processStatusKey", {
      removalPolicy: RemovalPolicy.DESTROY,
      pendingWindow: Duration.days(7),
      alias: `${props.stackName}-processStatusKey`,
      description: `${props.stackName}-processStatusKey`,
      enableKeyRotation: true,
      policy: new PolicyDocument({
        statements: [
          new PolicyStatement({
            sid: "Enable IAM User Permissions",
            effect: Effect.ALLOW,
            actions: [
              "kms:*"
            ],
            principals: [
              new AccountRootPrincipal
            ],
            resources: ["*"]
          })
        ]
      })
    })

    // Process Status Table
    const processStatusTable = new TableV2(this, "processStatusTable", {
      partitionKey: {
        name: "actionId",
        type: AttributeType.STRING
      },
      tableName: `${props.stackName}-processStatus`,
      removalPolicy: RemovalPolicy.DESTROY,
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: true
      },
      encryption: TableEncryptionV2.customerManagedKey(processStatusKey),
      billing: Billing.onDemand(),
      timeToLiveAttribute: "ExpiryTime"
    })

    // Policy to use token mapping KMS key
    const useProcessStatusKmsKey = new ManagedPolicy(this, "UseProcessStatusKMSKeyPolicy", {
      statements: [
        new PolicyStatement({
          actions: [
            "kms:DescribeKey",
            "kms:GenerateDataKey",
            "kms:Encrypt",
            "kms:ReEncryptFrom",
            "kms:ReEncryptTo",
            "kms:Decrypt"
          ],
          resources: [
            processStatusKey.keyArn
          ]
        })
      ]
    })

    const processStatusReadPolicy = new ManagedPolicy(this, "ProcessStatusReadManagedPolicy", {
      statements: [
        new PolicyStatement({
          actions: [
            "dynamodb:GetItem",
            "dynamodb:BatchGetItem",
            "dynamodb:Scan",
            "dynamodb:Query",
            "dynamodb:ConditionCheckItem",
            "dynamodb:DescribeTable"
          ],
          resources: [
            processStatusTable.tableArn,
            `${processStatusTable.tableArn}/index/*`
          ]
        })
      ]
    })

    const processStatusWritePolicy = new ManagedPolicy(this, "ProcessStatusWriteManagedPolicy", {
      statements: [
        new PolicyStatement({
          actions: [
            "dynamodb:PutItem",
            "dynamodb:BatchWriteItem",
            "dynamodb:UpdateItem",
            "dynamodb:DeleteItem"
          ],
          resources: [
            processStatusTable.tableArn,
            `${processStatusTable.tableArn}/index/*`
          ]
        })
      ]
    })


    // Outputs: assign the created resources to the class properties
    this.processStatus = processStatusTable
    this.useProcessStatusKmsKeyPolicy = useProcessStatusKmsKey
    this.processStatusTableWritePolicy = processStatusWritePolicy
    this.processStatusTableReadPolicy = processStatusReadPolicy


  }
}
