import * as uuid from 'uuid'

import { TodoItem } from '../models/TodoItem'
import { TodoAccess } from '../dataLayer/TodoAccess'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'
import { createLogger } from '../utils/logger'

const logger = createLogger('auth')
const todoAccess = new TodoAccess()

export async function getAllTodos(userId: string): Promise<TodoItem[]> {
  logger.info('Getting all TODOs', {
    user: userId
  })

  return todoAccess.getAllTodos(userId)
}

export async function createTodo(
  createTodoRequest: CreateTodoRequest,
  userId: string
): Promise<TodoItem> {
  const itemId = uuid.v4()

  const item = await todoAccess.createTodo({
    todoId: itemId,
    userId: userId,
    name: createTodoRequest.name,
    createdAt: new Date().toISOString(),
    dueDate: new Date(createTodoRequest.dueDate).toISOString(),
    done: false,
    attachmentUrl: null
  })

  logger.info('ITEM CREATED', {
    item
  })

  return item
}

export async function updateTodo(
  userId: string,
  todoId: string,
  updatedTodo: UpdateTodoRequest
): Promise<void> {
  // Get the todo item that belongs to a user
  const todo = await todoAccess.getTodo(todoId, userId)

  if (!todo) {
    logger.info('TODO NOT FOUND', {
      todoId,
      userId
    })

    throw new Error('Todo not found with id for user')
  }

  // update the item
  await todoAccess.updateTodo(todo, updatedTodo)

  logger.info('TODO UPDATED', {
    todoId,
    userId
  })
}

export async function deleteTodo(
  userId: string,
  todoId: string
): Promise<void> {
  // Get the todo item that belongs to a user
  const todo = await todoAccess.getTodo(todoId, userId)

  if (!todo) {
    logger.info('TODO NOT FOUND', {
      todoId,
      userId
    })
    throw new Error('Todo not found with id for user')
  }

  // delete the item
  await todoAccess.deleteTodo(todo)

  logger.info('DELETED TODO', {
    todoId,
    userId
  })
}

export async function getSignedUrl(
  todoId: string,
  userId: string
): Promise<string> {
  const todo = await todoAccess.getTodo(todoId, userId)

  if (!todo) {
    logger.info('TODO NOT FOUND', {
      todoId,
      userId
    })
    throw new Error('Todo not found with id for user')
  }

  const imageId = `${todoId}-${new Date().toISOString()}`

  const signedUrl = await todoAccess.getSignedUrl(imageId)

  const imageUrl = `https://${process.env.IMAGES_BUCKET_NAME}.s3.amazonaws.com/${imageId}`

  logger.info('SIGNED URL GENERATED', {
    todoId,
    imageUrl
  })

  await todoAccess.saveImage(todo, imageUrl)

  logger.info('SAVED IMAGE URL', {
    todoId,
    imageUrl
  })

  return signedUrl
}
