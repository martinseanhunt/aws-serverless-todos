import * as uuid from 'uuid'

import { TodoItem } from '../models/TodoItem'
import { TodoAccess } from '../dataLayer/TodoAccess'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'
import { parseUserId } from '../auth/utils'

const todoAccess = new TodoAccess()

export async function getAllTodos(userId: string): Promise<TodoItem[]> {
  return todoAccess.getAllTodos(userId)
}

export async function createTodo(
  createTodoRequest: CreateTodoRequest,
  jwtToken: string
): Promise<TodoItem> {
  const itemId = uuid.v4()
  const userId = parseUserId(jwtToken)

  return await todoAccess.createTodo({
    todoId: itemId,
    userId: userId,
    name: createTodoRequest.name,
    createdAt: new Date().toISOString(),
    dueDate: new Date(createTodoRequest.dueDate).toISOString(),
    done: false,
    attachmentUrl: null
  })
}

export async function updateTodo(
  userId: string,
  todoId: string,
  updatedTodo: UpdateTodoRequest
): Promise<TodoItem> {
  // Get the todo item that belongs to a user
  const todo = await todoAccess.getTodo(todoId, userId)

  if (!todo) throw new Error('Todo not found with id for user')

  // update the item
  const updated = await todoAccess.updateTodo(todoId, updatedTodo)

  return updated
}
/*
  
const { groupId, title } = JSON.parse(event.body)

    // imageId
    // tiomestamep

    if (!groupId || !title)
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: 'please provide a group id, title and description',
        }),
      }

    // check if a group with the ID exists
    await docClient
    .get({
      TableName: groupsTable,
      Key: {
        id: groupId,
      },
    })
    .promise()

    // If not, return an error
    if (!validGroupId.Item)
      return {
        statusCode: 404,
        body: JSON.stringify({
          error: 'group not found',
        }),
      }

    const imageId = uuid.v4()

    

*/
