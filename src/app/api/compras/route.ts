import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withErrorHandling, createErrorResponse, getPaginationParams, validateRequiredFields, createPaginatedResponse } from '@/lib/api-routes'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const { page, limit, offset, orderBy } = await getPaginationParams(request)
  const restauranteId = searchParams.get('restauranteId')
  const status = searchParams.get('status')
  const fornecedorId = searchParams.get('fornecedorId')
  const dataInicio = searchParams.get('dataInicio')
  const dataFim = searchParams.get('dataFim')
  
  if (!restauranteId) {
    return createErrorResponse('restauranteId é obrigatório', 400)
  }
  
  const where: any = {
    restauranteId,
  }
  
  if (status) {
    where.status = status
  }
  
  if (fornecedorId) {
    where.fornecedorId = fornecedorId
  }
  
  if (dataInicio || dataFim) {
    where.criadaEm = {}
    if (dataInicio) {
      where.criadaEm.gte = new Date(dataInicio)
    }
    if (dataFim) {
      where.criadaEm.lte = new Date(dataFim)
    }
  }
  
  // Count total items
  const total = await prisma.ordemCompra.count({ where })
  
  const ordensCompra = await prisma.ordemCompra.findMany({
    where,
    take: limit,
    skip: offset,
    orderBy: orderBy || { criadaEm: 'desc' },
    include: {
      fornecedor: {
        select: {
          id: true,
          nome: true,
          contato: true,
        }
      },
      usuario: {
        select: {
          id: true,
          nome: true,
        }
      },
      _count: {
        select: {
          itens: true,
        }
      }
    }
  })
  
  return createPaginatedResponse(ordensCompra, total, page, limit)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('=== API COMPRAS POST ===');
    console.log('Body recebido:', JSON.stringify(body, null, 2));
    
    const requiredFields = ['numero', 'fornecedorId', 'usuarioId', 'restauranteId']
    const missingFields = validateRequiredFields(body, requiredFields)
    
    if (missingFields.length > 0) {
      console.error('Campos obrigatórios ausentes:', missingFields);
      return createErrorResponse(
        `Campos obrigatórios ausentes: ${missingFields.join(', ')}`,
        400
      )
    }
    
    // Check if numero is unique
    const existingOrdem = await prisma.ordemCompra.findUnique({
      where: { numero: body.numero }
    })
    
    if (existingOrdem) {
      return createErrorResponse('Número da ordem de compra já existe', 400)
    }
    
    // Handle system user - create if doesn't exist and userId is 'sistema-admin'
    if (body.usuarioId === 'sistema-admin') {
      const existingUser = await prisma.usuario.findUnique({
        where: { id: 'sistema-admin' },
      });

      if (!existingUser) {
        try {
          await prisma.usuario.create({
            data: {
              id: 'sistema-admin',
              nome: 'Sistema Admin',
              email: 'admin@sistema.com',
              perfil: 'admin',
              ativo: true,
              restauranteId: body.restauranteId,
            },
          });
        } catch (error) {
          // User might already exist, ignore error
          console.log('Sistema admin user creation attempted');
        }
      }
    }
    
    console.log('Criando ordem de compra no banco...');
    const ordemCompra = await prisma.ordemCompra.create({
      data: {
        numero: body.numero,
        subtotal: body.subtotal || 0,
        impostos: body.impostos || 0,
        total: body.total || 0,
        status: body.status || 'rascunho',
        dataEntregaPrevista: body.dataEntregaPrevista ? new Date(body.dataEntregaPrevista) : null,
        observacoes: body.observacoes,
        fornecedorId: body.fornecedorId,
        usuarioId: body.usuarioId,
        restauranteId: body.restauranteId,
      },
      include: {
        fornecedor: {
          select: {
            id: true,
            nome: true,
            contato: true,
          }
        },
        usuario: {
          select: {
            id: true,
            nome: true,
          }
        },
        itens: true,
      }
    })
    
    console.log('Ordem criada no banco:', ordemCompra);
    console.log('ID da ordem:', ordemCompra.id);
    
    // Return the response directly without the wrapper for now
    return NextResponse.json({
      success: true,
      data: ordemCompra
    });
  } catch (error) {
    console.error('Erro na API compras POST:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao criar ordem de compra'
    }, { status: 400 });
  }
}