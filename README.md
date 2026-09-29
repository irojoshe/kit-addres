# react-address-kit

Librería React/TypeScript reutilizable para capturar direcciones sin depender de Google Maps.

## Incluye

- `AddressForm`, `AddressPicker`, `MapView`, `LocationButton` y `ManualLocationPicker`.
- Autocomplete con debounce, cancelación, caché y bias por región o cercanía.
- Reintentos con backoff para fallos temporales de red.
- Mapa MapLibre/OpenFreeMap con marcador arrastrable y fallback manual.
- Geolocalización del navegador con HTTPS, permisos y errores tipados.
- Reverse geocoding con Nominatim.
- Providers intercambiables para dirección y rutas.
- `useRouting` y `useDistanceMatrix` con OSRM.
- Schemas Zod exportables y normalización para Medusa.
- La dependencia de MapLibre es opcional para poder usar solo el formulario.

## Instalación

```bash
pnpm add react-address-kit
```

Instala MapLibre solo si usarás `MapView`:

```bash
pnpm add maplibre-gl
```

En una app Next.js importa el CSS de MapLibre una sola vez:

```tsx
import 'maplibre-gl/dist/maplibre-gl.css'
```

## Uso rápido

```tsx
'use client'

import { AddressForm } from 'react-address-kit'

export function CheckoutAddress() {
  return (
    <AddressForm
      language="es"
      region="es"
      countryRestriction={["es", "mx"]}
      locationBias={{ latitude: 40.4168, longitude: -3.7038, radius: 30 }}
      showMap
      showLocationButton
      onSubmit={async (address) => {
        await fetch('/api/address', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(address),
        })
      }}
    />
  )
}
```

El resultado contiene `coordinates`, `source` (`autocomplete`, `manual` o `geolocation`) y `verified`.

## Providers y bias

Los defaults usan Photon para búsqueda, Nominatim para reverse geocoding y OSRM para rutas. Son servicios públicos sujetos a límites; para producción comercial configura endpoints propios o inyecta un provider compatible:

```tsx
const provider = createPhotonProvider({
  endpoint: process.env.NEXT_PUBLIC_GEOCODER_URL,
  retries: 3,
  retryDelayMs: 500,
})

<AddressForm addressProvider={provider} region="mx" onSubmit={save} />
```

Un `AddressProvider` implementa `forward(query, options)` y `reverse(coordinates, options)`. `forward` recibe `region`, `countryRestriction` y `location`, lo que permite priorizar resultados de una zona sin bloquear el fallback global.

## API pública

```tsx
import {
  AddressForm, AddressPicker, MapView, LocationButton,
  ManualLocationPicker, useGeolocation, useAutocomplete,
  useRouting, useDistanceMatrix, createPhotonProvider,
  createOSRMProvider, validateAddress, AddressDataSchema,
} from 'react-address-kit'
```

`useAutocomplete` expone `suggestions`, `loading`, `error`, `search` y `clear`. Gestiona debounce, AbortController, caché y evita resultados obsoletos cuando el usuario escribe rápido.

## Publicación

```bash
pnpm build:library
pnpm publish --access public
```

Antes de publicar cambia `name`, `repository`, `license` y `version` en `package.json`. La librería requiere React 18+ y funciona con Next.js, Vite, Remix y otras apps React. No incluye autenticación, tracking, offline delivery ni lógica de pedidos: esos flujos pertenecen a la aplicación consumidora.

## Seguridad y límites

- Nunca uses claves privadas de proveedores en componentes cliente.
- La geolocalización requiere HTTPS, excepto localhost, y consentimiento del usuario.
- Configura rate limiting, cache y proxies propios para tráfico de producción.
- Respeta atribución, políticas y licencias de OpenStreetMap y de cada proveedor.
- Si no instalas `maplibre-gl`, no importes `MapView`; el formulario y el autocomplete siguen funcionando.
