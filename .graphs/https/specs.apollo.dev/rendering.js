const tasks = new Set

let resolveRender = null
export const done = new Promise(resolve => {
  resolveRender = resolve
})

const queue = []

export function addTask(data) {
  const task = { data }
  tasks.add(task)
  return () => {
    tasks.delete(task)
    didFinishTask()
  }  
}

export async function go(func, ...args) {
  const task = {func, args}
  const done = addTask(task)
  try {
    return await func.apply(this, args)
  } finally {
    done()
  }
}

function didFinishTask() {
  if (!tasks.size) {
    if (queue.length) return drain()
    if (typeof window.__didFinishRendering === 'function') {
      return window.__didFinishRendering()
    }
    window.didFinishRendering = true
    resolveRender()
  }
}

import query from './query.js'
export function isPre() {
  return !!query.get('prerender')
}

export function enqueue(func) {
  queue.push(func)
  if (!tasks.size) drain()
}

async function drain() {
  while (queue.length) {
    await queue.pop()()
  }
  didFinishTask()
}