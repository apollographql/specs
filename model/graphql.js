import model from './model.js'
import text from './text.js'
import {parse} from 'https://unpkg.com/graphql@15.4.0/index.mjs'

const graphql = req => text(req)
  .then(parse)
  .then(ast => {
    const regions = {}
    for (const d of ast.definitions) {
      if (!d.name) continue
      const name = d.kind === 'DirectiveDefinition'
        ? '@' + d.name.value
        : d.name.value
      regions[name] = {
        start: { line: d.loc.startToken.line - 1 },
        end: { line: d.loc.endToken.line },
      }
    }
    return regions
  })

export default model(graphql)