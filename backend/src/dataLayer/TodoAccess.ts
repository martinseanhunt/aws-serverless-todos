import * as AWS from 'aws-sdk'
// import * as AWSXRay from 'aws-xray-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'

import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'

// TODO: implement Xray tracing
// const XAWS = AWSXRay.captureAWS(AWS)
const XAWS = AWS

import { TodoItem } from '../models/TodoItem'

export class TodoAccess {
  constructor(
    private readonly docClient: DocumentClient = createDynamoDBClient(),
    private readonly todostable = process.env.TODOS_TABLE,
    private readonly todoIdIndex = process.env.TODO_ID_INDEX
  ) {}

  async getAllTodos(userId: string): Promise<TodoItem[]> {
    console.log('Getting all todos for user: ' + userId)

    const result = await this.docClient
      .query({
        TableName: this.todostable,
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': userId
        }
      })
      .promise()

    const items = result.Items
    return items as TodoItem[]
  }

  async createTodo(todo: TodoItem): Promise<TodoItem> {
    await this.docClient
      .put({
        TableName: this.todostable,
        Item: todo
      })
      .promise()

    return todo
  }

  async getTodo(todoId: string, userId: string): Promise<TodoItem | null> {
    const todo = await this.docClient
      .query({
        TableName: this.todostable,
        IndexName: this.todoIdIndex,
        KeyConditionExpression: 'todoId = :todoId AND userId = :userId',
        ExpressionAttributeValues: {
          ':todoId': todoId,
          ':userId': userId
        }
      })
      .promise()

    console.log(todo)

    if (!todo.Items.length) return null
    return todo.Items[0] as TodoItem
  }

  async updateTodo(
    todo: TodoItem,
    updatedTodo: UpdateTodoRequest
  ): Promise<void> {
    await this.docClient
      .update({
        TableName: this.todostable,
        Key: {
          userId: todo.userId,
          createdAt: todo.createdAt
        },
        UpdateExpression:
          'SET #N = :todoName, dueDate = :dueDate, done = :done',
        ExpressionAttributeNames: {
          '#N': 'name'
        },
        ExpressionAttributeValues: {
          ':todoName': updatedTodo.name,
          ':dueDate': updatedTodo.name,
          ':done': updatedTodo.done
        }
      })
      .promise()
  }
}

function createDynamoDBClient() {
  /* TODO: set this up for offline DB
  if (process.env.IS_OFFLINE) {
    console.log('Creating a local DynamoDB instance')
    return new XAWS.DynamoDB.DocumentClient({
      region: 'localhost',
      endpoint: 'http://localhost:8000'
    })
  }
  */

  // @ts-ignore - TODO
  return new XAWS.DynamoDB.DocumentClient()
}
