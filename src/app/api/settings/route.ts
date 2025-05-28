
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

    const settings = {
      resultsVisibility: resultsVisibilityRes.rows[0]?.value === 'true',
      customTexts: customTextsRes.rows[0]?.value ? JSON.parse(customTextsRes.rows[0].value) : {},
    };
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ message: 'Error fetching settings' }, { status: 500 });
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
    console.error('Error updating setting:', error);
    return NextResponse.json({ message: 'Error updating setting' }, { status: 500 });
  }
}
