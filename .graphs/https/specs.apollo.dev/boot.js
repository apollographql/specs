window.process = window.process || {env: {}}

document.head.appendChild(Object.assign(
  document.createElement('style'), {
    textContent: `
      body {
        background: #FFF;
        color: rgb(90, 98, 112);
        font-size: 18px;
      }

      main[markdown] {
        white-space: pre-line;
        font-family: monospace;
        max-width: 920px;
        margin: auto;
      }

      #view {
        display: flex;
        justify-content: center;
        flex-flow: row nowrap;
      }
    `
  })
)

document.head.appendChild(Object.assign(
  document.createElement('style'), {
    id: '__curtain__',
    textContent: `
      body {
        opacity: 0;
        transition: opacity 1s;
      }
    `
  }
))

document.head.appendChild(Object.assign(
  document.createElement('script'), {
    type: 'module',
    async: true,
    defer: true,
    src: '/main.js',
  }
))

setTimeout(() => __curtain__ && __curtain__.remove(), 200)