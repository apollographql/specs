const puppeteer = require('puppeteer');
const {resolve} = require('path')
 
async function main() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  page.on('console', msg => console.log(msg.text()))
  page.on('pageerror', error => {
    console.log(error.message);
   });
  page.on('response', response => {
    console.log(response.status(), response.url());
  });
  page.on('requestfailed', request => {
    console.log(request.failure().errorText, request.url());
  });  

  const [_node, _main, url] = process.argv
  console.log('Loading', url)
  await page.goto(url)
  console.log(url, 'loaded')

  console.log('Waiting for page to finish rendering...')
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
  console.log('Content rendered.')

  require('fs').writeFileSync('./rendered.html', '<!doctype html>\n' + html, 'utf8')
 
  await browser.close();
}

main()