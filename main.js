import {script, styles} from './load.js'
import markdown from './markdown.js'
import installNav from '/nav.js'

async function main() {
  removeEventListener('load', main)

  const theme = styles('/dark.css')

  markdown()
  await Promise.all([
    highlightCode(),
    result(theme).then(renderMermaid),
    createTableOfContents(),
    installNav(),
    theme.then(async () => {
      while (!getComputedStyle(document.documentElement).getPropertyValue('--theme-loaded')) {
        await sleep(10)
      }
      const fout = document.getElementById('bootstrap-styles')
      fout.parentNode.removeChild(fout)  
    })    
  ])
}

addEventListener('load', main)


function createTableOfContents(view=document.getElementById('view')) {
  const toc = document.createElement('ol')
  toc.className = 'toc'

  const stack = [
    { el: toc, level: -Infinity },
  ]

  const counters = {
    header: [0, 0, 0, 0, 0],
    fig: 0
  }

  for (const h of document.querySelectorAll('.a-header')) {
    const item = document.createElement('li')
    const a = h.cloneNode(true)
    a.removeAttribute('name')
    a.setAttribute('class', 'toc-link')
    item.appendChild(a)

    const level = h.dataset.headingLevel - 1
    if (level) {
      ++counters.header[level]
      item.dataset.indexPath = counters.header.slice(1, level + 1).join('.')

      while (level <= top().level) {
        counters.header[stack.pop().level + 1] = 0
        counters.fig = 0
      }
      top().el.appendChild(item)


      const children = document.createElement('ol')
      item.appendChild(children)
      stack.push({
        el: children, level
      })
    } else {
      ++counters.fig
      item.dataset.indexPath = counters.header
        .slice(1, 3).join('.') + 
        '.' + counters.fig
      top().el.appendChild(item)
    }
  }

  
  const placeholder = document.createElement('div')
  placeholder.className = 'toc-placeholder'
  placeholder.textContent=' '
  view.prepend(toc)
  view.prepend(placeholder)

  setTimeout(layoutToc, 250)
  addEventListener('resize', layoutToc)

  async function layoutToc() {
    toc.classList.remove('measured')
    const box = toc.getBoundingClientRect()
    console.log('toc size=', box)
    view.style.setProperty('--toc-width', box.width + 'px')
    await sleep(100)
    toc.classList.add('measured')  
  }

  function top() {
    return stack[stack.length - 1]
  }
}


async function highlightCode() {
  styles('https://unpkg.com/prism-themes@^1/themes/prism-synthwave84.css')
  await script('https://unpkg.com/prismjs@^1/components/prism-core.min.js')
  await script('https://unpkg.com/prismjs@^1/plugins/autoloader/prism-autoloader.min.js')
  window.Prism.highlightAll()
}

async function renderMermaid() {
  await script('https://unpkg.com/mermaid@^8/dist/mermaid.min.js')
  window.mermaid.initialize({theme: 'dark'})
  window.dispatchEvent(new Event('load'))
}

function result(promise) {
  return promise.then(ok => ({ ok }), err => ({ err }))
}

function sleep(ms=1000) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
