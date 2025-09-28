import { imageUploadService } from './image-upload'

export interface ProductImageOptions {
  width?: number
  height?: number
  quality?: number
}

export class ProductUtils {
  /**
   * Get the full image URL for a product
   */
  static getImageUrl(imagePath?: string | null): string | null {
    if (!imagePath) return null
    
    // If it's already a full URL, return as-is
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath
    }
    
    // If it's a relative path, make it absolute
    if (imagePath.startsWith('/')) {
      return imagePath
    }
    
    // Default to uploads directory
    return `/uploads/produtos/${imagePath}`
  }

  /**
   * Get optimized image URL with size parameters
   */
  static getOptimizedImageUrl(imagePath?: string | null, options?: ProductImageOptions): string | null {
    const baseUrl = this.getImageUrl(imagePath)
    if (!baseUrl) return null
    
    if (!options) return baseUrl
    
    const params = new URLSearchParams()
    if (options.width) params.set('w', options.width.toString())
    if (options.height) params.set('h', options.height.toString())
    if (options.quality) params.set('q', options.quality.toString())
    
    const queryString = params.toString()
    return queryString ? `${baseUrl}?${queryString}` : baseUrl
  }

  /**
   * Get placeholder image URL when product has no image
   */
  static getPlaceholderImage(): string {
    return '/images/produto-placeholder.png'
  }

  /**
   * Get image URL with fallback to placeholder
   */
  static getImageUrlWithFallback(imagePath?: string | null, options?: ProductImageOptions): string {
    return this.getOptimizedImageUrl(imagePath, options) || this.getPlaceholderImage()
  }

  /**
   * Validate image file before upload
   */
  static validateImageFile(file: File): { valid: boolean; error?: string } {
    const maxSize = 5 * 1024 * 1024 // 5MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    
    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'Tipo de arquivo não suportado. Use JPEG, PNG ou WebP.'
      }
    }
    
    if (file.size > maxSize) {
      return {
        valid: false,
        error: 'Arquivo muito grande. Tamanho máximo: 5MB.'
      }
    }
    
    return { valid: true }
  }

  /**
   * Format file size for display
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  /**
   * Generate image filename from product name
   */
  static generateImageFilename(productName: string, extension: string): string {
    const cleanName = productName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
    
    const timestamp = Date.now()
    return `${cleanName}-${timestamp}.${extension}`
  }
}

export default ProductUtils