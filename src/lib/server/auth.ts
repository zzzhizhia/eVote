
import type { IronSessionOptions } from 'iron-session';
import { getIronSession, type IronSessionData } from 'iron-session';
import { cookies } from 'next/headers';

export interface SessionData extends IronSessionData {
  isAdmin?: boolean;
}

export const sessionOptions: IronSessionOptions = {
  password: process.env.SESSION_SECRET as string,
  cookieName: 'evote_session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
  },
};

if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) {
  console.warn(
    'SESSION_SECRET is not set or is too short (must be at least 32 characters). Using a default insecure secret for development. THIS IS NOT SAFE FOR PRODUCTION.'
  );
  if (process.env.NODE_ENV !== 'production') {
    sessionOptions.password = 'complex_password_at_least_32_characters_long_for_dev';
  } else {
    throw new Error('SESSION_SECRET environment variable is not set or is too short for production.');
  }
}


export async function getSession() {
  const session = await getIronSession<SessionData>(cookies(), sessionOptions);
  return session;
}

export async function isAdminSession(session?: SessionData): Promise<boolean> {
  const currentSession = session || await getSession();
  return currentSession.isAdmin === true;
}

