import { NextRequest } from 'next/server'
import { withErrorHandling, createErrorResponse } from '@/lib/api-routes'
import { imageUploadService } from '@/lib/image-upload'

export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    try {
      const formData = await request.formData()
      const file = formData.get('image') as File
      
      if (!file) {
        return createErrorResponse('Nenhuma imagem foi enviada', 400)
      }

      const result = await imageUploadService.uploadImage(file)
      
      return {
        message: 'Imagem enviada com sucesso',
        ...result
      }
    } catch (error) {
      if (error instanceof Error) {
        return createErrorResponse(error.message, 400)
      }
      return createErrorResponse('Erro ao enviar imagem', 500)
    }
  })
}

export async function DELETE(request: NextRequest) {
  return withErrorHandling(async () => {
    const { searchParams } = new URL(request.url)
    const imageUrl = searchParams.get('url')
    
    if (!imageUrl) {
      return createErrorResponse('URL da imagem é obrigatória', 400)
    }

    await imageUploadService.deleteImage(imageUrl)
    
    return {
      message: 'Imagem excluída com sucesso'
    }
  })
}