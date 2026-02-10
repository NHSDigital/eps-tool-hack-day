import {Logger} from "@aws-lambda-powertools/logger"
import {injectLambdaContext} from "@aws-lambda-powertools/logger/middleware"
import middy from "@middy/core"
import inputOutputLogger from "@middy/input-output-logger"
import errorHandler from "@nhs/fhir-middy-error-handler"

import {queryActionState} from "./dynamo"

const logger = new Logger({serviceName: "poll"})

const tableName = process.env.PROCESSING_STATUS_TABLE_NAME!

const lambdaHandler = async (event: any): Promise<any> => {
  logger.appendKeys({
    "nhsd-correlation-id": event.headers["nhsd-correlation-id"],
    "x-request-id": event.headers["x-request-id"],
    "nhsd-request-id": event.headers["nhsd-request-id"],
    "x-correlation-id": event.headers["x-correlation-id"],
    "apigw-request-id": event.requestContext.requestId
  })

  // take the action ID from the query string parameters and use it to query the DynamoDB table for any existing records with that action ID
  const actionID = event.queryStringParameters?.actionId

  if (!actionID) {
    logger.warn("No action ID provided in query parameters")
    return {
      statusCode: 400,
      body: JSON.stringify({message: "Missing required query parameter: actionId"}),
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache"
      }
    }
  }

  const result = await queryActionState(actionID, logger)

  return {
    statusCode: 200,
    body: JSON.stringify(result),
    headers: {
      "Content-Type": "application/health+json",
      "Cache-Control": "no-cache"
    }
  }
}

export const handler = middy(lambdaHandler)
  .use(injectLambdaContext(logger, {clearState: true}))
  .use(
    inputOutputLogger({
      logger: (request) => {
        logger.info(request)
      }
    })
  )
  .use(errorHandler({logger: logger}))
