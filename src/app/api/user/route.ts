
// src/app/api/user/route.ts
import { NextResponse } from 'next/server';
import { getSession, isAdminSession } from '@/lib/server/auth';

export async function GET() {
  try {
    const session = await getSession();
    const isAdmin = await isAdminSession(session);
    return NextResponse.json({ isAdmin });
  } catch (error) {
    console.error('User status error:', error);
    return NextResponse.json({ isAdmin: false, message: 'An unexpected error occurred.' }, { status: 500 });
  }
}
