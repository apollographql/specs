let match

const query = new Map(
  (match = /^\?(?<query>.*)/.exec(location.search))
    ? match.groups.query.split('&')
        .map(pair => {
          const [k, v=true] = pair.split('=').map(decodeURIComponent)
          return [k, v]
        })  
  : [])

export default query
window.__QUERY = query