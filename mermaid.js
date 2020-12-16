import {script} from './load.js'
import {addTask} from './rendering.js'

const init = script('https://unpkg.com/mermaid@^8/dist/mermaid.min.js')
  .then(async () => {
    const mermaid = window.mermaid
    await mermaid.initialize({
      securityLevel: 'loose',
      theme: 'dark',
      startOnLoad: false,
    })
    return mermaid
  })

async function renderMermaids() {
  const done = addTask('mermaid')
  try {
    const mermaid = await init
    // for (const fig of document.querySelectorAll('.mermaid')) {
    //   // preserve source
    //   fig.__mermaidSrc = fig.__mermaidSrc || fig.textContent
    // }
    await mermaid.init()
  } finally {
    done()
  }
}

export default function() {
  renderMermaids()
}