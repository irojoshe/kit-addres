'use client'

import { useState } from 'react'
import { AddressForm } from '@/src/components/AddressForm'
import type { AddressData } from '@/src/lib/types'

export default function Page() {
  const [result, setResult] = useState<AddressData | null>(null)

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-10 text-slate-100 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-10 flex flex-col gap-5 border-b border-white/10 pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">react-address-kit · live library</p>
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-6xl">Address input that works anywhere.</h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-400">A provider-agnostic address form with autocomplete, browser location, reverse geocoding and a real draggable map.</p>
          </div>
          <span className="w-fit rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-xs font-medium text-cyan-200">v1.2 · Provider agnostic</span>
        </header>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-5 shadow-2xl shadow-black/20 sm:p-8">
            <div className="mb-7">
              <h2 className="text-xl font-semibold">Drop-in address form</h2>
              <p className="mt-1 text-sm text-slate-400">Try autocomplete or allow location access. The map updates with real coordinates.</p>
            </div>
            <AddressForm
              language="es"
              showMap
              showLocationButton
              className="address-kit-form"
              onSubmit={async (address) => setResult(address)}
            />
          </div>

          <aside className="flex flex-col gap-4">
            <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">What is included</p>
              <ul className="mt-4 flex flex-col gap-3 text-sm text-slate-300">
                <li>Autocomplete with Photon</li><li>Permission-safe geolocation</li><li>Reverse geocoding with Nominatim</li><li>Draggable MapLibre marker</li><li>Normalized Medusa-ready payload</li>
              </ul>
            </div>
            <div className="rounded-3xl border border-white/10 bg-slate-900 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Last payload</p>
              <pre className="mt-4 min-h-28 overflow-auto whitespace-pre-wrap text-xs leading-6 text-cyan-200">{result ? JSON.stringify(result, null, 2) : 'Submit an address to inspect the normalized output.'}</pre>
            </div>
          </aside>
        </section>
      </div>
    </main>
  )
}
