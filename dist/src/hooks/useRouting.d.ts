import { Coordinates, DistanceMatrix, RouteResult, RoutingProvider } from '../lib/types';
export declare function useRouting(provider: RoutingProvider): {
    route: RouteResult | null;
    loading: boolean;
    error: string | null;
    calculate: (from: Coordinates, to: Coordinates) => Promise<RouteResult>;
    recalculate: () => Promise<never>;
};
export declare function useDistanceMatrix(provider: RoutingProvider): {
    matrix: DistanceMatrix | null;
    loading: boolean;
    error: string | null;
    calculate: (points: Coordinates[]) => Promise<DistanceMatrix>;
};
