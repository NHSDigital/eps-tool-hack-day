import {Construct} from "constructs"
import {TypescriptLambdaFunction} from "@nhsdigital/eps-cdk-constructs"
import { resolve } from "node:path"
const baseDir = resolve(__dirname, "../../..")
// Interface for properties needed to create API functions
export interface ApiFunctionsProps {
  readonly serviceName: string
  readonly stackName: string
  readonly version: string
  readonly commitId: string
}

/**
 * Class for creating functions and resources needed for API operations
 */
export class ApiFunctions extends Construct {
  public readonly fooLambda: TypescriptLambdaFunction

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
    // Outputs
    this.fooLambda = fooLambda
  }
}
