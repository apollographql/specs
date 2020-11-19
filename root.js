const src = document.currentScript.src
const baseUrl = src.slice(0, src.length - 'root.js'.length)
const root = new URL(baseUrl).pathname

window.__SITE__ = {
  title: 'specs.apollo.dev',
  baseUrl,
  root,

  /**[begin sitemap]**/
  entries: {
    csdl: {
      title: "Composed Schema Definition Language",
      entries: {
        "0.1": {
          title: "v0.1",
        }
      }
    },
    using: {
      title: "Using Specifications",
      entries: {
        "0.1": {
          title: "v0.1"
        }
      }
    }
  }
  /**[end sitemap]**/
}

const main = Object.assign(document.createElement('script'), {
  src: window.__SITE__.root + 'main.js',
  type: 'module',
  async: true,
  defer: true,
})
document.head.appendChild(main)