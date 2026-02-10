import {Logger} from "@aws-lambda-powertools/logger"
import {DynamoDBClient, QueryCommand, QueryCommandInput} from "@aws-sdk/client-dynamodb"

const client = new DynamoDBClient()
const tableName = process.env.TABLE_NAME ?? "PrescriptionStatusUpdates"

export async function queryActionState(
  actionID: string,
  logger: Logger
): Promise<Array<any>> {

  // Use the GSI to query by PrescriptionID
  const query: QueryCommandInput = {
    TableName: tableName,
    KeyConditionExpression: "actionId = :aid",
    ExpressionAttributeValues: {
      ":aid": {S: actionID}
    }
  }

  let lastEvaluatedKey
  let items = []

  logger.info("Querying DynamoDB for action ID", {
    actionID,
    tableName,
  })

  try {
    while (true) {
      if (lastEvaluatedKey) {
        query.ExclusiveStartKey = lastEvaluatedKey
      }

      const result = await client.send(new QueryCommand(query))

      if (result.Items) {
        items.push(...result.Items)
      }

      lastEvaluatedKey = result.LastEvaluatedKey
      if (!lastEvaluatedKey) {
        break
      }
    }

    logger.info("Retrieved records from DynamoDB", {
      actionID,
      recordCount: items.length
    })

    return items
  } catch (err) {
    logger.error("Error querying DynamoDB for existing prescription records", {
      actionID,
      error: err
    })
    throw err
  }
}
