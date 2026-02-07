import {IManagedPolicy, IRole} from "aws-cdk-lib/aws-iam"
import {
  AuthorizationType,
  LambdaIntegration,
  RestApi
} from "aws-cdk-lib/aws-apigateway"
import {Construct} from "constructs"
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs"
// import {NodejsFunction} from "aws-cdk-lib/aws-lambda-nodejs"

export interface RestApiGatewayMethodsProps {
  readonly executePolices: Array<IManagedPolicy>
  readonly restAPiGatewayRole: IRole
  readonly restApiGateway: RestApi
  readonly fooLambda: NodejsFunction
}

/**
 * Resources for a api gateway methods
 * executePolicies should be policies that are needed to execute lambdas

 */

export class RestApiGatewayMethods extends Construct {

  public constructor(scope: Construct, id: string, props: RestApiGatewayMethodsProps) {
    super(scope, id)


    // Resources
    for (const policy of props.executePolices) {
      props.restAPiGatewayRole.addManagedPolicy(policy)
    }


    const prescriptionDetailsLambdaResource = props.restApiGateway.root.addResource("foo")
    prescriptionDetailsLambdaResource.addMethod("GET", new LambdaIntegration(props.fooLambda, {
       credentialsRole: props.restAPiGatewayRole
     }), {
       authorizationType: AuthorizationType.NONE,
     })


    //Outputs
  }
}
