import {Logger} from "@aws-lambda-powertools/logger"
import {DynamoDBClient, GetItemCommand, GetItemCommandInput} from "@aws-sdk/client-dynamodb"

const client = new DynamoDBClient()
const tableName = process.env.PROCESSING_STATUS_TABLE_NAME!

export async function queryActionState(
  actionID: string,
  logger: Logger
): Promise<Array<any>> {
  const query: GetItemCommandInput = {
    TableName: tableName,
    Key: {
      actionId: {S: actionID}
    }
  }

  logger.info("Getting DynamoDB item for action ID", {
    actionID,
    tableName,
  })

  try {
    const result = await client.send(new GetItemCommand(query))
    const items = result.Item ? [result.Item] : []

    logger.info("Retrieved records from DynamoDB", {
      actionID,
      recordCount: items.length
    })

    return items
  } catch (err) {
    logger.error("Error getting DynamoDB item for existing prescription records", {
      actionID,
      error: err
    })
    throw err
  }
}
