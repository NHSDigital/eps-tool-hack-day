import {Construct} from "constructs"
import {TypescriptLambdaFunction} from "@nhsdigital/eps-cdk-constructs"
import {resolve} from "node:path"
import {Dynamodb} from "./DynamoDb"
const baseDir = resolve(__dirname, "../../..")
// Interface for properties needed to create API functions
export interface ApiFunctionsProps {
  readonly serviceName: string
  readonly stackName: string
  readonly version: string
  readonly commitId: string
  readonly processingStatusTable: Dynamodb
}

/**
 * Class for creating functions and resources needed for API operations
 */
export class ApiFunctions extends Construct {
  public readonly fooLambda: TypescriptLambdaFunction
  public readonly createLambda: TypescriptLambdaFunction
  public readonly processLambda: TypescriptLambdaFunction
  public readonly pollLambda: TypescriptLambdaFunction

  public constructor(scope: Construct, id: string, props: ApiFunctionsProps) {
    super(scope, id)
    const fooLambda = new TypescriptLambdaFunction(this, "FooLambda", {
      functionName: `${props.stackName}-FooLambda`,
      projectBaseDir: baseDir,
      packageBasePath: "packages/foo",
      entryPoint: "src/handler.ts",
      environmentVariables: {},
      logRetentionInDays: 30,
      logLevel: "DEBUG",
      version: props.version,
      commitId: props.commitId
    })

    const processLambda = new TypescriptLambdaFunction(this, "ProcessLambda", {
      functionName: `${props.stackName}-ProcessLambda`,
      projectBaseDir: baseDir,
      packageBasePath: "packages/process",
      entryPoint: "src/handler.ts",
      environmentVariables: {},
      logRetentionInDays: 30,
      logLevel: "DEBUG",
      version: props.version,
      commitId: props.commitId
    })

    const createLambda = new TypescriptLambdaFunction(this, "CreateLambda", {
      functionName: `${props.stackName}-CreateLambda`,
      projectBaseDir: baseDir,
      packageBasePath: "packages/create",
      entryPoint: "src/handler.ts",
      environmentVariables: {
        PROCESSING_LAMBDA_NAME: processLambda.function.functionName
      },
      logRetentionInDays: 30,
      logLevel: "DEBUG",
      version: props.version,
      commitId: props.commitId,
      additionalPolicies: [
        processLambda.executionPolicy
      ]
    })

    const pollLambda = new TypescriptLambdaFunction(this, "PollLambda", {
      functionName: `${props.stackName}-PollLambda`,
      projectBaseDir: baseDir,
      packageBasePath: "packages/poll",
      entryPoint: "src/handler.ts",
      environmentVariables: {},
      logRetentionInDays: 30,
      logLevel: "DEBUG",
      version: props.version,
      commitId: props.commitId,
      additionalPolicies: [
        props.processingStatusTable.processStatusTableReadPolicy,
      ]
    })

    // Outputs
    this.fooLambda = fooLambda
    this.createLambda = createLambda
    this.processLambda = processLambda
    this.pollLambda = pollLambda
  }
}
