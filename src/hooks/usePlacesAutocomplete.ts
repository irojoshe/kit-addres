'use client'
import { useState } from 'react'
import { useAutocomplete } from './useAutocomplete'
import { createPhotonProvider } from '../lib/providers'
import type { AutocompleteOptions, PlaceResult } from '../lib/types'
type LegacyOptions = Partial<AutocompleteOptions>
export function usePlacesAutocomplete(options: LegacyOptions = {}) { const [query, setQuery] = useState(''); const result = useAutocomplete({ provider: options.provider ?? createPhotonProvider(), language: options.language, limit: options.limit, debounceMs: options.debounceMs, countryRestriction: options.countryRestriction }); const suggestions: PlaceResult[] = result.suggestions.map(s => ({ ...s, id: s.placeId, label: s.description, address_1: s.mainText, city: s.secondaryText.split(',')[0]?.trim() ?? '', country_code: '', coords: { lat: s.coordinates.latitude, lng: s.coordinates.longitude } })); const selectPlace = (place: PlaceResult) => place; return { query, setQuery: (value: string) => { setQuery(value); result.search(value) }, suggestions, loading: result.loading, error: result.error, selectPlace } }
