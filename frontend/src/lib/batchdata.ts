/**
 * BatchData MCP API integration for property lookups
 * 
 * This module provides property lookup and permit history functionality using BatchData MCP API.
 * 
 * To configure for local development, create a `.env` file in the `frontend/` directory:
 * VITE_BATCHDATA_API_KEY=your_key_here
 * 
 * Then restart the development server.
 */

// Load API key from environment variable
const batchDataApiKey = import.meta.env.VITE_BATCHDATA_API_KEY || '';

/**
 * Checks if BatchData MCP API is available and configured
 * @returns true if the API key is configured, false otherwise
 */
export function isBatchDataAvailable(): boolean {
  return batchDataApiKey.trim().length > 0;
}

/**
 * Gets the BatchData MCP API key
 * @throws Error if the API key is not configured
 * @returns The configured API key
 */
export function getBatchDataApiKey(): string {
  if (!batchDataApiKey || batchDataApiKey.trim() === '') {
    throw new Error(
      'BatchData MCP API key is not configured. ' +
      'Please add VITE_BATCHDATA_API_KEY to your .env file.'
    );
  }
  return batchDataApiKey;
}

/**
 * Placeholder for BatchData MCP API integration
 * This module can be expanded to include property lookup and permit history functionality
 * 
 * Example usage:
 * ```typescript
 * if (isBatchDataAvailable()) {
 *   const apiKey = getBatchDataApiKey();
 *   // Use apiKey to make BatchData MCP API calls
 * } else {
 *   console.warn('BatchData MCP API is not configured');
 * }
 * ```
 */
