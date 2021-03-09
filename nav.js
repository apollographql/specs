/**
 * 
 * @param {HTMLDocument} doc 
 */
export function metadata(doc=document) {
  const description = (doc.head.querySelector('meta[name="description"]') || {}).content  
  const href = doc.location.pathname
  const path = href.split('/')  
  const key = path.pop() || path.pop()

  return {
    key,
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
    .then(md => ({ href, ...md, key: title }))
    .catch(() => ({
      title, href, key: title
    }))
}


export default function install(win=window) {
  const {document, location} = window
  const nav = document.createElement('nav')
  nav.className = 'site-nav slices top-left'
  document.body.append(nav)

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

function navSlice(item) {
  console.log(item)
  const { key, title, href } = item
  return Object.assign(document.createElement('a'), {
    href,
    className: 'slice',
    textContent: key && key !== title ? `${key}: ${title}` : title,
  })
}
