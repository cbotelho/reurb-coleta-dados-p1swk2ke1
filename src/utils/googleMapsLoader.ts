declare global {
  interface Window {
    google: any
  }
}

export const loadGoogleMapsApi = (apiKey: string): void => {
  if (typeof window === 'undefined') return

  // Check if importLibrary is already available
  if (window.google?.maps?.importLibrary)
    return // Google Maps Bootstrap Loader
    // Source: https://developers.google.com/maps/documentation/javascript/load-maps-js-api
    /* eslint-disable */
  ;(function (g: any) {
    var h: any,
      a: any,
      k: any,
      p = 'The Google Maps JavaScript API',
      c = 'google',
      l = 'importLibrary',
      q = '__ib__',
      m = document,
      b = window as any
    b = b[c] || (b[c] = {})
    var d = b.maps || (b.maps = {}),
      r = new Set(),
      e = new URLSearchParams(),
      u = () =>
        h ||
        (h = new Promise(async (f, n) => {
          await (a = m.createElement('script'))
          e.set('libraries', [...r] + '')
          for (k in g)
            e.set(
              k.replace(/[A-Z]/g, (t: any) => '_' + t[0].toLowerCase()),
              g[k],
            )
          e.set('callback', c + '.maps.' + q)
          a.src = `https://maps.${c}apis.com/maps/api/js?` + e
          d[q] = f
          a.onerror = () => (h = n(Error(p + ' could not load.')))
          a.nonce = (m.querySelector('script[nonce]') as any)?.nonce || ''
          m.head.append(a)
        }))
    d[l]
      ? console.warn(p + ' only loads once. Ignoring:', g)
      : (d[l] = (f: any, ...n: any) =>
          r.add(f) && u().then(() => d[l](f, ...n)))
  })({
    key: apiKey,
    v: 'weekly',
  })
  /* eslint-enable */
}
