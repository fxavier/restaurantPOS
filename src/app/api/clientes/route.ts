import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withErrorHandling, createErrorResponse, validateRequiredFields } from '@/lib/api-routes';

export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/clientes - Starting...');
    console.log('prisma:', typeof prisma, prisma);
    
    const { searchParams } = new URL(request.url);
    const restauranteId = searchParams.get('restauranteId');
    
    console.log('restauranteId:', restauranteId);
    
    if (!restauranteId) {
      return createErrorResponse('restauranteId é obrigatório', 400);
    }
    
    console.log('About to call prisma.cliente.findMany...');
    const clientes = await prisma.cliente.findMany({
      where: { restauranteId },
      orderBy: { criadoEm: 'desc' },
      include: {
        comandas: {
          select: {
            id: true,
            numero: true,
            total: true,
            status: true,
          },
        },
      },
    });
    
    console.log('clientes found:', clientes.length);
    
    return Response.json({
      success: true,
      data: clientes,
    });
  } catch (error) {
    console.error('Error in GET /api/clientes:', error);
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    const body = await request.json();
    
    const requiredFields = ['nome', 'telefone', 'restauranteId'];
    const missingFields = validateRequiredFields(body, requiredFields);
    
    if (missingFields.length > 0) {
      return createErrorResponse(
        `Campos obrigatórios ausentes: ${missingFields.join(', ')}`,
        400
      );
    }
    
    // Verificar se o telefone já existe
    const clienteExistente = await prisma.cliente.findFirst({
      where: {
        telefone: body.telefone,
        restauranteId: body.restauranteId,
      },
    });
    
    if (clienteExistente) {
      return createErrorResponse('Já existe um cliente com este telefone', 400);
    }
    
    const cliente = await prisma.cliente.create({
      data: {
        nome: body.nome,
        email: body.email,
        telefone: body.telefone,
        dataNascimento: body.dataNascimento ? new Date(body.dataNascimento) : undefined,
        genero: body.genero,
        endereco: body.endereco,
        bairro: body.bairro,
        cidade: body.cidade,
        pais: body.pais,
        observacoes: body.observacoes,
        ativo: body.ativo ?? true,
        permitirFiado: body.permitirFiado ?? false,
        limiteFiado: body.limiteFiado,
        restauranteId: body.restauranteId,
      },
    });
    
    return cliente;
  });
}

export async function PUT(request: NextRequest) {
  return withErrorHandling(async () => {
    const body = await request.json();
    const { id, ...updateData } = body;
    
    if (!id) {
      return createErrorResponse('ID do cliente é obrigatório', 400);
    }
    
    // Verificar se o telefone já existe em outro cliente
    if (updateData.telefone) {
      const clienteExistente = await prisma.cliente.findFirst({
        where: {
          telefone: updateData.telefone,
          restauranteId: updateData.restauranteId,
          NOT: { id },
        },
      });
      
      if (clienteExistente) {
        return createErrorResponse('Já existe um cliente com este telefone', 400);
      }
    }
    
    // Remover campos que não devem ser atualizados
    delete updateData.restauranteId;
    delete updateData.criadoEm;
    delete updateData.comandas;
    
    const cliente = await prisma.cliente.update({
      where: { id },
      data: {
        ...updateData,
        dataNascimento: updateData.dataNascimento ? new Date(updateData.dataNascimento) : undefined,
        atualizadoEm: new Date(),
      },
    });
    
    return cliente;
  });
}

export async function DELETE(request: NextRequest) {
  return withErrorHandling(async () => {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return createErrorResponse('ID do cliente é obrigatório', 400);
    }
    
    // Verificar se o cliente tem comandas abertas
    const comandasAbertas = await prisma.comanda.findFirst({
      where: {
        clienteId: id,
        status: {
          in: ['aberta', 'em_preparacao', 'pronta'],
        },
      },
    });
    
    if (comandasAbertas) {
      return createErrorResponse('Não é possível excluir cliente com comandas abertas', 400);
    }
    
    await prisma.cliente.delete({
      where: { id },
    });
    
    return { message: 'Cliente excluído com sucesso' };
  });
}