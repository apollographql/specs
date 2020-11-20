import {sleep} from './async.js'

export default function install(win) {
  createToC(win)
}

export function createToC(win=window, doc=win.document, view=doc.getElementById('view')) {
  const toc = doc.createElement('ol')
  toc.className = 'toc'

  const stack = [
    { el: toc, level: -Infinity },
  ]

  const counters = {
    header: [0, 0, 0, 0, 0],
    fig: 0
  }

  for (const h of doc.querySelectorAll('.a-header')) {
    const item = doc.createElement('li')
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


      const children = doc.createElement('ol')
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

  
  const placeholder = doc.createElement('div')
  placeholder.className = 'toc-placeholder'
  placeholder.textContent=' '
  view.prepend(toc)
  view.prepend(placeholder)

  setTimeout(layoutToc, 250)
  addEventListener('resize', layoutToc)

  async function layoutToc() {
    toc.classList.remove('measured')
    const box = toc.getBoundingClientRect()
    view.style.setProperty('--toc-width', box.width + 'px')
    await sleep(100)
    toc.classList.add('measured')  
  }

  function top() {
    return stack[stack.length - 1]
  }
}
