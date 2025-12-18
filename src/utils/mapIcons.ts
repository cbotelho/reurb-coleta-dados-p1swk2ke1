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
  },
  home: {
    path: 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z',
    anchor: { x: 12, y: 20 },
    scale: 1.2,
  },
  star: {
    path: 'M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z',
    anchor: { x: 12, y: 12 },
    scale: 1.2,
  },
  alert: {
    path: 'M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z',
    anchor: { x: 12, y: 21 },
    scale: 1.2,
  },
  flag: {
    path: 'M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6z',
    anchor: { x: 5, y: 21 },
    scale: 1.2,
  },
}

export type IconType = keyof typeof MAP_ICONS

export function getGoogleIconSymbol(
  type: IconType = 'circle',
  color: string = 'blue',
  scale: number = 1,
) {
  if (type === 'circle') {
    return {
      path:
        typeof window !== 'undefined'
          ? window.google?.maps?.SymbolPath?.CIRCLE
          : 0,
      scale: 6 * scale,
      fillColor: color,
      fillOpacity: 1,
      strokeColor: 'white',
      strokeWeight: 1,
    }
  }

  const iconDef = MAP_ICONS[type]

  // To use arbitrary SVG paths in Google Maps, we can use the 'path' property of Symbol
  // However, coordinate systems vary. 'pin' path above is based on a ~24x24 grid (Material Design icons usually)
  // We need to translate it so the anchor is at (0,0) or specify anchor.

  // Simplify: Use path string directly. Google Maps supports SVG path notation.
  // We need to offset the path so (0,0) is the anchor point, OR use the 'anchor' property of Symbol.

  return {
    path: iconDef.path,
    fillColor: color,
    fillOpacity: 1,
    strokeColor: 'white',
    strokeWeight: 1,
    scale: (iconDef.scale || 1) * scale * 0.7, // 0.7 to normalize roughly to previous circle size
    anchor: iconDef.anchor
      ? new window.google.maps.Point(iconDef.anchor.x, iconDef.anchor.y)
      : undefined,
  }
}
