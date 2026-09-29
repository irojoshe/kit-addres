import { AddressData } from './types';
export declare function normalizeCountry(value?: string): string;
export declare function normalizeProvince(value?: string, countryCode?: string): string;
export declare function normalizeAddress(address: AddressData): AddressData;
