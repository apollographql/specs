import model from './model.js'
import text from './text.js'
import {parse} from 'https://unpkg.com/graphql@15.4.0/index.mjs'

const graphql = req => text(req)
  .then(parse)
  .then(ast => {
    const regions = {}
    let schemaIndex = 0
    for (const d of ast.definitions) {
      const name =
        d.kind === 'DirectiveDefinition'
          ? '@' + d.name.value 
          :
        d.kind === 'SchemaDefinition'
          ? `schema[${schemaIndex++}]`
          : d.name && d.name.value
      if (!name) continue
      regions[name] = {
        start: { line: d.loc.startToken.line - 1 },
        end: { line: d.loc.endToken.line },
      }

      for (const f of d.fields || []) {
        regions[name + '.' + f.name.value] = {
          start: { line: f.loc.startToken.line - 1 },
          end: { line: f.loc.endToken.line },          
        }
      }

      if (name.endsWith('[0]')) {
        regions[name.substr(0, name.length - '[0]'.length)] = regions[name]
      }
    }
    return regions
  })

export default model(graphql)