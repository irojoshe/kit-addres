import type { AddressProvider, Coordinates, DistanceMatrix, RoutingProvider, RouteResult, Suggestion, AddressData, AddressProviderOptions, ForwardOptions } from './types'
import { createRetryFetcher } from './types'

const json = async (res: Response) => { if (!res.ok) throw new Error(`Provider error: ${res.status}`); return res.json() }
const query = (params: Record<string, string | number | undefined>) => new URLSearchParams(Object.entries(params).filter(([, value]) => value !== undefined).map(([key, value]) => [key, String(value)]))

export function createLocationIQProvider(options: AddressProviderOptions & { apiKey?: string } = {}): AddressProvider {
  const apiKey = options.apiKey ?? process.env.NEXT_PUBLIC_LOCATIONIQ_KEY
  if (!apiKey) throw new Error('LocationIQ API key requerida: configura NEXT_PUBLIC_LOCATIONIQ_KEY')
  const endpoint = options.endpoint ?? 'https://us1.locationiq.com/v1'
  const fetcher = createRetryFetcher(options.fetcher ?? fetch, options.retries ?? 2, options.retryDelayMs ?? 350)
  return {
    async forward(text, opts: ForwardOptions = {}) {
      const params = query({ key: apiKey, q: text, format: 'json', limit: opts.limit ?? 5, 'accept-language': opts.language ?? 'es', countrycodes: opts.countryRestriction?.join(','), lat: opts.location?.latitude, lon: opts.location?.longitude })
      const data = await json(await fetcher(`${endpoint}/search?${params}`, { signal: opts.signal, headers: { Accept: 'application/json', ...options.headers } }))
      return (Array.isArray(data) ? data : []).map((item: any, index: number): Suggestion => ({ placeId: String(item.place_id ?? `${item.lat}-${item.lon}-${index}`), description: item.display_name ?? text, mainText: item.address?.road ?? item.address?.pedestrian ?? item.display_name?.split(',')[0] ?? text, secondaryText: [item.address?.city ?? item.address?.town ?? item.address?.village, item.address?.state, item.address?.country].filter(Boolean).join(', '), coordinates: { latitude: Number(item.lat), longitude: Number(item.lon) } }))
    },
    async reverse(coords, opts = {}) {
      const params = query({ key: apiKey, format: 'json', lat: coords.latitude, lon: coords.longitude, 'accept-language': opts.language ?? 'es' })
      const data = await json(await fetcher(`${endpoint}/reverse?${params}`, { signal: opts.signal, headers: { Accept: 'application/json', ...options.headers } }))
      const a = data.address ?? {}
      return { address_1: [a.road ?? a.pedestrian ?? a.footway, a.house_number].filter(Boolean).join(' '), city: a.city ?? a.town ?? a.village ?? a.municipality ?? '', province: a.state ?? a.region ?? '', postal_code: a.postcode ?? '', country_code: a.country_code ?? '', metadata: { provider: 'locationiq' } } as Partial<AddressData>
    },
  }
}

export function createDefaultAddressProvider(): AddressProvider {
  return createLocationIQProvider()
}

export function createPhotonProvider(options: AddressProviderOptions = {}): AddressProvider {
  const endpoint = options.endpoint ?? 'https://photon.komoot.io'
  const fetcher = createRetryFetcher(options.fetcher ?? fetch, options.retries ?? 2, options.retryDelayMs ?? 350)
  return {
    async forward(text, opts: ForwardOptions = {}) {
      const params = query({ q: text, limit: opts.limit ?? 5, lang: opts.language ?? 'es', lat: opts.location?.latitude, lon: opts.location?.longitude })
      const data = await json(await fetcher(`${endpoint}/api/?${params}`, { signal: opts.signal, headers: options.headers }))
      return (data.features ?? []).filter((feature: any) => !opts.region || feature.properties?.countrycode?.toLowerCase() === opts.region.toLowerCase()).map((feature: any): Suggestion => ({ placeId: String(feature.properties?.osm_id ?? crypto.randomUUID()), description: [feature.properties?.name, feature.properties?.street, feature.properties?.city, feature.properties?.country].filter(Boolean).join(', '), mainText: feature.properties?.name || feature.properties?.street || '', secondaryText: [feature.properties?.city, feature.properties?.country].filter(Boolean).join(', '), coordinates: { latitude: feature.geometry.coordinates[1], longitude: feature.geometry.coordinates[0] } }))
    },
    async reverse(coords, opts = {}) {
      const params = query({ format: 'jsonv2', lat: coords.latitude, lon: coords.longitude, 'accept-language': opts.language ?? 'es' })
      const data = await json(await fetcher(`https://nominatim.openstreetmap.org/reverse?${params}`, { signal: opts.signal, headers: { Accept: 'application/json', ...options.headers } }))
      const a = data.address ?? {}
      return { address_1: [a.road, a.house_number].filter(Boolean).join(' '), city: a.city ?? a.town ?? a.village ?? '', province: a.state ?? '', postal_code: a.postcode ?? '', country_code: a.country_code ?? '' } as Partial<AddressData>
    },
  }
}

export function createOSRMProvider(options: AddressProviderOptions = {}): RoutingProvider {
  const endpoint = options.endpoint ?? 'https://router.project-osrm.org'
  const fetcher = createRetryFetcher(options.fetcher ?? fetch, options.retries ?? 2, options.retryDelayMs ?? 350)
  return { async route(from, to): Promise<RouteResult> { const data = await json(await fetcher(`${endpoint}/route/v1/driving/${from.longitude},${from.latitude};${to.longitude},${to.latitude}?overview=full&geometries=geojson`, { headers: options.headers })); const route = data.routes?.[0]; if (!route) throw new Error('No se encontró una ruta'); return { geometry: route.geometry, distance: route.distance, duration: route.duration } }, async matrix(points): Promise<DistanceMatrix> { if (points.length < 2 || points.length > 100) throw new Error('La matriz requiere entre 2 y 100 puntos'); const coords = points.map(p => `${p.longitude},${p.latitude}`).join(';'); const data = await json(await fetcher(`${endpoint}/table/v1/driving/${coords}?annotations=distance,duration`, { headers: options.headers })); return { distances: data.distances, durations: data.durations, sources: points, destinations: points } } }
}
