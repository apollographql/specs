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
 * Approximate timeout.
 * 
 * @param {number} ms 
 * @return {Promise<void>}
 */
export function sleep(ms=1000) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
