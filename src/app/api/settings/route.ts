
// src/app/api/settings/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { getDb, initializeDbSchema } from '@/lib/server/db';
import { isAdminSession, getSession } from '@/lib/server/auth';

// Ensure DB schema is checked/initialized on first API call in dev
if (process.env.NODE_ENV === 'development') {
  initializeDbSchema();
}

export async function GET() {
  try {
    const db = getDb();
    const resultsVisibilityRes = await db.query("SELECT value FROM app_settings WHERE key = 'resultsVisibility'");
    const customTextsRes = await db.query("SELECT value FROM app_settings WHERE key = 'customTexts'");

    // Ensure rows exist before trying to access them
    const resultsVisibilityValue = resultsVisibilityRes.rows[0]?.value;
    const customTextsValue = customTextsRes.rows[0]?.value;

    if (resultsVisibilityValue === undefined) {
        console.warn("API GET /api/settings: 'resultsVisibility' key not found in app_settings table. Using default.");
    }
    if (customTextsValue === undefined) {
        console.warn("API GET /api/settings: 'customTexts' key not found in app_settings table. Using default.");
    }

    const settings = {
      resultsVisibility: resultsVisibilityValue === 'true', // Default to false if undefined
      customTexts: customTextsValue ? JSON.parse(customTextsValue) : {}, // Default to empty object if undefined
    };
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching settings in API /api/settings GET:', error);
    // Log the specific error to Vercel logs
    let errorMessage = 'Error fetching settings';
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    return NextResponse.json({ message: 'Error fetching settings', error: errorMessage }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const session = await getSession();
  if (!await isAdminSession(session)) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { key, value } = await request.json();
    const db = getDb();

    if (key === 'resultsVisibility') {
      await db.query("INSERT INTO app_settings (key, value) VALUES ('resultsVisibility', $1) ON CONFLICT (key) DO UPDATE SET value = $1", [String(value)]);
    } else if (key === 'customTexts') {
      await db.query("INSERT INTO app_settings (key, value) VALUES ('customTexts', $1) ON CONFLICT (key) DO UPDATE SET value = $1", [JSON.stringify(value)]);
    } else {
      return NextResponse.json({ message: 'Invalid setting key' }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating setting in API /api/settings PUT:', error);
    // Log the specific error to Vercel logs
    let errorMessage = 'Error updating setting';
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    return NextResponse.json({ message: 'Error updating setting', error: errorMessage }, { status: 500 });
  }
}
