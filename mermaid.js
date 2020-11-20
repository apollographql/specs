import {script} from './load.js'

const init = script('https://unpkg.com/mermaid@^8/dist/mermaid.min.js')
  .then(() => {
    const mermaid = window.mermaid
    mermaid.initialize({
      securityLevel: 'loose',
      theme: 'dark',
      startOnLoad: false,
    })
    return mermaid
  })

async function renderMermaids() {
  const mermaid = await init
  // for (const fig of document.querySelectorAll('.mermaid')) {
  //   // preserve source
  //   fig.__mermaidSrc = fig.__mermaidSrc || fig.textContent
  // }
  mermaid.init()
}

export default function() {
  renderMermaids()
}