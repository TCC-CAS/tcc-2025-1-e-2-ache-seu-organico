/**
 * Helper functions for handling image URLs across different storage providers
 * (local, S3, CDN, etc.)
 */

// Base URLs for different environments
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
const MEDIA_BASE_URL = import.meta.env.VITE_MEDIA_BASE_URL || `${API_BASE_URL}/media`

/**
 * Resolve image URL to absolute path
 * Handles local paths, absolute URLs, and S3 URLs
 * 
 * @param imagePath - Path or URL of the image
 * @returns Full URL to the image
 */
export function resolveImageUrl(imagePath: string | null | undefined): string | null {
  if (!imagePath) {
    return null
  }

  // Already an absolute URL (http:// or https://)
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath
  }

  // S3 or CDN URL (starts with //)
  if (imagePath.startsWith('//')) {
    return `https:${imagePath}`
  }

  // Relative path - prepend media base URL
  // Remove leading slash if present to avoid double slashes
  const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath
  return `${MEDIA_BASE_URL}/${cleanPath}`
}

/**
 * Get image URL or return placeholder
 * 
 * @param imagePath - Path or URL of the image
 * @param placeholder - Optional placeholder URL
 * @returns Image URL or placeholder
 */
export function getImageUrlOrPlaceholder(
  imagePath: string | null | undefined,
  placeholder: string = '/placeholder.png'
): string {
  return resolveImageUrl(imagePath) || placeholder
}

/**
 * Check if image URL is from S3
 * 
 * @param imagePath - Path or URL of the image
 * @returns True if S3 URL
 */
export function isS3Url(imagePath: string | null | undefined): boolean {
  if (!imagePath) return false
  return imagePath.includes('s3.amazonaws.com') || imagePath.includes('amazonaws.com')
}

/**
 * Check if image URL is local
 * 
 * @param imagePath - Path or URL of the image
 * @returns True if local URL
 */
export function isLocalUrl(imagePath: string | null | undefined): boolean {
  if (!imagePath) return false
  const resolved = resolveImageUrl(imagePath)
  return resolved?.includes('localhost') || resolved?.includes('127.0.0.1') || false
}
