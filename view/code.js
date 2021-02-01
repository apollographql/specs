import linesOf from '../model/lines.js'
import {highlight} from '/highlight.js'

export default async function(view) {
  const {title, region, extension} = view  

  const lines = await view.get(linesOf)
  const part = lines.slice(region.start.line, region.end?.line)
  const highlighted = await highlight(part.join('\n'), view.extension)
  const hlLines = highlighted.split('\n')

  const highlightSelector = view.getAttribute('highlight')
  const lineHighlight = highlightSelector
    ? eval(highlightSelector)
    : null

  view.output.innerHTML = `
    <figure ${title ? `id="${title}"` : ''}>
      <figcaption>
        <a name="${title}" href="#${title}" class="a-header code">${title}</a>
      </figcaption>
      <pre><code><ol
          style='counter-reset: line ${region.start.line}'
          start=${region.start.line + 1}>${
          hlLines.map(line => 
            `<li ${
              lineHighlight
                ? (lineHighlight(textFromHtml(line), line) ? 'class=highlight' : 'class=lowlight')
                : ''}>${line}`
          ).join('\n')
        }</ol></code>
    </figure>
  `
}

function textFromHtml(str) {
  const d = document.createElement('div')
  d.innerHTML = str
  return d.textContent
}