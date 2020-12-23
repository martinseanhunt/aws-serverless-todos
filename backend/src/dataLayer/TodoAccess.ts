import * as AWS from 'aws-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'

// fixes type defenitions vs import
const AWSXRay = require('aws-xray-sdk')

import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'

const XAWS = !process.env.IS_OFFLINE ? AWSXRay.captureAWS(AWS) : AWS

import { TodoItem } from '../models/TodoItem'

export class TodoAccess {
  constructor(
    private readonly docClient: DocumentClient = createDynamoDBClient(),
    private readonly todostable = process.env.TODOS_TABLE,
    private readonly todoIdIndex = process.env.TODO_ID_INDEX,
    private readonly s3 = new XAWS.S3({
      signatureVersion: 'v4'
    }),
    private readonly bucketName = process.env.IMAGES_BUCKET_NAME,
    private readonly expirationTime = process.env.SIGNED_URL_EXPIRATION
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
          ':dueDate': updatedTodo.dueDate,
          ':done': updatedTodo.done
        }
      })
      .promise()
  }

  async saveImage(todo: TodoItem, imageUrl: string): Promise<void> {
    await this.docClient
      .update({
        TableName: this.todostable,
        Key: {
          userId: todo.userId,
          createdAt: todo.createdAt
        },
        UpdateExpression: 'SET attachmentUrl = :imageUrl',
        ExpressionAttributeValues: {
          ':imageUrl': imageUrl
        }
      })
      .promise()
  }

  async deleteTodo(todo: TodoItem): Promise<void> {
    await this.docClient
      .delete({
        TableName: this.todostable,
        Key: {
          userId: todo.userId,
          createdAt: todo.createdAt
        }
      })
      .promise()
  }

  async getSignedUrl(imageId: string): Promise<string> {
    const uploadUrl = this.s3.getSignedUrl('putObject', {
      Bucket: this.bucketName,
      Key: imageId,
      Expires: parseInt(this.expirationTime)
    })

    return uploadUrl
  }
}

function createDynamoDBClient() {
  if (process.env.IS_OFFLINE) {
    console.log('Creating a local DynamoDB instance')
    return new XAWS.DynamoDB.DocumentClient({
      region: 'localhost',
      endpoint: 'http://localhost:8000'
    })
  }

  return new XAWS.DynamoDB.DocumentClient()
}
