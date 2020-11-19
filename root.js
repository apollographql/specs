const src = document.currentScript.src
const root = src.slice(0, src.length - 'root.js'.length)

window.__SITE__ = {
  title: 'specs.apollo.dev',
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
  src: window.__SITE__.root + '/main.js',
  type: 'module',
  async: true,
  defer: true,
})
document.head.appendChild(main)