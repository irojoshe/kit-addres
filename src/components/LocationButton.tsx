'use client'
import { useEffect } from 'react'
import { useGeolocation } from '../hooks/useGeolocation'
import type { LocationButtonProps } from '../lib/types'
export function LocationButton({ onLocation, onError, options, children = 'Usar mi ubicación' }: LocationButtonProps) { const { getLocation, coords, loading, error } = useGeolocation(options); useEffect(() => { if (coords) onLocation(coords) }, [coords, onLocation]); useEffect(() => { if (error) onError?.(error) }, [error, onError]); return <button type="button" onClick={getLocation} disabled={loading} aria-busy={loading}>{loading ? 'Buscando ubicación…' : children}</button> }
