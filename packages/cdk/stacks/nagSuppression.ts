/* eslint-disable max-len */

import {Stack} from "aws-cdk-lib"
import {safeAddNagSuppressionGroup, safeAddNagSuppression} from "@nhsdigital/eps-cdk-constructs"

export const addNagSuppressions = (stack: Stack) => {
  safeAddNagSuppression(
    stack,
    "/HackStack/StaticContentBucket/Bucket/Resource",
    [
      {
        id: "AwsSolutions-S1",
        reason: "this is for hack day stack"
      }
    ]
  )
  safeAddNagSuppression(
    stack,
    "/HackStack/ApiGateway/ApiGateway/Resource",
    [
      {
        id: "AwsSolutions-APIG2",
        reason: "this is for hack day stack"
      }
    ]
  )
  safeAddNagSuppression(
    stack,
    "/HackStack/ApiGateway/ApiGateway/CloudWatchRole/Resource",
    [
      {
        id: "AwsSolutions-IAM4",
        reason: "this is for hack day stack"
      }
    ]
  )
  safeAddNagSuppression(
    stack,
    "/HackStack/ApiGateway/ApiGateway/Default/GET/Resource",
    [
      {
        id: "AwsSolutions-APIG4",
        reason: "this is for hack day stack"
      }
    ]
  )
  safeAddNagSuppression(
    stack,
    "/HackStack/ApiGateway/ApiGateway/Default/GET/Resource",
    [
      {
        id: "AwsSolutions-COG4",
        reason: "this is for hack day stack"
      }
    ]
  )
  safeAddNagSuppression(
    stack,
    "/HackStack/CloudfrontDistribution/CloudfrontDistribution/Resource",
    [
      {
        id: "AwsSolutions-CFR3",
        reason: "this is for hack day stack"
      }
    ]
  )
  safeAddNagSuppression(
    stack,
    "/HackStack/ApiGateway/ApiGateway/Default/foo/GET/Resource",
    [
      {
        id: "AwsSolutions-APIG4",
        reason: "this is for hack day stack"
      }
    ]
  )
  safeAddNagSuppression(
    stack,
    "/HackStack/ApiGateway/ApiGateway/Default/foo/GET/Resource",
    [
      {
        id: "AwsSolutions-COG4",
        reason: "this is for hack day stack"
      }
    ]
  )

}

