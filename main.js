import {styles} from './load.js'
import {result, sleep} from './async.js'
import markdown from './markdown.js'
import highlight from './highlight.js'
import mermaid from './mermaid.js'
import nav from '/nav.js'
import toc from './toc.js'

addEventListener('load', main)

async function main() {
  removeEventListener('load', main)

  const theme = setTheme('dark')

  markdown()
  toc()
  nav()
  highlight()
  result(theme).then(mermaid)
}

async function setTheme(name) {
  let failed = null
  styles(`/${name}.css`).catch(err => failed = err)

  const loaded = () =>
    getComputedStyle(document.documentElement)
      .getPropertyValue('--theme').trim() === name

  while (!loaded()) {
    console.log('theme not loaded, waiting...')
    await sleep(100)
    if (failed) {
      console.error(failed)
      break
    }
  }
  
  const curtain = document.getElementById('__curtain__')
  curtain && curtain.remove()
}