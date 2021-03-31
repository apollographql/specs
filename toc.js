import {enqueue} from './rendering.js'

export default function install(win=window) {
  enqueue(() => {
    const sidenav = document.getElementById('sidenav')
    const doc = win.document
    createToC(win, doc, sidenav)
  })
}

export function createToC(win=window, doc=win.document, view=doc.getElementById('sidenav')) {
  const [existing] = view.getElementsByClassName('toc')
  if (existing) return existing

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

  view.append(toc)
  return toc

  function top() {
    return stack[stack.length - 1]
  }
}
