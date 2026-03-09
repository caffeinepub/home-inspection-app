/**
 * RentCast API integration for property data fetching
 * 
 * This module provides property data fetching functionality using the RentCast API.
 * 
 * To configure for local development, create a `.env` file in the `frontend/` directory:
 * VITE_RENTCAST_API_KEY=your_key_here
 * 
 * Then restart the development server.
 */

// Load API key from environment variable
const rentCastApiKey = import.meta.env.VITE_RENTCAST_API_KEY || '';

export interface RentCastPropertyData {
  bedrooms?: number;
  bathrooms?: number;
  squareFootage?: number;
  yearBuilt?: number;
}

export interface RentCastApiResponse {
  bedrooms?: number;
  bathrooms?: number;
  squareFootage?: number;
  yearBuilt?: number;
  // RentCast API returns many more fields, but we only need these
}

/**
 * Checks if RentCast API is configured
 * @returns true if the API key is configured, false otherwise
 */
export function isRentCastConfigured(): boolean {
  return rentCastApiKey.trim().length > 0;
}

/**
 * Gets the RentCast API key
 * @throws Error if the API key is not configured
 * @returns The configured API key
 */
export function getRentCastApiKey(): string {
  if (!rentCastApiKey || rentCastApiKey.trim() === '') {
    throw new Error(
      'RentCast API key is not configured. ' +
      'Please add VITE_RENTCAST_API_KEY to your .env file.'
    );
  }
  return rentCastApiKey;
}

/**
 * Fetches property details from RentCast API
 * @param address Full address string (e.g., "123 Main St, Springfield, IL 62701")
 * @returns Property data including bedrooms, bathrooms, square footage, and year built
 * @throws Error if the API key is not configured or the API request fails
 */
export async function fetchPropertyData(address: string): Promise<RentCastPropertyData | null> {
  if (!isRentCastConfigured()) {
    console.warn('RentCast API key not configured. Please add VITE_RENTCAST_API_KEY to your .env file.');
    return null;
  }

  try {
    const apiKey = getRentCastApiKey();
    const url = new URL('https://api.rentcast.io/v1/properties/address');
    url.searchParams.append('address', address);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'X-Api-Key': apiKey,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.warn('Property not found in RentCast database');
        return null;
      }
      throw new Error(`RentCast API error: ${response.status} ${response.statusText}`);
    }

    const data: RentCastApiResponse = await response.json();

    return {
      bedrooms: data.bedrooms,
      bathrooms: data.bathrooms,
      squareFootage: data.squareFootage,
      yearBuilt: data.yearBuilt,
    };
  } catch (error) {
    console.error('Error fetching property data from RentCast:', error);
    if (error instanceof Error && error.message.includes('not configured')) {
      throw error;
    }
    return null;
  }
}

/**
 * Generates room skeleton based on property data
 * Creates bedroom and bathroom room templates
 */
export function generateRoomSkeleton(propertyData: RentCastPropertyData): Array<{ name: string; type: string }> {
  const rooms: Array<{ name: string; type: string }> = [];

  // Add bedrooms
  if (propertyData.bedrooms && propertyData.bedrooms > 0) {
    for (let i = 1; i <= propertyData.bedrooms; i++) {
      rooms.push({
        name: `Bedroom ${i}`,
        type: 'bedroom',
      });
    }
  }

  // Add bathrooms - handle decimal values (e.g., 2.5 = 2 full + 1 half)
  if (propertyData.bathrooms && propertyData.bathrooms > 0) {
    const fullBaths = Math.floor(propertyData.bathrooms);
    const hasHalfBath = propertyData.bathrooms % 1 >= 0.5;

    for (let i = 1; i <= fullBaths; i++) {
      rooms.push({
        name: `Full-Bath ${i}`,
        type: 'bathroom',
      });
    }

    if (hasHalfBath) {
      rooms.push({
        name: 'Half-Bath',
        type: 'bathroom',
      });
    }
  }

  // Add common areas
  rooms.push(
    { name: 'Living Room', type: 'living' },
    { name: 'Kitchen', type: 'kitchen' },
    { name: 'Dining Room', type: 'dining' },
    { name: 'Exterior', type: 'exterior' }
  );

  return rooms;
}

/**
 * Formats property data for display
 */
export function formatPropertyData(propertyData: RentCastPropertyData): string {
  const parts: string[] = [];

  if (propertyData.bedrooms) {
    parts.push(`${propertyData.bedrooms} bed${propertyData.bedrooms !== 1 ? 's' : ''}`);
  }

  if (propertyData.bathrooms) {
    parts.push(`${propertyData.bathrooms} bath${propertyData.bathrooms !== 1 ? 's' : ''}`);
  }

  if (propertyData.squareFootage) {
    parts.push(`${propertyData.squareFootage.toLocaleString()} sq ft`);
  }

  if (propertyData.yearBuilt) {
    parts.push(`Built ${propertyData.yearBuilt}`);
  }

  return parts.join(' • ');
}
