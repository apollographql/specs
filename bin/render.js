const puppeteer = require('puppeteer')
const {writeFileSync, fstat} = require('fs')
const {resolve} = require('path')

const log = (...args) => console.error(...args)
const writeHtml = (filename, html) =>
  console.log(`<!doctype html>\n${html}`)
  // writeFileSync(filename, '<!doctype html>\n' + html, 'utf8')

async function main() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  page.on('console', msg => log(msg.text()))
  page.on('pageerror', error => log)
  page.on('response', response => log(response.status(), response.url()))
  page.on('requestfailed', request =>
    log(request.failure().errorText, request.url()))

  const [_node, _main, url] = process.argv
  log('Loading', url)
  await page.goto(url)
  log(url, 'loaded')

  log('Waiting for page to finish rendering...')
  const html = await page.evaluate(() => new Promise(resolve => {
    if (window.__didFinishRendering) return resolveText()
    window.__didFinishRendering = resolveText
    
    function resolveText() {
      document.documentElement.dataset.rendered = true
      for (const element of document.querySelectorAll('[\\:\\:save="off"]'))
        element.remove()
      resolve(document.documentElement.outerHTML)
    }
  }))
  log('Content rendered.')
  writeHtml('rendered.html', html)
 
  await browser.close();
}

main()