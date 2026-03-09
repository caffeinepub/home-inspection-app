/**
 * Google Places API integration for address autocomplete
 * 
 * This module provides address autocomplete functionality using the Google Places API.
 * 
 * To configure for local development, create a `.env` file in the `frontend/` directory:
 * VITE_GOOGLE_PLACES_API_KEY=your_key_here
 * 
 * Then restart the development server.
 */

// Load API key from environment variable
const googlePlacesApiKey = import.meta.env.VITE_GOOGLE_PLACES_API_KEY || '';

/**
 * Checks if Google Places API is available and configured
 * @returns true if the API key is configured, false otherwise
 */
export function isGooglePlacesAvailable(): boolean {
  return googlePlacesApiKey.trim().length > 0;
}

/**
 * Gets the Google Places API key
 * @throws Error if the API key is not configured
 * @returns The configured API key
 */
export function getGooglePlacesApiKey(): string {
  if (!googlePlacesApiKey || googlePlacesApiKey.trim() === '') {
    throw new Error(
      'Google Places API key is not configured. ' +
      'Please add VITE_GOOGLE_PLACES_API_KEY to your .env file.'
    );
  }
  return googlePlacesApiKey;
}

/**
 * Placeholder for Google Places API integration
 * This module can be expanded to include address autocomplete functionality
 * 
 * Example usage:
 * ```typescript
 * if (isGooglePlacesAvailable()) {
 *   const apiKey = getGooglePlacesApiKey();
 *   // Use apiKey to initialize Google Places API
 * } else {
 *   console.warn('Google Places API is not configured');
 * }
 * ```
 */
