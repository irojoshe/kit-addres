import { AutocompleteOptions, PlaceResult } from '../lib/types';
type LegacyOptions = Partial<AutocompleteOptions>;
export declare function usePlacesAutocomplete(options?: LegacyOptions): {
    query: string;
    setQuery: (value: string) => void;
    suggestions: PlaceResult[];
    loading: boolean;
    error: string | null;
    selectPlace: (place: PlaceResult) => PlaceResult;
};
export {};
