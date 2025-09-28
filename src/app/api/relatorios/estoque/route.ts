import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withErrorHandling, createErrorResponse } from '@/lib/api-routes'

export async function GET(request: NextRequest) {
  return withErrorHandling(async () => {
    const { searchParams } = new URL(request.url)
    const restauranteId = searchParams.get('restauranteId')
    const dataInicio = searchParams.get('dataInicio')
    const dataFim = searchParams.get('dataFim')
    
    if (!restauranteId) {
      return createErrorResponse('restauranteId é obrigatório', 400)
    }
    
    const whereMovimentacao: any = {
      produto: {
        restauranteId,
      }
    }
    
    if (dataInicio || dataFim) {
      whereMovimentacao.criadaEm = {}
      if (dataInicio) {
        whereMovimentacao.criadaEm.gte = new Date(dataInicio)
      }
      if (dataFim) {
        whereMovimentacao.criadaEm.lte = new Date(dataFim)
      }
    }
    
    // Get all products with stock control
    const produtos = await prisma.produto.findMany({
      where: {
        restauranteId,
        controlaEstoque: true,
      },
      include: {
        categoria: {
          select: {
            nome: true,
          }
        },
        unidadeMedida: {
          select: {
            nome: true,
            sigla: true,
          }
        },
        movimentacoesEstoque: {
          where: whereMovimentacao.criadaEm ? { criadaEm: whereMovimentacao.criadaEm } : {},
          include: {
            unidadeMedida: {
              select: {
                fatorConversao: true,
              }
            }
          }
        }
      }
    })
    
    // Calculate stock levels and movements
    const relatorioEstoque = produtos.map(produto => {
      let saldoAtual = 0
      let valorEstoque = 0
      let entradas = 0
      let saidas = 0
      let perdas = 0
      let ajustes = 0
      
      produto.movimentacoesEstoque.forEach(mov => {
        const quantidade = mov.quantidade * mov.unidadeMedida.fatorConversao
        
        switch (mov.tipo) {
          case 'entrada':
            saldoAtual += quantidade
            entradas += quantidade
            break
          case 'saida':
            saldoAtual -= quantidade
            saidas += quantidade
            break
          case 'perda':
            saldoAtual -= quantidade
            perdas += quantidade
            break
          case 'ajuste':
            ajustes += quantidade
            saldoAtual = quantidade // Ajuste substitui o saldo
            break
          case 'transferencia':
            saldoAtual += quantidade // Pode ser positivo ou negativo
            break
        }
        
        if (mov.valorTotal) {
          valorEstoque += mov.valorTotal
        }
      })
      
      // Calculate all movements for current stock (not filtered by date)
      let saldoTotal = 0
      produto.movimentacoesEstoque.forEach(mov => {
        const quantidade = mov.quantidade * mov.unidadeMedida.fatorConversao
        
        switch (mov.tipo) {
          case 'entrada':
            saldoTotal += quantidade
            break
          case 'saida':
          case 'perda':
            saldoTotal -= quantidade
            break
          case 'ajuste':
            saldoTotal = quantidade
            break
          case 'transferencia':
            saldoTotal += quantidade
            break
        }
      })
      
      const custoMedio = entradas > 0 ? valorEstoque / entradas : 0
      const valorEstoqueAtual = saldoTotal * custoMedio
      
      return {
        produto: {
          id: produto.id,
          nome: produto.nome,
          sku: produto.sku,
          categoria: produto.categoria.nome,
          unidadeMedida: produto.unidadeMedida.sigla,
        },
        saldoAtual: saldoTotal,
        saldoPeriodo: saldoAtual,
        valorEstoque: valorEstoqueAtual,
        custoMedio,
        movimentacoes: {
          entradas,
          saidas,
          perdas,
          ajustes,
        },
        totalMovimentacoes: produto.movimentacoesEstoque.length,
        status: saldoTotal <= 0 ? 'zerado' : saldoTotal < 10 ? 'baixo' : 'normal'
      }
    })
    
    // Summary statistics
    const totalProdutos = relatorioEstoque.length
    const produtosZerados = relatorioEstoque.filter(p => p.saldoAtual <= 0).length
    const produtosBaixoEstoque = relatorioEstoque.filter(p => p.saldoAtual > 0 && p.saldoAtual < 10).length
    const valorTotalEstoque = relatorioEstoque.reduce((sum, p) => sum + p.valorEstoque, 0)
    
    // Movement types summary
    const resumoMovimentacoes = relatorioEstoque.reduce(
      (acc, produto) => {
        acc.entradas += produto.movimentacoes.entradas
        acc.saidas += produto.movimentacoes.saidas
        acc.perdas += produto.movimentacoes.perdas
        acc.ajustes += produto.movimentacoes.ajustes
        return acc
      },
      { entradas: 0, saidas: 0, perdas: 0, ajustes: 0 }
    )
    
    return {
      periodo: dataInicio && dataFim ? {
        inicio: dataInicio,
        fim: dataFim,
      } : null,
      resumo: {
        totalProdutos,
        produtosZerados,
        produtosBaixoEstoque,
        valorTotalEstoque,
        resumoMovimentacoes,
      },
      produtos: relatorioEstoque.sort((a, b) => a.produto.nome.localeCompare(b.produto.nome)),
    }
  })
}