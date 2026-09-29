import { z } from 'zod';
export declare const CoordinatesSchema: z.ZodObject<{
    latitude: z.ZodNumber;
    longitude: z.ZodNumber;
    accuracy: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>;
export declare const AddressDataSchema: z.ZodObject<{
    first_name: z.ZodOptional<z.ZodString>;
    last_name: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
    address_1: z.ZodString;
    address_2: z.ZodOptional<z.ZodString>;
    city: z.ZodString;
    province: z.ZodOptional<z.ZodString>;
    postal_code: z.ZodOptional<z.ZodString>;
    country_code: z.ZodString;
    coordinates: z.ZodOptional<z.ZodObject<{
        latitude: z.ZodNumber;
        longitude: z.ZodNumber;
        accuracy: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>>;
    source: z.ZodOptional<z.ZodEnum<{
        autocomplete: "autocomplete";
        manual: "manual";
        geolocation: "geolocation";
    }>>;
    verified: z.ZodOptional<z.ZodBoolean>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, z.core.$strip>;
export declare function validateAddress(value: unknown): {
    success: true;
    data: {
        address_1: string;
        city: string;
        country_code: string;
        first_name?: string | undefined;
        last_name?: string | undefined;
        phone?: string | undefined;
        address_2?: string | undefined;
        province?: string | undefined;
        postal_code?: string | undefined;
        coordinates?: {
            latitude: number;
            longitude: number;
            accuracy?: number | undefined;
        } | undefined;
        source?: "autocomplete" | "manual" | "geolocation" | undefined;
        verified?: boolean | undefined;
        metadata?: Record<string, unknown> | undefined;
    };
    error?: undefined;
} | {
    success: false;
    error: string;
    data?: undefined;
};
