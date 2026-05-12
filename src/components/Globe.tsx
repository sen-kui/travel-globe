import { useRef, useState, useEffect, useCallback } from 'react'
import GlobeGL, { type GlobeMethods } from 'react-globe.gl'
import type { Destination, FilterState } from '../types'
import { REGION_COLORS } from '../types'

interface GlobeProps {
  destinations: Destination[]
  filteredDestinations: Destination[]
  filterState: FilterState
  selectedDestination: Destination | null
  onSelectDestination: (d: Destination | null) => void
}

interface GeoFeature {
  type: string
  properties: Record<string, string | number | undefined>
  geometry: object
  id?: string | number
}

export default function Globe({
  destinations,
  filteredDestinations,
  selectedDestination,
  onSelectDestination,
}: GlobeProps) {
  const globeRef = useRef<GlobeMethods>(undefined!)
  const [geoData, setGeoData] = useState<GeoFeature[]>([])
  const [hoveredFeature, setHoveredFeature] = useState<GeoFeature | null>(null)
  const [size, setSize] = useState({ width: window.innerWidth, height: window.innerHeight })

  // Maps for quick lookup
  const filteredIsoSet = new Set(filteredDestinations.map((d) => d.isoA3.toUpperCase()))
  const allIsoMap = new Map(destinations.map((d) => [d.isoA3.toUpperCase(), d]))

  // Track window size
  useEffect(() => {
    const onResize = () => setSize({ width: window.innerWidth, height: window.innerHeight })
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // Load GeoJSON with ISO codes
  useEffect(() => {
    const urls = [
      'https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_110m_admin_0_countries.geojson',
      'https://cdn.jsdelivr.net/npm/world-countries/countries.geojson',
    ]

    const tryFetch = async () => {
      for (const url of urls) {
        try {
          const r = await fetch(url)
          if (!r.ok) continue
          const data = await r.json() as { features: GeoFeature[] }
          if (data.features?.length) {
            setGeoData(data.features)
            return
          }
        } catch {
          // try next
        }
      }
    }

    tryFetch()
  }, [])

  // Set initial camera
  useEffect(() => {
    if (globeRef.current) {
      globeRef.current.pointOfView({ lat: 25, lng: 110, altitude: 2.2 }, 0)
    }
  }, [geoData])

  const getIso = useCallback((feat: object): string => {
    const f = feat as GeoFeature
    const iso =
      (f.properties?.iso_a3 as string) ||
      (f.properties?.ISO_A3 as string) ||
      (f.properties?.ADM0_A3 as string) ||
      ''
    return iso.toUpperCase()
  }, [])

  const getCapColor = useCallback(
    (feat: object): string => {
      const iso = getIso(feat)
      const dest = allIsoMap.get(iso)
      if (!dest) return '#131d35'

      if (selectedDestination?.isoA3.toUpperCase() === iso) {
        return 'rgba(255,255,255,0.92)'
      }

      const isHovered = (hoveredFeature && getIso(hoveredFeature) === iso)
      if (filteredIsoSet.has(iso)) {
        const color = REGION_COLORS[dest.region] || '#4f8ef7'
        const alpha = isHovered ? 0.9 : 0.65
        return hexToRgba(color, alpha)
      }

      return '#1b2848'
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedDestination, hoveredFeature, filteredIsoSet, allIsoMap],
  )

  const getStrokeColor = useCallback(
    (feat: object): string => {
      const iso = getIso(feat)
      if (selectedDestination?.isoA3.toUpperCase() === iso) return 'rgba(255,255,255,0.8)'
      if (filteredIsoSet.has(iso)) return 'rgba(255,255,255,0.2)'
      return 'rgba(255,255,255,0.05)'
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedDestination, filteredIsoSet],
  )

  const getLabel = useCallback(
    (feat: object): string => {
      const iso = getIso(feat)
      const dest = allIsoMap.get(iso)
      if (!dest) return ''
      return `<div style="background:rgba(10,15,30,0.92);border:1px solid rgba(79,142,247,0.4);border-radius:8px;padding:8px 12px;font-size:13px;color:#e2e8f0;pointer-events:none;white-space:nowrap">
        <div style="font-weight:600">${dest.flag} ${dest.nameCN}</div>
        <div style="color:#94a3b8;margin-top:2px;font-size:11px">${dest.nameEN} · ${dest.region}</div>
      </div>`
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allIsoMap],
  )

  const handlePolygonClick = useCallback(
    (feat: object) => {
      const iso = getIso(feat)
      const dest = allIsoMap.get(iso)
      if (dest) {
        onSelectDestination(dest)
        globeRef.current?.pointOfView(
          { lat: dest.lat, lng: dest.lng, altitude: 1.8 },
          1000,
        )
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allIsoMap, onSelectDestination],
  )

  const handlePolygonHover = useCallback((feat: object | null) => {
    setHoveredFeature(feat as GeoFeature | null)
  }, [])

  // Fly to selected destination
  useEffect(() => {
    if (selectedDestination && globeRef.current) {
      globeRef.current.pointOfView(
        { lat: selectedDestination.lat, lng: selectedDestination.lng, altitude: 1.8 },
        1000,
      )
    }
  }, [selectedDestination])

  return (
    <GlobeGL
      ref={globeRef}
      width={size.width}
      height={size.height}
      backgroundColor="rgba(0,0,0,0)"
      globeImageUrl={null as unknown as string}
      atmosphereColor="#4f8ef7"
      atmosphereAltitude={0.15}
      polygonsData={geoData}
      polygonCapColor={getCapColor}
      polygonSideColor={() => 'rgba(79,142,247,0.04)'}
      polygonStrokeColor={getStrokeColor}
      polygonLabel={getLabel}
      onPolygonClick={handlePolygonClick}
      onPolygonHover={handlePolygonHover}
    />
  )
}

function hexToRgba(hex: string, alpha: number): string {
  if (!hex.startsWith('#')) return hex
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}
