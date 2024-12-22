import { google } from 'googleapis';
import { auth } from '@clerk/nextjs/server';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI,
);

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events',
    ],
    // Specify the exact redirect URI that matches Google Console
    redirect_uri: process.env.GOOGLE_REDIRECT_URI,
    state: userId,
  });

  return new Response(JSON.stringify({ url: authUrl }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
