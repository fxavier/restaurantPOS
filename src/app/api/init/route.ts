import { NextRequest } from 'next/server'
import { withErrorHandling } from '@/lib/api-routes'
import { inicializarDadosIniciais } from '@/lib/dados-iniciais'

export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    await inicializarDadosIniciais()
    return { message: 'Dados iniciais criados com sucesso' }
  })
}

export async function GET(request: NextRequest) {
  return withErrorHandling(async () => {
    await inicializarDadosIniciais()
    return { message: 'Dados iniciais criados com sucesso' }
  })
}