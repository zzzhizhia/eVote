
import { NextResponse } from 'next/server';
import { get, set } from '@vercel/edge-config'; // 'set' is for conceptual update

export const runtime = 'edge';

const EDGE_CONFIG_ITEM_KEY = 'resultsVisibility';

export async function GET() {
  try {
    const isPublic = await get<boolean>(EDGE_CONFIG_ITEM_KEY);
    // Default to false (private) if not set in Edge Config
    return NextResponse.json({ isPublic: isPublic === undefined ? false : isPublic });
  } catch (error) {
    console.error('Error fetching results visibility from Edge Config:', error);
    return NextResponse.json({ error: 'Failed to fetch results visibility' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { isPublic } = await request.json() as { isPublic: boolean };
    // In a real scenario, you would use the Vercel API to update Edge Config.
    // This requires an API token and is a more involved setup.
    // For this prototype, we'll acknowledge the request and simulate success.
    // await set(EDGE_CONFIG_ITEM_KEY, isPublic); // This is a conceptual 'set'
    console.log('Received request to update results visibility in Edge Config (simulation):', isPublic);
    return NextResponse.json({ message: 'Results visibility update acknowledged (simulation). Actual update requires Vercel API.' });
  } catch (error) {
    console.error('Error processing request to update results visibility:', error);
    return NextResponse.json({ error: 'Failed to process results visibility update' }, { status: 500 });
  }
}
