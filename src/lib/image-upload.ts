import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { randomUUID } from 'crypto'

export interface UploadResult {
  url: string
  filename: string
  size: number
}

export class ImageUploadService {
  private uploadDir = 'public/uploads/produtos'
  private maxFileSize = 5 * 1024 * 1024 // 5MB
  private allowedTypes = ['image/jpeg', 'image/png', 'image/webp']

  async uploadImage(file: File): Promise<UploadResult> {
    // Validate file type
    if (!this.allowedTypes.includes(file.type)) {
      throw new Error('Tipo de arquivo não suportado. Use JPEG, PNG ou WebP.')
    }

    // Validate file size
    if (file.size > this.maxFileSize) {
      throw new Error('Arquivo muito grande. Tamanho máximo: 5MB.')
    }

    // Ensure upload directory exists
    const uploadPath = join(process.cwd(), this.uploadDir)
    try {
      await mkdir(uploadPath, { recursive: true })
    } catch (error) {
      // Directory might already exist
    }

    // Generate unique filename
    const fileExtension = file.name.split('.').pop()
    const filename = `${randomUUID()}.${fileExtension}`
    const filepath = join(uploadPath, filename)

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    await writeFile(filepath, buffer)

    // Return public URL
    const url = `/uploads/produtos/${filename}`
    
    return {
      url,
      filename,
      size: file.size
    }
  }

  async deleteImage(url: string): Promise<void> {
    try {
      const filename = url.split('/').pop()
      if (!filename) return

      const filepath = join(process.cwd(), this.uploadDir, filename)
      const { unlink } = await import('fs/promises')
      await unlink(filepath)
    } catch (error) {
      // File might not exist, ignore error
      console.warn('Failed to delete image:', error)
    }
  }

  validateImageUrl(url: string): boolean {
    if (!url) return false
    
    // Check if it's a valid URL format
    try {
      new URL(url)
      return true
    } catch {
      // Check if it's a valid relative path
      return url.startsWith('/uploads/produtos/') || url.startsWith('uploads/produtos/')
    }
  }

  getImageUrl(filename: string): string {
    if (this.validateImageUrl(filename)) {
      return filename
    }
    return `/uploads/produtos/${filename}`
  }
}

export const imageUploadService = new ImageUploadService()