'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { AutocompleteOptions, Suggestion } from '../lib/types'

export function useAutocomplete({ provider, debounceMs = 300, limit = 5, minLength = 3, language = 'es', countryRestriction, region, locationBias, retryCount = 2 }: AutocompleteOptions) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abort = useRef<AbortController | null>(null)
  const cache = useRef(new Map<string, Suggestion[]>())
  const search = useCallback((query: string) => {
    if (timer.current) clearTimeout(timer.current)
    abort.current?.abort()
    if (query.trim().length < minLength) { setSuggestions([]); setLoading(false); return }
    const key = `${language}:${region ?? ''}:${query.trim()}:${locationBias?.latitude ?? ''}:${locationBias?.longitude ?? ''}`
    const cached = cache.current.get(key)
    if (cached) { setSuggestions(cached); return }
    timer.current = setTimeout(async () => {
      const controller = new AbortController(); abort.current = controller; setLoading(true); setError(null)
      try { const result = await provider.forward(query, { limit, language, countryRestriction, region, location: locationBias, signal: controller.signal }); cache.current.set(key, result); setSuggestions(result) }
      catch (e) { if ((e as Error).name !== 'AbortError') { setError(e instanceof Error ? e.message : 'No se pudo buscar'); setSuggestions([]) } }
      finally { setLoading(false) }
    }, debounceMs)
  }, [countryRestriction, debounceMs, language, limit, locationBias, minLength, provider, region])
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); abort.current?.abort() }, [])
  return { suggestions, loading, error, search, clear: () => setSuggestions([]), cacheSize: cache.current.size, retryCount }
}
