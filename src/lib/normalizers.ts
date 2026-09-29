const countries: Record<string, string> = { espana: 'es', españa: 'es', spain: 'es', mexico: 'mx', méxico: 'mx', colombia: 'co', argentina: 'ar', chile: 'cl', peru: 'pe' }
const provinces: Record<string, Record<string, string>> = { es: { madrid: 'es-md', barcelona: 'es-ct', valencia: 'es-vc' }, mx: { jalisco: 'mx-jal', 'ciudad de méxico': 'mx-cmx', 'nuevo leon': 'mx-nle' }, co: { cundinamarca: 'co-cun' } }
export function normalizeCountry(value = '') { const clean = value.trim().toLowerCase(); return countries[clean] || (clean.length === 2 ? clean : clean) }
export function normalizeProvince(value = '', countryCode = '') { const clean = value.trim().toLowerCase(); return provinces[countryCode.toLowerCase()]?.[clean] || clean }
export function normalizeAddress(address: AddressData): AddressData { return { ...address, country_code: normalizeCountry(address.country_code), province: normalizeProvince(address.province, address.country_code) } }
import type { AddressData } from './types'
