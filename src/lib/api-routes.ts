import { prisma } from './prisma'
import { NextRequest, NextResponse } from 'next/server'

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T = any> {
  success: boolean
  data?: T[]
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  error?: string
  message?: string
}

export function createResponse<T>(
  data: T,
  status: number = 200
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
    },
    { status }
  )
}

export function createErrorResponse(
  error: string,
  status: number = 400
): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error,
    },
    { status }
  )
}

export function handleApiError(error: unknown): NextResponse<ApiResponse> {
  console.error('API Error:', error)
  
  if (error instanceof Error) {
    return createErrorResponse(error.message, 500)
  }
  
  return createErrorResponse('Internal server error', 500)
}

export async function withErrorHandling<T>(
  handler: () => Promise<T>
): Promise<NextResponse<ApiResponse<T>>> {
  try {
    const result = await handler()
    return createResponse(result)
  } catch (error) {
    return handleApiError(error)
  }
}

export function validateRequiredFields(
  data: Record<string, any>,
  requiredFields: string[]
): string[] {
  const missingFields: string[] = []
  
  for (const field of requiredFields) {
    if (!data[field] || data[field] === '') {
      missingFields.push(field)
    }
  }
  
  return missingFields
}

export async function getQueryParams(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined
  const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined
  const orderBy = searchParams.get('orderBy')
  const orderDirection = searchParams.get('orderDirection') as 'asc' | 'desc' || 'asc'
  
  return {
    limit,
    offset,
    orderBy: orderBy ? { [orderBy]: orderDirection } : undefined,
  }
}

export async function getPaginationParams(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '20')))
  const offset = (page - 1) * limit
  const orderBy = searchParams.get('orderBy')
  const orderDirection = searchParams.get('orderDirection') as 'asc' | 'desc' || 'asc'
  
  return {
    page,
    limit,
    offset,
    orderBy: orderBy ? { [orderBy]: orderDirection } : undefined,
  }
}

export function createPaginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
  status: number = 200
): NextResponse<PaginatedResponse<T>> {
  const totalPages = Math.ceil(total / limit)
  
  return NextResponse.json(
    {
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    },
    { status }
  )
}