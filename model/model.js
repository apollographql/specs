export default function model(func) {
  const asyncKey = Symbol('Loading ' + func.name)
  const dataKey = Symbol('Data ' + func.name)
  
  return async function(rsp) {
    const target = rsp || this
    if (target[dataKey]) return target[dataKey]
    if (target[asyncKey]) return target[asyncKey]

    let response
    return target[asyncKey] = Promise.resolve(target)
      .then(r => {
        response = r
        r[asyncKey] = target[asyncKey]
        return func(r)
      })
      .then(val =>
        response[dataKey] = target[dataKey] = val)
  }
}
