import {styles, script} from './load.js'

styles('https://unpkg.com/prism-themes@^1/themes/prism-synthwave84.css')

const prism = script('https://unpkg.com/prismjs@^1/components/prism-core.min.js')
  .then(() => script('https://unpkg.com/prismjs@^1/plugins/autoloader/prism-autoloader.min.js'))
  .then(() => window.Prism)

export default async function() {
  (await prism).highlightAll()  
}