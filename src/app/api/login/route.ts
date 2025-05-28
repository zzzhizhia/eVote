
// src/app/api/login/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { getSession } from '@/lib/server/auth';

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();
    const session = await getSession();

    if (!process.env.ADMIN_PASSWORD) {
      console.error('ADMIN_PASSWORD environment variable is not set.');
      return NextResponse.json({ success: false, message: 'Server configuration error.' }, { status: 500 });
    }

    if (password === process.env.ADMIN_PASSWORD) {
      session.isAdmin = true;
      await session.save();
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ success: false, message: 'Invalid password' }, { status: 401 });
    }
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ success: false, message: 'An unexpected error occurred.' }, { status: 500 });
  }
}
