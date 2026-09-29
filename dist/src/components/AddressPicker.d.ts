import { AddressProvider, Suggestion } from '../lib/types';
export declare function AddressPicker({ provider, onSelect, onPlaceSelect, language, countryRestriction }: {
    provider?: AddressProvider;
    onSelect?: (suggestion: Suggestion) => void;
    onPlaceSelect?: (place: any) => void;
    language?: string;
    countryRestriction?: string[];
}): import('react/jsx-runtime').JSX.Element;
