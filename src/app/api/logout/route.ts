
// src/app/api/logout/route.ts
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/server/auth';

export async function POST() {
  try {
    const session = await getSession();
    session.destroy();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ success: false, message: 'An unexpected error occurred.' }, { status: 500 });
  }
}
