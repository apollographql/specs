// import marked from 'https://cdn.jsdelivr.net/npm/marked/lib/marked.esm.js'
import marked from 'https://unpkg.com/marked@^1/lib/marked.esm.js'

const reAttr = /#::((\[(?<caption>.*)\])|((?<tag>[a-z]+)\.(?<class>[a-zA-Z_\-]+)))/

const slugger = new marked.Slugger()
const renderer = {
  heading(text, level, _raw) {
    const slug = slugger.slug(text)

    return `
      <h${level}>
        <a name="${slug}"
           class="a-header"
           href="#${slug}"
           data-heading-level=${level}><span
             class=a-header-text>${text}</span></a>
      </h${level}>`;
  },
  code(code, lang, escaped) {
    const lines = code.split(/\n/g)
    let classes = {a: [], pre: [], code: [], div: []}
    let attr, caption
    while (attr = (lines[0] || '').match(reAttr)) {
      lines.shift()
      const {tag, class: cssClass} = attr.groups
      if (tag) {
        classes[tag] && classes[tag].push(cssClass)
      } else {
        caption = attr.groups.caption
      }
    }


    const slug = slugger.slug(caption || 'code')    
    return `
      <figure id='${slug}'>
        ${caption ?
          `<figcaption><a name="${slug}" href="#${slug}" class='a-header ${lang === 'mermaid' ? 'figure' : 'code'} ${classes.a.join(' ')}'>${caption && marked(caption)}</a></figcaption>`
          : ''}
        ${
          lang === 'mermaid'
          ? `<div class='mermaid ${classes.div.join(' ')}'>${lines.join('\n')}</div>`
          : `<pre class='language-${lang} ${classes.pre.join(' ')}'><code class='language-${lang} ${classes.code.join(' ')}'>${lines.join('\n')}</code></pre>`
        }
      </figure>
    `
  }

};

marked.use({ renderer });

import installNav from '/nav.js'

async function main() {
  removeEventListener('load', main)

  const theme = loadStyles('/dark.css')

  processMarkdown()
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

function mdDiv(md) {
  const container = document.createElement('div')
  container.innerHTML = marked(md)
  return container
}

function processMarkdown() {
  for (const el of document.querySelectorAll('[markdown]')) {
    for (const child of el.childNodes) {
      if (child.nodeType === Node.TEXT_NODE) {
        el.replaceChild(mdDiv(child.textContent), child)
      }
    }
  }
}

async function highlightCode() {
  loadStyles('https://unpkg.com/prism-themes@^1/themes/prism-synthwave84.css')
  await loadScript('https://unpkg.com/prismjs@^1/components/prism-core.min.js')
  await loadScript('https://unpkg.com/prismjs@^1/plugins/autoloader/prism-autoloader.min.js')
  window.Prism.highlightAll()
}

async function renderMermaid() {
  await loadScript('https://unpkg.com/mermaid@^8/dist/mermaid.min.js')
  window.mermaid.initialize({theme: 'dark'})
  window.dispatchEvent(new Event('load'))
}

function loadScript(src) {
  const existing = document.querySelector(`script[src="${src}"]`)
  if (existing && existing.__loadingPromise)
    return existing.__loadingPromise
  const script = document.createElement('script')
  script.async = true
  script.defer = true
  console.log(script)
  script.__loadingPromise = new Promise((resolve, reject) => {
    script.onload = resolve
    script.onerror = reject
  })
  script.src = src
  document.body.appendChild(script)
  return script.__loadingPromise
}

function loadStyles(src) {
  const existing = document.querySelector(`link[rel="stylesheet"][href="${src}"]`)
  if (existing && existing.__loadingPromise)
    return existing.__loadingPromise
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.media = 'print'
  link.__loadingPromise = new Promise((resolve, reject) => {
    link.onload = event => {
      link.media = 'all'
      link.onload = null
      resolve(event)
    }
    link.onerror = reject
  })
  link.href = src
  document.head.appendChild(link)
  return link.__loadingPromise
}

function result(promise) {
  return promise.then(ok => ({ ok }), err => ({ err }))
}

function sleep(ms=1000) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
