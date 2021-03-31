import markdown from './markdown.js'
import toc from './toc.js'
import {go} from './rendering.js'

addEventListener('load', main)

async function main() {
  removeEventListener('load', main)

  if (!document.documentElement.dataset.rendered) {
    go(() => Promise.all([
      markdown(),
    ]))
  }

  toc()
}