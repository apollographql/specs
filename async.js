/**
 * Convert a fallible Promise<T> to an infallible Promise<{ ok?: T, err?: Error }>.
 * 
 * @param {Promise<T>} promise 
 * @return {Promise<{ ok?: T, err: Error }>}
 */
export function result(promise) {
  return promise.then(ok => ({ ok }), err => ({ err }))
}

/**
 * Await a DOM event, then detach the listener.
 * 
 * @param {string} event name
 * @param {HTMLElement} listen on
 * @return {Promise<Event>}
 */
export function event(event='load', element=window) {
  return new Promise(resolve => {
    element.addEventListener(event, fire)

    function fire(evt) {
      resolve(evt)
      element.removeEventListener(event, fire)
    }
  })
}

/**
 * Approximate timeout.
 * 
 * @param {number} ms 
 * @return {Promise<void>}
 */
export function sleep(ms=1000) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
