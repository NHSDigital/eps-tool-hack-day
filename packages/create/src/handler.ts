import {Logger} from "@aws-lambda-powertools/logger"
import {InvokeCommand, LambdaClient, LogType} from "@aws-sdk/client-lambda"
import {injectLambdaContext} from "@aws-lambda-powertools/logger/middleware"
import middy from "@middy/core"
import inputOutputLogger from "@middy/input-output-logger"
import errorHandler from "@nhs/fhir-middy-error-handler"

import {randomUUID, UUID} from "node:crypto"

const logger = new Logger({serviceName: "create"})

const invoke = async (funcName: string, payload: any) => {
  const client = new LambdaClient({});
  const command = new InvokeCommand({
    FunctionName: funcName,
    InvocationType: "Event", // asynchronous invocation
    Payload: JSON.stringify(payload)
  });

  await client.send(command)
};

const lambdaHandler = async (event: any): Promise<any> => {
  logger.appendKeys({
    "nhsd-correlation-id": event.headers["nhsd-correlation-id"],
    "x-request-id": event.headers["x-request-id"],
    "nhsd-request-id": event.headers["nhsd-request-id"],
    "x-correlation-id": event.headers["x-correlation-id"],
    "apigw-request-id": event.requestContext.requestId
  })

  // Create an empty record in dynamo with a new uuid
  const uuid: UUID = randomUUID()
  logger.info("invoking processing lambda", {processingLambdaName: process.env.PROCESSING_LAMBDA_NAME, id: uuid})
  await invoke(process.env.PROCESSING_LAMBDA_NAME!, {id: uuid})

  // immediately return 200 and the newly created ID
  const createBody = {id: uuid}

  return {
    statusCode: 200,
    body: JSON.stringify(createBody),
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
