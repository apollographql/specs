/**
 * 
 * @param {HTMLDocument} doc 
 */
export function metadata(doc=document) {
  const description = (doc.head.querySelector('meta[name="description"]') || {}).content
  const href = new URL(document.location)
  href.hash = ''
  return {
    title: doc.title,
    description,
    href,
  }
}

/**
 * 
 * @param {URL} url 
 */
async function fetchMetadata(path, mdFile='__meta__.json') {
  const title = path[path.length - 1]
  const base = path.join('/')
  const href = base || '/'
  return fetch(base + '/' + mdFile)
    .then(response => response.json())    
    .then(md => ({ href, ...md }))
    .catch(() => ({
      title, href
    }))
}

export default function install(win=window) {
  const {document, location} = window
  const nav = document.createElement('nav')
  nav.className = 'slices top-left'
  document.body.prepend(nav)

  addEventListener('popstate', onNavigate)
  onNavigate()
  
  async function onNavigate() {
    nav.innerHTML = ''
    nav.prepend(navSlice(metadata(document)))
    const path = location.pathname.split('/')
    while (path.length && !path.pop());
    while (path.length) {
      nav.prepend(navSlice(await fetchMetadata(path)))
      path.pop()
    }
  }
}

function navSlice({ title, href }) {
  return Object.assign(document.createElement('a'), {
    href,
    className: 'slice',
    textContent: title,
  })
}

// function createNav() {   
//   compileRoutes(window.__SITE__)
//   // const container = document.createElement('nav')
//   // document.body.prepend(container)

//   // const rightNav = document.createElement('div')
//   // rightNav.className = 'slices top-right'
//   // container.prepend(rightNav)

//   const nav = document.createElement('nav')
//   nav.className = 'slices top-left'
//   document.body.prepend(nav)

//   addEventListener('popstate', onChange)
//   onChange()

//   function onChange() {
//     const self = window.__SITE__[currentPath()] || {}
//     const {path, parent} = self
//     nav.innerHTML = ''
//     if (!path) return
//     for (const node of path) {
//       nav.appendChild(navSlice(node))
//     }

//     // nav.innerHTML = ''    
//     if (parent.entries.length === 1) return

//     nav.appendChild(Object.assign(document.createElement('label'), {
//       textContent: 'see also:',
//       className: 'slice',
//     }))

//     for (const other of Object.values(parent.entries)) {
//       if (self === other) continue
//       nav.appendChild(navSlice(other))
//     }
//   }
// }
