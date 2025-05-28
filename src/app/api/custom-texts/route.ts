
import { NextResponse } from 'next/server';
import { get, set } from '@vercel/edge-config'; // 'set' is for conceptual update

export const runtime = 'edge';

// Define a type for the structure of custom texts
export interface CustomTexts {
  [locale: string]: {
    homePageTitle?: string;
    homePageDescription?: string;
    homePageIntroText?: string;
    votePageIntroText?: string;
  };
}

const EDGE_CONFIG_ITEM_KEY = 'appCustomTexts';

export async function GET() {
  try {
    const customTexts = await get<CustomTexts>(EDGE_CONFIG_ITEM_KEY);
    if (customTexts === undefined) {
      // Return empty or default structure if not found
      return NextResponse.json({});
    }
    return NextResponse.json(customTexts);
  } catch (error) {
    console.error('Error fetching custom texts from Edge Config:', error);
    return NextResponse.json({ error: 'Failed to fetch custom texts' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const newTexts = await request.json() as CustomTexts;
    // In a real scenario, you would use the Vercel API to update Edge Config.
    // This requires an API token and is a more involved setup.
    // For this prototype, we'll acknowledge the request and simulate success.
    // await set(EDGE_CONFIG_ITEM_KEY, newTexts); // This is a conceptual 'set'
    console.log('Received request to update custom texts in Edge Config (simulation):', newTexts);
    return NextResponse.json({ message: 'Custom texts update acknowledged (simulation). Actual update requires Vercel API.' });
  } catch (error) {
    console.error('Error processing request to update custom texts:', error);
    return NextResponse.json({ error: 'Failed to process custom texts update request' }, { status: 500 });
  }
}
