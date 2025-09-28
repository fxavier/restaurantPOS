import { NextResponse } from 'next/server';
import { seedAuthData } from '@/lib/seed-auth';

export async function POST() {
  try {
    const result = await seedAuthData();
    
    return NextResponse.json({
      success: true,
      message: 'Authentication data initialized successfully',
      data: {
        restaurant: result?.restaurant?.nome,
        usersCreated: result?.users?.length || 0,
      },
    });
  } catch (error) {
    console.error('Error initializing auth data:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to initialize authentication data',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}