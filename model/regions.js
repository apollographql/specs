import model from './model.js'
import linesOf from './lines.js'

const START_REGION = /#region (?<name>[a-zA-Z0-9_-]+)/
const END_REGION = /#(?<isEnd>end)region/

export default model(async function regions(response) {
  const lines = await linesOf(response)
  const regions = {}
  let current = null
  for (let i = 0; i !== lines.length; ++i) {
    const line = lines[i]
    const mark = START_REGION.exec(line) || END_REGION.exec(line)
    if (mark) {
      if (current) {
        current.end = { line: i }
        regions[current.name] = current
        current = null
      }
      if (mark.groups.name) {
        current = {
          name: mark.groups.name,
          start: { line: i }
        }
      }
    }
  }
  return regions
})
