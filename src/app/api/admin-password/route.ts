
import { NextResponse } from 'next/server';
import { get } from '@vercel/edge-config';

export const runtime = 'edge'; // Optional: Use edge runtime

export async function GET() {
  try {
    const adminPassword = await get<string>('adminPassword');
    if (adminPassword === undefined) {
      // If not set in Edge Config, provide a default or handle error
      console.warn('Admin password not found in Edge Config. Using default or erroring.');
      // For this example, let's assume it must be set.
      return NextResponse.json({ error: 'Admin password not configured in Edge Config' }, { status: 500 });
    }
    return NextResponse.json({ password: adminPassword });
  } catch (error) {
    console.error('Error fetching admin password from Edge Config:', error);
    return NextResponse.json({ error: 'Failed to fetch admin password' }, { status: 500 });
  }
}
