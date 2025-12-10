import { NextResponse } from 'next/server';
import { logger } from './logger';
import { ZodError } from 'zod';

export async function apiHandler(callback: () => Promise<NextResponse>) {
  try {
    return await callback();
  } catch (error: any) {
    logger.error('API_ERROR', error);

    if (error instanceof ZodError) {
        return NextResponse.json(
            { error: 'Validation Failed', details: error.errors }, 
            { status: 400 }
        );
    }

    const message = process.env.NODE_ENV === 'development' ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}