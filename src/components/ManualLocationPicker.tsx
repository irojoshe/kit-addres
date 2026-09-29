'use client'
import { MapView } from './MapView'
import type { ManualLocationPickerProps } from '../lib/types'
export function ManualLocationPicker({ coordinates, onChange, height = 260 }: ManualLocationPickerProps) { return <MapView coordinates={coordinates} height={height} onMarkerDrag={onChange} /> }
