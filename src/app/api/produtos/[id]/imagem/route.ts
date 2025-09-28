import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withErrorHandling, createErrorResponse } from '@/lib/api-routes'
import { imageUploadService } from '@/lib/image-upload'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  return withErrorHandling(async () => {
    const { id } = await params
    
    // Verify product exists
    const produto = await prisma.produto.findUnique({
      where: { id },
      select: { id: true, imagem: true }
    })
    
    if (!produto) {
      return createErrorResponse('Produto não encontrado', 404)
    }

    try {
      const formData = await request.formData()
      const file = formData.get('image') as File
      
      if (!file) {
        return createErrorResponse('Nenhuma imagem foi enviada', 400)
      }

      // Upload new image
      const uploadResult = await imageUploadService.uploadImage(file)
      
      // Delete old image if exists
      if (produto.imagem) {
        await imageUploadService.deleteImage(produto.imagem)
      }
      
      // Update product with new image URL
      const updatedProduct = await prisma.produto.update({
        where: { id },
        data: { imagem: uploadResult.url },
        select: {
          id: true,
          nome: true,
          imagem: true,
        }
      })
      
      return {
        message: 'Imagem do produto atualizada com sucesso',
        produto: updatedProduct,
        upload: uploadResult
      }
    } catch (error) {
      if (error instanceof Error) {
        return createErrorResponse(error.message, 400)
      }
      return createErrorResponse('Erro ao atualizar imagem do produto', 500)
    }
  })
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  return withErrorHandling(async () => {
    const { id } = await params
    
    // Get current product image
    const produto = await prisma.produto.findUnique({
      where: { id },
      select: { id: true, imagem: true }
    })
    
    if (!produto) {
      return createErrorResponse('Produto não encontrado', 404)
    }

    if (!produto.imagem) {
      return createErrorResponse('Produto não possui imagem', 400)
    }

    // Delete image file
    await imageUploadService.deleteImage(produto.imagem)
    
    // Remove image URL from product
    await prisma.produto.update({
      where: { id },
      data: { imagem: null }
    })
    
    return {
      message: 'Imagem do produto removida com sucesso'
    }
  })
}