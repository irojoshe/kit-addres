import type React from 'react'

export type Coordinates = { latitude: number; longitude: number; accuracy?: number }
export type Coords = { lat: number; lng: number; accuracy?: number }
export type AddressSource = 'autocomplete' | 'manual' | 'geolocation'
export type AddressData = { first_name?: string; last_name?: string; phone?: string; address_1: string; address_2?: string; city: string; province?: string; postal_code?: string; country_code: string; coordinates?: Coordinates; source?: AddressSource; verified?: boolean; metadata?: Record<string, unknown> }
export type Suggestion = { placeId: string; description: string; mainText: string; secondaryText: string; coordinates: Coordinates }
export type PlaceResult = AddressData & { id: string; label: string; coords: Coords }
export type RouteResult = { geometry: { type: 'LineString'; coordinates: [number, number][] }; distance: number; duration: number }
export type DistanceMatrix = { distances: number[][]; durations: number[][]; sources: Coordinates[]; destinations: Coordinates[] }
export type GeolocationErrorCode = 'PERMISSION_DENIED' | 'POSITION_UNAVAILABLE' | 'TIMEOUT' | 'NOT_SUPPORTED' | 'HTTPS_REQUIRED' | 'UNKNOWN'
export type GeolocationError = { code: GeolocationErrorCode; message: string }
export type LocationBias = { latitude: number; longitude: number; radius?: number }
export type AddressProviderOptions = { endpoint?: string; fetcher?: typeof fetch; headers?: HeadersInit; retries?: number; retryDelayMs?: number }
export type ForwardOptions = { limit?: number; countryRestriction?: string[]; language?: string; region?: string; location?: LocationBias; signal?: AbortSignal }
export type ReverseOptions = { language?: string; signal?: AbortSignal }
export type AddressProvider = { forward: (query: string, options?: ForwardOptions) => Promise<Suggestion[]>; reverse: (coords: Coordinates, options?: ReverseOptions) => Promise<Partial<AddressData>> }
export type RoutingProvider = { route: (from: Coordinates, to: Coordinates) => Promise<RouteResult>; matrix: (points: Coordinates[]) => Promise<DistanceMatrix> }
export type AddressFormProps = { onSubmit: (address: AddressData) => void | Promise<void>; addressProvider?: AddressProvider; initialAddress?: Partial<AddressData>; initialCoordinates?: Coordinates; initialCoords?: Coords; language?: string; countryRestriction?: string[]; region?: string; locationBias?: LocationBias; showMap?: boolean; showLocationButton?: boolean; className?: string }
export type GeolocationOptions = { timeout?: number; enableHighAccuracy?: boolean; maximumAge?: number }
export type AutocompleteOptions = { provider: AddressProvider; countryRestriction?: string[]; language?: string; region?: string; locationBias?: LocationBias; limit?: number; debounceMs?: number; minLength?: number; retryCount?: number }
export type MapViewProps = { coordinates: Coordinates | null; coords?: Coords | null; height?: number | string; zoom?: number; mapStyle?: string; onMarkerDrag?: (coordinates: Coordinates) => void; attribution?: boolean }
export type LocationButtonProps = { onLocation: (coordinates: Coordinates) => void; onError?: (error: GeolocationError) => void; options?: GeolocationOptions; children?: React.ReactNode }
export type ManualLocationPickerProps = { coordinates: Coordinates | null; onChange: (coordinates: Coordinates) => void; height?: number | string }
export type AddressValidationResult = { success: true; data: AddressData } | { success: false; error: string }
export type UseRoutingResult = { route: RouteResult | null; loading: boolean; error: string | null; recalculate: () => Promise<void> }
export type UseDistanceMatrixResult = { matrix: DistanceMatrix | null; loading: boolean; error: string | null; calculate: (points: Coordinates[]) => Promise<void> }
export const toCoordinates = (coords: Coords | Coordinates): Coordinates => 'lat' in coords ? { latitude: coords.lat, longitude: coords.lng, accuracy: coords.accuracy } : coords
export const toCoords = (coords: Coordinates): Coords => ({ lat: coords.latitude, lng: coords.longitude, accuracy: coords.accuracy })
export const isValidCoordinates = (c: Coordinates) => Number.isFinite(c.latitude) && Number.isFinite(c.longitude) && c.latitude >= -90 && c.latitude <= 90 && c.longitude >= -180 && c.longitude <= 180
export const toLegacyAddress = (address: AddressData) => ({ ...address, metadata: { ...address.metadata, ...(address.coordinates ? { latitude: address.coordinates.latitude, longitude: address.coordinates.longitude, accuracy: address.coordinates.accuracy } : {}) } })
export const ADDRESS_KIT_VERSION = '1.3.0' as const

export function createRetryFetcher(fetcher: typeof fetch, retries = 2, delayMs = 350): typeof fetch {
  return async (input, init) => {
    for (let attempt = 0; ; attempt += 1) {
      try { return await fetcher(input, init) } catch (error) {
        if (init?.signal?.aborted || attempt >= retries) throw error
        await new Promise(resolve => setTimeout(resolve, delayMs * 2 ** attempt))
      }
    }
  }
}

export type AddressFormHandle = { reset: () => void }
export type AddressMessages = { addressLabel?: string; addressPlaceholder?: string; cityPlaceholder?: string; locationButton?: string; locationLoading?: string; submit?: string; required?: string }
export type AddressEvents = { onSuggestionSelect?: (suggestion: Suggestion) => void; onLocationFound?: (coordinates: Coordinates) => void; onAddressSubmit?: (address: AddressData) => void }
