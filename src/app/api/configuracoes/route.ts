import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withErrorHandling, createErrorResponse, validateRequiredFields } from '@/lib/api-routes'

export async function GET(request: NextRequest) {
  return withErrorHandling(async () => {
    const { searchParams } = new URL(request.url)
    const restauranteId = searchParams.get('restauranteId')
    
    if (!restauranteId) {
      return createErrorResponse('restauranteId é obrigatório', 400)
    }
    
    let configuracoes = await prisma.restaurante.findUnique({
      where: { id: restauranteId },
      include: {
        impostos: {
          orderBy: { nome: 'asc' }
        },
        horariosFuncionamento: {
          orderBy: { diaSemana: 'asc' }
        }
      }
    })
    
    // Se não existe, criar um restaurante padrão
    if (!configuracoes) {
      // Gerar NUIT único baseado no restauranteId
      const nuitHash = Math.abs(restauranteId.split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
      }, 0));
      const nuitUnico = String(nuitHash).padStart(9, '0').slice(0, 9);
      
      configuracoes = await prisma.restaurante.create({
        data: {
          id: restauranteId,
          nome: 'Meu Restaurante',
          endereco: 'Endereço do restaurante',
          telefone: '+258 84 123 4567',
          email: 'contato@restaurante.com',
          nuit: nuitUnico,
          taxaServico: 10,
          moeda: 'MZN',
          fusoHorario: 'Africa/Maputo',
        },
        include: {
          impostos: {
            orderBy: { nome: 'asc' }
          },
          horariosFuncionamento: {
            orderBy: { diaSemana: 'asc' }
          }
        }
      })
    }
    
    // Get units of measure (global settings)
    let unidadesMedida = await prisma.unidadeMedida.findMany({
      orderBy: { nome: 'asc' }
    })
    
    // Se não existem unidades de medida, criar algumas padrão
    if (unidadesMedida.length === 0) {
      const unidadesPadrao = [
        { nome: 'Quilograma', sigla: 'kg', tipo: 'peso' as const, fatorConversao: 1.0 },
        { nome: 'Grama', sigla: 'g', tipo: 'peso' as const, fatorConversao: 0.001 },
        { nome: 'Litro', sigla: 'L', tipo: 'volume' as const, fatorConversao: 1.0 },
        { nome: 'Mililitro', sigla: 'ml', tipo: 'volume' as const, fatorConversao: 0.001 },
        { nome: 'Unidade', sigla: 'un', tipo: 'unidade' as const, fatorConversao: 1.0 },
        { nome: 'Pacote', sigla: 'pct', tipo: 'unidade' as const, fatorConversao: 1.0 },
      ]
      
      await prisma.unidadeMedida.createMany({
        data: unidadesPadrao
      })
      
      unidadesMedida = await prisma.unidadeMedida.findMany({
        orderBy: { nome: 'asc' }
      })
    }
    
    return {
      restaurante: {
        id: configuracoes.id,
        nome: configuracoes.nome,
        endereco: configuracoes.endereco,
        telefone: configuracoes.telefone,
        email: configuracoes.email,
        nuit: configuracoes.nuit,
        inscricaoEstadual: configuracoes.inscricaoEstadual,
        inscricaoMunicipal: configuracoes.inscricaoMunicipal,
        taxaServico: configuracoes.taxaServico,
        moeda: configuracoes.moeda,
        fusoHorario: configuracoes.fusoHorario,
        criadoEm: configuracoes.criadoEm.toISOString(),
        atualizadoEm: configuracoes.atualizadoEm.toISOString(),
      },
      impostos: configuracoes.impostos,
      horariosFuncionamento: configuracoes.horariosFuncionamento,
      unidadesMedida,
    }
  })
}

export async function PUT(request: NextRequest) {
  return withErrorHandling(async () => {
    const body = await request.json()
    const { searchParams } = new URL(request.url)
    const restauranteId = searchParams.get('restauranteId')
    
    if (!restauranteId) {
      return createErrorResponse('restauranteId é obrigatório', 400)
    }
    
    const requiredFields = ['nome', 'endereco', 'telefone', 'email']
    const missingFields = validateRequiredFields(body, requiredFields)
    
    if (missingFields.length > 0) {
      return createErrorResponse(
        `Campos obrigatórios ausentes: ${missingFields.join(', ')}`,
        400
      )
    }
    
    // Update restaurant basic info
    const configuracoes = await prisma.restaurante.update({
      where: { id: restauranteId },
      data: {
        nome: body.nome,
        endereco: body.endereco,
        telefone: body.telefone,
        email: body.email,
        nuit: body.nuit,
        inscricaoEstadual: body.inscricaoEstadual,
        inscricaoMunicipal: body.inscricaoMunicipal,
        taxaServico: body.taxaServico,
        moeda: body.moeda,
        fusoHorario: body.fusoHorario,
      }
    })
    
    // Update tax settings if provided
    if (body.impostos) {
      // Delete existing taxes
      await prisma.impostoConfig.deleteMany({
        where: { restauranteId }
      })
      
      // Create new taxes
      if (body.impostos.length > 0) {
        await prisma.impostoConfig.createMany({
          data: body.impostos.map((imposto: any) => ({
            nome: imposto.nome,
            percentual: imposto.percentual,
            tipo: imposto.tipo,
            ativo: imposto.ativo ?? true,
            restauranteId,
          }))
        })
      }
    }
    
    // Update opening hours if provided
    if (body.horariosFuncionamento) {
      // Delete existing hours
      await prisma.horarioFuncionamento.deleteMany({
        where: { restauranteId }
      })
      
      // Create new hours
      if (body.horariosFuncionamento.length > 0) {
        await prisma.horarioFuncionamento.createMany({
          data: body.horariosFuncionamento.map((horario: any) => ({
            diaSemana: horario.diaSemana,
            abertura: horario.abertura,
            fechamento: horario.fechamento,
            ativo: horario.ativo ?? true,
            restauranteId,
          }))
        })
      }
    }
    
    return { message: 'Configurações atualizadas com sucesso' }
  })
}