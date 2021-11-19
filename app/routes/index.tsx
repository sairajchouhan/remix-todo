import type { MetaFunction, LoaderFunction, ActionFunction } from 'remix'
import { useLoaderData, Form, useTransition, json } from 'remix'
import prisma from '../../prisma'
import { Todo } from '@prisma/client'
import { useRef, useEffect } from 'react'

export let meta: MetaFunction = () => {
  return {
    title: 'Remix Todo',
    description: 'Welcime to a yet another todo but with Remix 💿',
  }
}

type LoaderData = {
  todos: Todo[]
}

export let loader: LoaderFunction = async () => {
  const todos: Todo[] = await prisma.todo.findMany({
    orderBy: {
      id: 'asc',
    },
  })
  return { todos: todos }
}

export let action: ActionFunction = async ({ request }) => {
  if (request.method === 'POST') {
    const data = new URLSearchParams(await request.text())
    const title = data.get('title') ?? ''
    const newTodo = await prisma.todo.create({
      data: { completed: false, title },
    })
    return json(newTodo, {
      status: 201,
    })
  }
  if (request.method === 'PUT') {
    const data = new URLSearchParams(await request.text())
    const todoId = data.get('completed')
    console.log(todoId)
    if (!todoId)
      return json(
        { error: 'Todo id must be defined' },
        {
          status: 400,
        }
      )
    const todo = await prisma.todo.findUnique({
      where: {
        id: parseInt(todoId),
      },
    })
    console.log(todo)
    if (!todo) {
      return json(
        { error: 'Todo does not exist' },
        {
          status: 400,
        }
      )
    }
    const updatedTodo = await prisma.todo.update({
      where: {
        id: todo.id,
      },
      data: {
        completed: !todo.completed,
      },
    })
    return json({ todo: updatedTodo }, { status: 200 })
  }
  if (request.method === 'DELETE') {
    const data = new URLSearchParams(await request.text())
    const todoId = data.get('delete')
    console.log(todoId)
    if (!todoId)
      return json(
        { error: 'Todo id must be defined' },
        {
          status: 400,
        }
      )
    const todo = await prisma.todo.findUnique({
      where: {
        id: parseInt(todoId),
      },
    })
    console.log(todo)
    if (!todo) {
      return json(
        { error: 'Todo does not exist' },
        {
          status: 400,
        }
      )
    }
    const deletedTodo = await prisma.todo.delete({
      where: {
        id: todo.id,
      },
    })
    return json({ todo: deletedTodo }, { status: 200 })
  }
  return null
}

export default function Index() {
  let data = useLoaderData<LoaderData>()
  let formRef = useRef<HTMLFormElement | null>(null)
  const transition = useTransition()

  useEffect(() => {
    if (transition.state === 'loading') {
      formRef.current?.reset()
    }
  }, [transition.state])

  return (
    <div style={{ width: '30%', margin: '0 auto', textAlign: 'center' }}>
      <h1>Remix Todo</h1>
      <ul style={{ listStyleType: 'none', padding: '0' }}>
        {data.todos.map((todo) => (
          <li key={todo.id}>
            <div
              style={{
                display: 'flex',
                width: '100%',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <p
                style={{
                  marginRight: '1rem',
                  textDecoration: todo.completed ? 'line-through' : '',
                }}
              >
                {todo.title}
              </p>
              <div style={{ display: 'flex' }}>
                <Form method="put">
                  <input hidden name="completed" defaultValue={todo.id} />
                  <button>{'✅'}</button>
                </Form>
                <Form method="delete">
                  <input hidden name="delete" defaultValue={todo.id} />
                  <button> {'❌'} </button>
                </Form>
              </div>
            </div>
          </li>
        ))}
      </ul>
      <Form ref={formRef} method="post">
        <input name="title" type="text" />
        <button type="submit">Add</button>
      </Form>
    </div>
  )
}
