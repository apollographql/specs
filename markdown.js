import marked from 'https://unpkg.com/marked@^1/lib/marked.esm.js'
import {go} from './rendering.js'

const reAttr = /#::((\[(?<caption>.*)\])|((?<tag>[a-z]+)\.(?<class>[a-zA-Z_\-]+)))/

const slugger = new marked.Slugger()

const base = new marked.Renderer
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
          ? `<div id="${slug}_diagram" class='mermaid ${classes.div.join(' ')}'>${lines.join('\n')}</div>`
          : `<pre class='language-${lang} ${classes.pre.join(' ')}'><code class='language-${lang} ${classes.code.join(' ')}'>${lines.join('\n')}</code></pre>`
        }
      </figure>
    `
  }

};


marked.use({ renderer });

function render(md) {
  const container = document.createElement('div')
  container.innerHTML = marked(md)
  return container.childNodes
}

function processMarkdown() {
  for (const el of document.querySelectorAll('[markdown]')) {
    el.removeAttribute('markdown')
    for (const child of el.childNodes) {
      if (child.nodeType === Node.TEXT_NODE) {
        child.replaceWith(...render(child.textContent))
      }
    }
  }
}

let Prism = null

export default async function() {
  await go(processMarkdown)

  if (location.hash) {
    const name = location.hash.slice(1)
    const viewElement = document.getElementById(name) ||
      document.getElementsByName(name)[0]
    if (viewElement) setTimeout(() => {
      viewElement.scrollIntoViewIfNeeded()
    }, 100)
  }
}