/**
 * Asynchronously load a non-module script.
 * 
 * @param {string} src 
 * @return {Promise<Event>}
 */
export async function script(src) {
  const existing = document.querySelector(`script[src="${src}"]`)
  if (existing && existing.__loadingPromise)
    return existing.__loadingPromise
  const script = document.createElement('script')
  script.async = true
  script.defer = true
  script.__loadingPromise = new Promise((resolve, reject) => {
    script.onload = resolve
    script.onerror = reject
  })
  script.src = src
  document.body.appendChild(script)
  return script.__loadingPromise
}

/**
 * Asynchronously load a stylesheet.
 * 
 * @param {string} src 
 * @return {Promise<Event>}
 */
export function styles(src) {
  const existing = document.querySelector(`link[rel="stylesheet"][href="${src}"]`)
  if (existing && existing.__loadingPromise)
    return existing.__loadingPromise
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.media = 'print'
  link.__loadingPromise = new Promise((resolve, reject) => {
    link.onload = event => {
      link.media = 'all'
      link.onload = null
      resolve(event)
    }
    link.onerror = reject
  })
  link.href = src
  document.head.appendChild(link)
  return link.__loadingPromise
}
