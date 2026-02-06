import {
  App,
  CfnOutput,
  Duration,
  Fn,
  Stack,
  StackProps
} from "aws-cdk-lib"

import {StaticContentBucket} from "../resources/StaticContentBucket"
import {Certificate} from "aws-cdk-lib/aws-certificatemanager"
import {Role} from "aws-cdk-lib/aws-iam"
import {HostedZone} from "aws-cdk-lib/aws-route53"
import { Key } from "aws-cdk-lib/aws-kms"
import { Stream } from "aws-cdk-lib/aws-kinesis"
import { ukRegionLogGroups } from "../resources/ukRegionLogGroups"
import { RestApiGateway } from "../resources/RestApiGateway"
import { RestApiGatewayMethods } from "../resources/RestApiGateway/RestApiGatewayMethods"
import { S3BucketOrigin } from "aws-cdk-lib/aws-cloudfront-origins"
import { AccessLevel, AllowedMethods, FunctionEventType, ViewerProtocolPolicy } from "aws-cdk-lib/aws-cloudfront"
import { CloudfrontBehaviors } from "../resources/CloudfrontBehaviors"
import { CloudfrontDistribution } from "../resources/CloudfrontDistribution"
import { getConfigFromEnvVar } from "@nhsdigital/eps-cdk-constructs"
import { ApiFunctions } from "../resources/Functions"
import { addNagSuppressions } from "./nagSuppression"

export interface HackStackProps extends StackProps {
  readonly serviceName: string
  readonly stackName: string
  readonly shortCloudfrontDomain: string
  readonly fullCloudfrontDomain: string
}

/**
 * Hack Stack

 */

export class HackStack extends Stack {
  public constructor(scope: App, id: string, props: HackStackProps){
    super(scope, id, props)

    // Context
    /* context values passed as --context cli arguments are passed as strings so coerce them to expected types*/

    const epsDomainName: string = getConfigFromEnvVar("epsDomainName")
    const epsHostedZoneId: string = getConfigFromEnvVar("epsHostedZoneId")
    const cloudfrontCertArn: string = getConfigFromEnvVar("cloudfrontCertArn")
    const shortCloudfrontDomain: string = getConfigFromEnvVar("shortCloudfrontDomain")
    const fullCloudfrontDomain: string = getConfigFromEnvVar("fullCloudfrontDomain")
    const cloudfrontDistributionId: string = getConfigFromEnvVar("cloudfrontDistributionId")
    const splunkDeliveryStreamImport = Fn.importValue("lambda-resources:SplunkDeliveryStream")
    const splunkSubscriptionFilterRoleImport = Fn.importValue("lambda-resources:SplunkSubscriptionFilterRole")

    const deploymentRoleImport = Fn.importValue("ci-resources:CloudFormationDeployRole")
    const cloudwatchKmsKeyImport = Fn.importValue("account-resources:CloudwatchLogsKmsKeyArn")
    const cloudwatchKmsKey = Key.fromKeyArn(
      this, "cloudwatchKmsKey", cloudwatchKmsKeyImport)
    const splunkDeliveryStream = Stream.fromStreamArn(
      this, "SplunkDeliveryStream", splunkDeliveryStreamImport)
    const splunkSubscriptionFilterRole = Role.fromRoleArn(
      this, "splunkSubscriptionFilterRole", splunkSubscriptionFilterRoleImport)

    // Coerce context and imports to relevant types
    const deploymentRole = Role.fromRoleArn(this, "deploymentRole", deploymentRoleImport)
    const hostedZone = HostedZone.fromHostedZoneAttributes(this, "hostedZone", {
      hostedZoneId: epsHostedZoneId,
      zoneName: epsDomainName
    })
    const cloudfrontCert = Certificate.fromCertificateArn(this, "CloudfrontCert", cloudfrontCertArn)

    // Resources
    // - Static Content Bucket
    const staticContentBucket = new StaticContentBucket(this, "StaticContentBucket", {
      bucketName: `${props.serviceName}-staticcontentbucket-${this.account}`,
      cloudfrontDistributionId: cloudfrontDistributionId,
      deploymentRole: deploymentRole,
      region: this.region
    })

    const logGroups = new ukRegionLogGroups(this, "ukRegionLogGroups", {
      cloudwatchKmsKey: cloudwatchKmsKey,
      logRetentionInDays: 30,
      splunkDeliveryStream: splunkDeliveryStream,
      splunkSubscriptionFilterRole: splunkSubscriptionFilterRole,
      // waf log groups must start with aws-waf-logs-
      wafLogGroupName: `aws-waf-logs-${props.serviceName}-apigw`,
      stackName: this.stackName
    })
    const apiGateway = new RestApiGateway(this, "ApiGateway", {
      serviceName: props.serviceName,
      stackName: props.stackName,
      logRetentionInDays: 30,
      logLevel: "DEBUG",
      cloudwatchKmsKey: cloudwatchKmsKey,
      splunkDeliveryStream: splunkDeliveryStream,
      splunkSubscriptionFilterRole: splunkSubscriptionFilterRole
    })
    const functions = new ApiFunctions(this, "ApiFunctions", {
      serviceName: props.serviceName,
      stackName: props.stackName,
      version: "1.0.0",
      commitId: "abc123"
    })
    const apiMethods = new RestApiGatewayMethods(this, "RestApiGatewayMethods", {
      executePolices: [
        functions.fooLambda.executionPolicy
      ],
      restAPiGatewayRole: apiGateway.apiGatewayRole,
      restApiGateway: apiGateway.apiGateway,
      fooLambda: functions.fooLambda.function
    })
    const staticContentBucketOrigin = S3BucketOrigin.withOriginAccessControl(
      staticContentBucket.bucket,
      {
        originAccessLevels: [AccessLevel.READ]
      }
    )
    const cloudfrontBehaviors = new CloudfrontBehaviors(this, "CloudfrontBehaviors", {
      serviceName: props.serviceName,
      stackName: props.stackName,
      staticContentBucketOrigin: staticContentBucketOrigin,
    })
    
    // --- Distribution
    const cloudfrontDistribution = new CloudfrontDistribution(this, "CloudfrontDistribution", {
      serviceName: props.serviceName,
      stackName: props.stackName,
      hostedZone: hostedZone,
      cloudfrontCert: cloudfrontCert,
      shortCloudfrontDomain: shortCloudfrontDomain,
      fullCloudfrontDomain: fullCloudfrontDomain,
      defaultBehavior: {
        origin: staticContentBucketOrigin,
        allowedMethods: AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        functionAssociations: [
          {
            function: cloudfrontBehaviors.s3404UriRewriteFunction.function,
            eventType: FunctionEventType.VIEWER_REQUEST
          },
          {
            function: cloudfrontBehaviors.s3404ModifyStatusCodeFunction.function,
            eventType: FunctionEventType.VIEWER_RESPONSE
          }
        ],
      },
      additionalBehaviors: cloudfrontBehaviors.additionalBehaviors,
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 404,
          responsePagePath: "/404.html",
          ttl: Duration.seconds(10)
        }
      ]
    })

    // Outputs

    // Exports
    new CfnOutput(this, "StaticContentBucketArn", {
      value: staticContentBucket.bucket.bucketArn,
      exportName: `${props.stackName}:StaticContentBucket:Arn`
    })
    new CfnOutput(this, "StaticContentBucketName", {
      value: staticContentBucket.bucket.bucketName,
      exportName: `${props.stackName}:StaticContentBucket:Name`
    })
    new CfnOutput(this, "StaticContentBucketKmsKeyArn", {
      value: staticContentBucket.kmsKey.keyArn,
      exportName: `${props.stackName}:StaticContentBucketKmsKey:Arn`
    })
    new CfnOutput(this, "CloudfrontDistributionId", {
      value: cloudfrontDistribution.distribution.distributionId,
      exportName: `${props.stackName}:cloudfrontDistribution:Id`
    })
    new CfnOutput(this, "CloudfrontDistributionArn", {
      value: cloudfrontDistribution.distribution.distributionArn,
      exportName: `${props.stackName}:cloudfrontDistribution:Arn`
    })

    // Token mapping table
    addNagSuppressions(this)
  }
}
