// Define SVG paths for custom map markers
// These paths are designed to work with Google Maps 'path' symbol
// Scale should be adjusted in the component

export const MAP_ICONS = {
  circle: {
    path: 'M 0,0 m -10,0 a 10,10 0 1,0 20,0 a 10,10 0 1,0 -20,0', // Standard Google Circle path logic
    viewBox: '0 0 20 20',
  },
  pin: {
    path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z M12 11.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
    anchor: { x: 12, y: 22 }, // Rough center bottom
    scale: 1.5,
    viewBox: '0 0 24 24',
  },
  home: {
    path: 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z',
    anchor: { x: 12, y: 20 },
    scale: 1.2,
    viewBox: '0 0 24 24',
  },
  star: {
    path: 'M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z',
    anchor: { x: 12, y: 12 },
    scale: 1.2,
    viewBox: '0 0 24 24',
  },
  alert: {
    path: 'M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z',
    anchor: { x: 12, y: 21 },
    scale: 1.2,
    viewBox: '0 0 24 24',
  },
  flag: {
    path: 'M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6z',
    anchor: { x: 5, y: 21 },
    scale: 1.2,
    viewBox: '0 0 24 24',
  },
}

export type IconType = keyof typeof MAP_ICONS

export function getGoogleIconSymbol(
  type: IconType = 'circle',
  color: string = 'blue',
  scale: number = 1,
) {
  // Guard clause for server-side or early render
  if (typeof window === 'undefined' || !window.google?.maps) {
    return {
      path: 0, // Fallback path
      fillColor: color,
      scale: 1,
    }
  }

  if (type === 'circle') {
    return {
      path: window.google.maps.SymbolPath?.CIRCLE || 0,
      scale: 6 * scale,
      fillColor: color,
      fillOpacity: 1,
      strokeColor: 'white',
      strokeWeight: 1,
    }
  }

  const iconDef = MAP_ICONS[type]

  return {
    path: iconDef.path,
    fillColor: color,
    fillOpacity: 1,
    strokeColor: 'white',
    strokeWeight: 1,
    scale: (iconDef.scale || 1) * scale * 0.7,
    anchor:
      iconDef.anchor && window.google.maps.Point
        ? new window.google.maps.Point(iconDef.anchor.x, iconDef.anchor.y)
        : undefined,
  }
}

// For AdvancedMarkerElement (DOM based)
export function createAdvancedMarkerContent(
  type: IconType = 'circle',
  color: string = 'blue',
  scale: number = 1,
): HTMLElement {
  const container = document.createElement('div')
  container.style.display = 'flex'
  container.style.alignItems = 'center'
  container.style.justifyContent = 'center'

  if (type === 'circle') {
    const size = 12 * scale
    container.style.width = `${size}px`
    container.style.height = `${size}px`
    container.style.backgroundColor = color
    container.style.border = '2px solid white'
    container.style.borderRadius = '50%'
    container.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)'
    return container
  }

  const iconDef = MAP_ICONS[type]
  const svgNS = 'http://www.w3.org/2000/svg'
  const svg = document.createElementNS(svgNS, 'svg')

  // Default size 24x24, scaled
  const baseSize = 24
  const size = baseSize * (iconDef.scale || 1) * scale

  svg.setAttribute('width', `${size}`)
  svg.setAttribute('height', `${size}`)
  svg.setAttribute('viewBox', iconDef.viewBox || '0 0 24 24')
  svg.style.overflow = 'visible'

  const path = document.createElementNS(svgNS, 'path')
  path.setAttribute('d', iconDef.path)
  path.setAttribute('fill', color)
  path.setAttribute('stroke', 'white')
  path.setAttribute('stroke-width', '1')

  svg.appendChild(path)
  container.appendChild(svg)

  return container
}
