'use client'
import { useMemo, useState } from 'react'
import { AddressPicker } from './AddressPicker'
import { LocationButton } from './LocationButton'
import { MapView } from './MapView'
import { createDefaultAddressProvider } from '../lib/providers'
import { validateAddress } from '../lib/validators'
import type { AddressData, AddressFormProps, Coordinates, Suggestion } from '../lib/types'

// Stable default: a fresh `{}` literal per render would retrigger sync effects forever.
const EMPTY_ADDRESS: Partial<AddressData> = {}

export function AddressForm({
  onSubmit,
  addressProvider,
  initialAddress = EMPTY_ADDRESS,
  initialCoordinates,
  initialCoords,
  language = 'es',
  countryRestriction,
  showMap = true,
  showLocationButton = true,
  className,
}: AddressFormProps) {
  // Provider created once per instance, never during prerender of a missing key
  // unless actually needed. Stable across renders while the prop is absent.
  const provider = useMemo(() => addressProvider ?? createDefaultAddressProvider(), [addressProvider])

  // initialAddress is initial-only: consumed once by the state initializer.
  // No sync effect on purpose — syncing a per-render object causes an infinite loop.
  const [address, setAddress] = useState<AddressData>({ address_1: '', city: '', country_code: '', ...initialAddress })
  const [coordinates, setCoordinates] = useState<Coordinates | null>(
    initialCoordinates ?? (initialCoords ? { latitude: initialCoords.lat, longitude: initialCoords.lng, accuracy: initialCoords.accuracy } : null),
  )
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const reverse = async (value: Coordinates, source: AddressData['source']) => {
    setCoordinates(value)
    try {
      const fields = await provider.reverse(value, { language })
      setAddress(current => ({ ...current, ...fields, coordinates: value, source, verified: source === 'autocomplete' }))
    } catch {
      setError('No se pudo convertir la ubicación; completa la dirección manualmente.')
    }
  }

  const select = (suggestion: Suggestion) => {
    setAddress(current => ({ ...current, ...suggestionToAddress(suggestion), coordinates: suggestion.coordinates, source: 'autocomplete', verified: true }))
    setCoordinates(suggestion.coordinates)
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setSuccess(false)
    const result = validateAddress({ ...address, coordinates })
    if (!result.success) return setError(result.error)
    await onSubmit(result.data)
    setSuccess(true)
  }

  return (
    <form className={className} onSubmit={submit}>
      <AddressPicker provider={provider} onSelect={select} language={language} countryRestriction={countryRestriction} />
      <label>Dirección<input value={address.address_1} onChange={e => setAddress({ ...address, address_1: e.target.value, source: 'manual', verified: false })} placeholder="Calle y número" required /></label>
      <div className="address-grid">
        <label>Ciudad<input value={address.city} onChange={e => setAddress({ ...address, city: e.target.value })} required /></label>
        <label>Provincia<input value={address.province ?? ''} onChange={e => setAddress({ ...address, province: e.target.value })} /></label>
        <label>Código postal<input value={address.postal_code ?? ''} onChange={e => setAddress({ ...address, postal_code: e.target.value })} /></label>
        <label>País<input maxLength={2} value={address.country_code} onChange={e => setAddress({ ...address, country_code: e.target.value.toLowerCase() })} required /></label>
      </div>
      {showLocationButton && <LocationButton onLocation={value => reverse(value, 'geolocation')} onError={e => setError(e.message)} />}
      {showMap && <MapView coordinates={coordinates} onMarkerDrag={value => reverse(value, 'manual')} />}
      {error && <p role="alert">{error}</p>}
      {success && <p role="status">Dirección validada y lista para enviar.</p>}
      <button type="submit">Guardar dirección</button>
    </form>
  )
}

function suggestionToAddress(s: Suggestion): Partial<AddressData> {
  return { address_1: s.mainText, city: s.secondaryText.split(',')[0]?.trim() ?? '', country_code: '' }
}
