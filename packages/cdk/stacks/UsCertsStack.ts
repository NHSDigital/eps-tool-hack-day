import {
  App,
  CfnOutput,
  Environment,
  Stack,
  StackProps
} from "aws-cdk-lib"
import {HostedZone} from "aws-cdk-lib/aws-route53"
import {Certificate, CertificateValidation} from "aws-cdk-lib/aws-certificatemanager"
import {CloudfrontLogDelivery} from "../resources/CloudfrontLogDelivery"
import {usRegionLogGroups} from "../resources/usRegionLogGroups"
import { getBooleanConfigFromEnvVar, getConfigFromEnvVar, getNumberConfigFromEnvVar } from "@nhsdigital/eps-cdk-constructs"

export interface UsCertsStackProps extends StackProps {
  readonly env: Environment
  readonly serviceName: string
  readonly stackName: string
  readonly shortCloudfrontDomain: string
}

/**
 * Clinical Prescription Tracker UI US Certs (us-east-1)

 */

export class UsCertsStack extends Stack {
  public readonly cloudfrontCert: Certificate
  public readonly fullCloudfrontDomain: string

  public constructor(scope: App, id: string, props: UsCertsStackProps) {
    super(scope, id, props)

    // Context
    /* context values passed as --context cli arguments are passed as strings so coerce them to expected types*/
    const epsDomainName: string = getConfigFromEnvVar("epsDomainName")
    const epsHostedZoneId: string = getConfigFromEnvVar("epsHostedZoneId")
    const splunkDeliveryStream: string = getConfigFromEnvVar("splunkDeliveryStream")
    const splunkSubscriptionFilterRole: string = getConfigFromEnvVar("splunkSubscriptionFilterRole")
    const cloudfrontDistributionArn: string = getConfigFromEnvVar("cloudfrontDistributionArn")
    const logRetentionInDays: number = getNumberConfigFromEnvVar("logRetentionInDays")
    const isPullRequest: boolean = getBooleanConfigFromEnvVar("isPullRequest")

    // Coerce context and imports to relevant types
    const hostedZone = HostedZone.fromHostedZoneAttributes(this, "hostedZone", {
      hostedZoneId: epsHostedZoneId,
      zoneName: epsDomainName
    })

    // calculate full domain names
    const fullCloudfrontDomain = `${props.shortCloudfrontDomain}.${epsDomainName}`

    // Resources
    // - Cloudfront Cert
    const cloudfrontCertificate = new Certificate(this, "CloudfrontCertificate", {
      domainName: fullCloudfrontDomain,
      validation: CertificateValidation.fromDns(hostedZone)
    })

    // log groups in US region
    const logGroups = new usRegionLogGroups(this, "usRegionLogGroups", {
      cloudfrontLogGroupName: props.serviceName,
      // waf log groups must start with aws-waf-logs-
      wafLogGroupName: `aws-waf-logs-${props.serviceName}-cloudfront`,
      logRetentionInDays: logRetentionInDays,
      stackName: props.stackName,
      region: this.region,
      account: this.account,
      splunkDeliveryStream: splunkDeliveryStream,
      splunkSubscriptionFilterRole: splunkSubscriptionFilterRole,
      isPullRequest: isPullRequest
    })


    // cloudfront log group - needs to be in us-east-1 region
    new CloudfrontLogDelivery(this, "cloudfrontLogDelivery", {
      cloudfrontLogGroup: logGroups.cloudfrontLogGroup,
      cloudfrontDistributionArn: cloudfrontDistributionArn
    })

    // Outputs

    // Exports
    new CfnOutput(this, "CloudfrontCertificateArn", {
      value: cloudfrontCertificate.certificateArn,
      exportName: `${props.stackName}:cloudfrontCertificate:Arn`
    })
    new CfnOutput(this, "shortCloudfrontDomain", {
      value: props.shortCloudfrontDomain,
      exportName: `${props.stackName}:shortCloudfrontDomain:Name`
    })
    new CfnOutput(this, "fullCloudfrontDomain", {
      value: fullCloudfrontDomain,
      exportName: `${props.stackName}:fullCloudfrontDomain:Name`
    })


    this.fullCloudfrontDomain = fullCloudfrontDomain
  }
}
