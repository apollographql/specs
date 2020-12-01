import linesOf from '../model/lines.js'
import {highlight} from '/highlight.js'

export default async function(view) {
  const {title, region, extension} = view  

  const lines = await view.get(linesOf)
  const part = lines.slice(region.start.line, region.end?.line)
  const highlighted = await highlight(part.join('\n'), view.extension)
  const hlLines = highlighted.split('\n')

  view.output.innerHTML = `
    <figure ${title ? `id="${title}"` : ''}>
      <figcaption>
        <a name="${title}" href="#${title}" class="a-header code">${title}</a>
      </figcaption>
      <pre
        class='language-${extension}'><code class='language-${extension}'><ol
          style='counter-reset: line ${region.start.line}'
          start=${region.start.line + 1}>${
          hlLines.map(line => 
            `<li>${line}`
          ).join('\n')
        }</ol></code>
    </figure>
  `
}