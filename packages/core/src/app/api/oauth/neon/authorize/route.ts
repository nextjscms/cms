import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const clientId = process.env.NEON_OAUTH_CLIENT_ID;
  const redirectUri = process.env.NEON_OAUTH_REDIRECT_URI || 'http://localhost:3000/api/oauth/neon/callback';
  
  if (!clientId) {
    return NextResponse.json({ error: 'NEON_OAUTH_CLIENT_ID is not configured in .env.local' }, { status: 500 });
  }

  const neonOAuthUrl = new URL('https://oauth2.neon.tech/oauth2/auth');
  neonOAuthUrl.searchParams.append('client_id', clientId);
  neonOAuthUrl.searchParams.append('redirect_uri', redirectUri);
  neonOAuthUrl.searchParams.append('response_type', 'code');
  neonOAuthUrl.searchParams.append('scope', 'urn:neon:api:offline_access');
  // Optional: Add state parameter for CSRF protection
  
  return NextResponse.redirect(neonOAuthUrl);
}
