import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { 
  withErrorHandling, 
  createErrorResponse, 
  getPaginationParams,
  createPaginatedResponse,
  validateRequiredFields 
} from '@/lib/api-routes'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const { page, limit, offset, orderBy } = await getPaginationParams(request)
  const restauranteId = searchParams.get('restauranteId')
  const ativo = searchParams.get('ativo')
  const periodo = searchParams.get('periodo')
  const search = searchParams.get('search')
  
  const where: any = {}
  
  // If restauranteId is provided, filter by it. Otherwise, return all menus
  if (restauranteId) {
    where.restauranteId = restauranteId
  }
  
  if (ativo !== null) {
    where.ativo = ativo === 'true'
  }
  
  if (periodo) {
    where.tipo = periodo
  }
  
  // Add search functionality
  if (search) {
    where.OR = [
      { nome: { contains: search, mode: 'insensitive' } },
      { descricao: { contains: search, mode: 'insensitive' } },
    ]
  }
  
  try {
    // Get total count for pagination
    const total = await prisma.menu.count({ where })
    
    // Get paginated data
    const menus = await prisma.menu.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: orderBy || { nome: 'asc' },
      include: {
        produtos: {
          include: {
            produto: {
              select: {
                id: true,
                nome: true,
                preco: true,
                disponivel: true,
                categoria: {
                  select: {
                    id: true,
                    nome: true,
                    cor: true,
                  }
                }
              }
            }
          }
        },
        _count: {
          select: {
            produtos: true,
          }
        }
      }
    })
    
    return createPaginatedResponse(menus, total, page, limit)
  } catch (error) {
    console.error('Error fetching menus:', error)
    return createErrorResponse('Erro ao buscar menus', 500)
  }
}

export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    const body = await request.json()
    
    const requiredFields = ['nome', 'tipo', 'restauranteId']
    const missingFields = validateRequiredFields(body, requiredFields)
    
    if (missingFields.length > 0) {
      return createErrorResponse(
        `Campos obrigatórios ausentes: ${missingFields.join(', ')}`,
        400
      )
    }
    
    const menu = await prisma.menu.create({
      data: {
        nome: body.nome,
        descricao: body.descricao,
        tipo: body.tipo,
        imagem: body.imagem,
        ativo: body.ativo ?? true,
        restauranteId: body.restauranteId,
      }
    })
    
    // Add products to menu if provided
    if (body.produtos && body.produtos.length > 0) {
      await prisma.menuProduto.createMany({
        data: body.produtos.map((produtoId: string) => ({
          menuId: menu.id,
          produtoId,
        }))
      })
    }
    
    return menu
  })
}

