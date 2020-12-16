import model from './model.js'
import text from './text.js'

const lines = response => {
  const t = text(response)
  return t
    .then(txt => txt.split('\n'))
}

export default model(lines)
