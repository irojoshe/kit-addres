import { Coordinates, GeolocationError, GeolocationOptions } from '../lib/types';
export declare function useGeolocation(options?: GeolocationOptions): {
    coords: Coordinates | null;
    loading: boolean;
    error: GeolocationError | null;
    getLocation: () => void;
    reset: () => void;
};
