import { AutocompleteOptions, Suggestion } from '../lib/types';
export declare function useAutocomplete({ provider, debounceMs, limit, minLength, language, countryRestriction, region, locationBias, retryCount }: AutocompleteOptions): {
    suggestions: Suggestion[];
    loading: boolean;
    error: string | null;
    search: (query: string) => void;
    clear: () => void;
    cacheSize: number;
    retryCount: number;
};
