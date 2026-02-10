import {Logger} from "@aws-lambda-powertools/logger"
import {injectLambdaContext} from "@aws-lambda-powertools/logger/middleware"
import middy from "@middy/core"
import inputOutputLogger from "@middy/input-output-logger"
import errorHandler from "@nhs/fhir-middy-error-handler"
import crypto from "crypto"
import { preparePrescription } from "./util"

const logger = new Logger({serviceName: "process"})


const lambdaHandler = async (event: any): Promise<any> => {
  const actionId = event.actionId

  const preparedPrescription = await preparePrescription(1)
  const commitId = process.env.COMMIT_ID
  const versionNumber = process.env.VERSION_NUMBER
  logger.info("Prepared prescription", {preparePrescription})
  const statusBody = {commitId: commitId, versionNumber: versionNumber}

  return {
    statusCode: 200,
    body: JSON.stringify(statusBody),
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