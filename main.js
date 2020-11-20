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
  await styles(`/${name}.css`)
  let tries = 0
  while (getComputedStyle(document.documentElement).getPropertyValue('--theme') !== name) {
    await sleep(20)
    if (++tries > 10) break
  }
  for (const fout of document.querySelectorAll('style.__bootstrap__')) {
    fout.remove()
  }
}