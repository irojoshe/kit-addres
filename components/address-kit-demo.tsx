'use client'

import { useMemo, useState } from 'react'
import { Check, ChevronDown, Crosshair, MapPin, Navigation, Search, ShieldCheck, Sparkles } from 'lucide-react'

type Address = { address_1: string; city: string; province: string; postal_code: string; country_code: string }

type Suggestion = { title: string; detail: string; value: Address }

const suggestions: Suggestion[] = [
  { title: 'Calle de Alcalá, 42', detail: '28014 Madrid, España', value: { address_1: 'Calle de Alcalá, 42', city: 'Madrid', province: 'Madrid', postal_code: '28014', country_code: 'es' } },
  { title: 'Calle de Alcalá, 56', detail: '28014 Madrid, España', value: { address_1: 'Calle de Alcalá, 56', city: 'Madrid', province: 'Madrid', postal_code: '28014', country_code: 'es' } },
  { title: 'Calle de Alcalá, 80', detail: '28009 Madrid, España', value: { address_1: 'Calle de Alcalá, 80', city: 'Madrid', province: 'Madrid', postal_code: '28009', country_code: 'es' } },
]

const emptyAddress: Address = { address_1: '', city: '', province: '', postal_code: '', country_code: '' }

export function AddressKitDemo() {
  const [address, setAddress] = useState<Address>(emptyAddress)
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)
  const [locating, setLocating] = useState(false)
  const [saved, setSaved] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [locationError, setLocationError] = useState('')
  const [coordinates, setCoordinates] = useState({ latitude: 40.4168, longitude: -3.7038, accuracy: 12 })

  const matches = useMemo(() => query.trim().length >= 3 ? suggestions.filter((item) => item.title.toLowerCase().includes(query.toLowerCase())) : [], [query])
  const update = (field: keyof Address, value: string) => { setAddress((current) => ({ ...current, [field]: value })); setSaved(false); setSubmitted(false) }
  const choose = (item: Suggestion) => { setAddress(item.value); setQuery(item.title); setFocused(false); setSaved(false) }
  const locate = () => {
    setLocationError('')
    if (!navigator.geolocation) {
      setLocationError('La geolocalización no está disponible en este navegador.')
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords
        setCoordinates({ latitude, longitude, accuracy: Math.round(accuracy) })
        setLocating(false)
        choose(suggestions[0])
      },
      (error) => {
        setLocating(false)
        setLocationError(error.code === error.PERMISSION_DENIED ? 'Permiso rechazado. Puedes completar la dirección manualmente.' : 'No pudimos obtener tu ubicación. Inténtalo de nuevo o escríbela manualmente.')
      },
      { timeout: 10000, enableHighAccuracy: false, maximumAge: 60000 },
    )
  }
  const submit = (event: React.FormEvent) => { event.preventDefault(); setSaved(true); setSubmitted(true) }

  return (
    <div className="min-h-screen bg-[#f7f9fc] text-[#17212b]">
      <header className="border-b border-[#e6ebf1] bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-[72px] max-w-[1240px] items-center justify-between px-5 sm:px-8">
          <div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-[11px] bg-[#155eef] text-white shadow-[0_5px_14px_rgba(21,94,239,.25)]"><MapPin size={19} strokeWidth={2.5} /></div><span className="text-[17px] font-semibold tracking-[-.02em]">react-address-kit</span></div>
          <div className="flex items-center gap-3 text-xs font-medium text-[#718096]"><span className="hidden rounded-full bg-[#eef8f2] px-2.5 py-1 text-[#258653] sm:inline">Stable release</span><span>v1.0.0</span><span className="h-1 w-1 rounded-full bg-[#b7c1cc]" /><span>React 18+</span></div>
        </div>
      </header>
      <main className="mx-auto max-w-[1240px] px-5 py-10 sm:px-8 sm:py-16">
        <div className="mb-10 max-w-[710px] sm:mb-12"><div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#dce6fb] bg-[#f0f5ff] px-3 py-1.5 text-[11px] font-bold tracking-[.08em] text-[#155eef]"><Sparkles size={13} /> COMPONENT PLAYGROUND</div><h1 className="text-[38px] font-semibold leading-[1.08] tracking-[-.05em] sm:text-[54px]">Address management,<br /><span className="text-[#155eef]">without the busywork.</span></h1><p className="mt-5 max-w-[590px] text-[16px] leading-7 text-[#6b7887]">A flexible, accessible React toolkit for address autocomplete, geolocation, and normalized data.</p></div>
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(360px,.82fr)]">
          <section className="rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-[0_12px_40px_rgba(25,45,75,.05)] sm:p-8"><div className="mb-7 flex items-start justify-between"><div><h2 className="text-lg font-semibold">Address form</h2><p className="mt-1 text-sm text-[#7b8794]">Try the components in action</p></div><span className="rounded-full bg-[#eef8f2] px-2.5 py-1 text-xs font-semibold text-[#258653]">Live preview</span></div>
            <form onSubmit={submit} className="space-y-5"><div className="relative"><label htmlFor="address" className="mb-2 block text-sm font-semibold">Street address</label><div className="relative"><Search className="absolute left-3.5 top-3.5 text-[#9aa7b5]" size={17} /><input id="address" value={query} onFocus={() => setFocused(true)} onChange={(event) => { setQuery(event.target.value); update('address_1', event.target.value) }} placeholder="Start typing an address..." className="h-11 w-full rounded-lg border border-[#d6dee8] bg-white pl-10 pr-4 text-sm outline-none transition focus:border-[#155eef] focus:ring-4 focus:ring-[#155eef]/10" autoComplete="off" />{focused && matches.length > 0 && <div className="absolute z-10 mt-2 w-full overflow-hidden rounded-xl border border-[#e0e6ef] bg-white py-1 shadow-[0_14px_32px_rgba(25,45,75,.15)]">{matches.map((item) => <button type="button" key={item.title} onMouseDown={() => choose(item)} className="flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-[#f5f8ff]"><MapPin size={16} className="mt-0.5 shrink-0 text-[#155eef]" /><span><span className="block text-sm font-medium">{item.title}</span><span className="mt-0.5 block text-xs text-[#7b8794]">{item.detail}</span></span></button>)}</div>}</div></div>
              <div className="grid gap-5 sm:grid-cols-2"><Field label="City" value={address.city} onChange={(v) => update('city', v)} placeholder="Madrid" /><Field label="Province / region" value={address.province} onChange={(v) => update('province', v)} placeholder="Madrid" /></div><div className="grid gap-5 sm:grid-cols-2"><Field label="Postal code" value={address.postal_code} onChange={(v) => update('postal_code', v)} placeholder="28014" /><div><label htmlFor="country" className="mb-2 block text-sm font-semibold">Country</label><div className="relative"><select id="country" value={address.country_code} onChange={(event) => update('country_code', event.target.value)} className="h-11 w-full appearance-none rounded-lg border border-[#d6dee8] bg-white px-3.5 text-sm outline-none focus:border-[#155eef] focus:ring-4 focus:ring-[#155eef]/10"><option value="">Select country</option><option value="es">España</option><option value="mx">México</option><option value="co">Colombia</option></select><ChevronDown size={16} className="pointer-events-none absolute right-3.5 top-3.5 text-[#7b8794]" /></div></div></div>
              <div className="flex flex-col gap-3 pt-1 sm:flex-row"><button type="button" onClick={locate} className="flex h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-[#cdd7e3] bg-white text-sm font-semibold text-[#344150] transition hover:border-[#155eef] hover:text-[#155eef]">{locating ? <span className="animate-pulse">Locating...</span> : <><Crosshair size={16} />Use my location</>}</button><button type="submit" className="flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-[#155eef] text-sm font-semibold text-white shadow-[0_4px_12px_rgba(21,94,239,.2)] transition hover:bg-[#0d4dcc]">{saved ? <><Check size={16} />Saved successfully</> : 'Save address'}</button></div>{locationError && <p role="alert" className="text-center text-xs font-medium text-[#b54747]">{locationError}</p>}{submitted && <p role="status" className="text-center text-xs font-medium text-[#258653]">Address normalized and ready for your backend.</p>}</form>
          </section>
          <div className="space-y-5"><section className="overflow-hidden rounded-2xl border border-[#e2e8f0] bg-white shadow-[0_12px_40px_rgba(25,45,75,.05)]"><div className="flex items-center justify-between border-b border-[#edf0f3] px-5 py-4"><div><h2 className="text-sm font-semibold">Location preview</h2><p className="mt-0.5 text-xs text-[#87919d]">Selected address on map</p></div><div className="flex items-center gap-1.5 text-xs font-semibold text-[#278b56]"><span className="h-1.5 w-1.5 rounded-full bg-[#34a866]" />Ready</div></div><div className="relative h-[260px] overflow-hidden bg-[#e8eef1]"><div className="absolute inset-0 opacity-70" style={{ backgroundImage: 'linear-gradient(28deg, transparent 47%, #c7d2d7 48%, #c7d2d7 50%, transparent 51%), linear-gradient(113deg, transparent 45%, #d1dbde 46%, #d1dbde 50%, transparent 51%), linear-gradient(3deg, transparent 61%, #d1dbde 62%, #d1dbde 63%, transparent 64%)', backgroundSize: '180px 140px, 210px 180px, 280px 150px' }} /><div className="absolute left-[52%] top-[47%] flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"><div className="flex h-11 w-11 items-center justify-center rounded-full border-[5px] border-white bg-[#ef4d4d] text-white shadow-lg"><MapPin size={20} fill="currentColor" /></div><div className="mt-[-2px] h-3 w-10 rounded-full bg-[#526675]/20 blur-[2px]" /></div><span className="absolute bottom-4 left-4 rounded-md bg-white/90 px-2.5 py-1.5 text-xs font-medium text-[#596674] shadow-sm">{address.city || 'Madrid'}, España</span></div><div className="flex items-center justify-between bg-[#fbfcfd] px-5 py-3.5 text-xs text-[#83909d]"><span>{coordinates.latitude.toFixed(4)}° {coordinates.latitude >= 0 ? 'N' : 'S'}, {Math.abs(coordinates.longitude).toFixed(4)}° {coordinates.longitude >= 0 ? 'E' : 'W'}</span><span className="flex items-center gap-1.5"><Navigation size={13} /> Accuracy: {coordinates.accuracy}m</span></div></section><section className="rounded-2xl border border-[#dce7fb] bg-[#f5f8ff] p-5"><div className="flex gap-3"><div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-[#155eef] shadow-sm"><ShieldCheck size={17} /></div><div><h3 className="text-sm font-semibold">Privacy by design</h3><p className="mt-1 text-xs leading-5 text-[#6c7b8d]">Coordinates are only returned through your callback. Nothing is stored or sent automatically.</p></div></div></section></div>
        </div><div className="mt-8 flex flex-wrap items-center justify-center gap-x-7 gap-y-3 text-xs text-[#89939f] sm:justify-start"><span className="flex items-center gap-1.5"><Check size={14} className="text-[#2f9c5e]" />WCAG 2.1 AA</span><span className="flex items-center gap-1.5"><Check size={14} className="text-[#2f9c5e]" />TypeScript strict</span><span className="flex items-center gap-1.5"><Check size={14} className="text-[#2f9c5e]" />Tree-shakeable</span><span className="flex items-center gap-1.5"><Check size={14} className="text-[#2f9c5e]" />React 18 & 19</span></div>
      </main>
    </div>
  )
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder: string }) { const id = label.toLowerCase().replaceAll(' ', '-').replace('/', ''); return <div><label htmlFor={id} className="mb-2 block text-sm font-semibold">{label}</label><input id={id} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="h-11 w-full rounded-lg border border-[#d6dee8] bg-white px-3.5 text-sm outline-none transition focus:border-[#155eef] focus:ring-4 focus:ring-[#155eef]/10" /></div> }

export function normalizeCountry(country: string) { const countries: Record<string, string> = { España: 'es', México: 'mx', Colombia: 'co' }; return countries[country] ?? country.toLowerCase().slice(0, 2) }
