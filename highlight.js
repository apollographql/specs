import {styles, script} from './load.js'
import {sleep} from './async.js'

styles('https://unpkg.com/prism-themes@^1/themes/prism-synthwave84.css')

const prism = script('https://unpkg.com/prismjs@^1/components/prism-core.min.js')
  .then(() => script('https://unpkg.com/prismjs@^1/plugins/autoloader/prism-autoloader.min.js'))
  .then(() => window.Prism)

export async function highlight(source, language) {
  const Prism = await prism
  console.log('source=', source, 'language=', language)
  Prism.plugins.autoloader.loadLanguages([language])
  let tries = 0
  let lang = Prism.languages[language]
  while (++tries < 10 && !(lang = Prism.languages[language])) await sleep(10 * tries)
  if (!lang) return source
  return Prism.highlight(source, Prism.languages[language])
}

export default async function() {
  (await prism).highlightAll()  
}