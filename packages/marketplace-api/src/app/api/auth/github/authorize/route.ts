import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const returnUrl = searchParams.get('return_url');
  
  if (!returnUrl) {
    return NextResponse.json({ error: 'Missing return_url' }, { status: 400 });
  }

  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) {
    console.error('GITHUB_CLIENT_ID is not configured');
    return NextResponse.json({ error: 'OAuth proxy is not fully configured' }, { status: 500 });
  }

  // Generate a random state string and append the return_url
  // This state will be passed back to us by GitHub so we know where to redirect the user
  const stateObj = {
    returnUrl,
    timestamp: Date.now()
  };
  const state = Buffer.from(JSON.stringify(stateObj)).toString('base64url');

  const authorizeUrl = new URL('https://github.com/login/oauth/authorize');
  authorizeUrl.searchParams.append('client_id', clientId);
  authorizeUrl.searchParams.append('state', state);

  return NextResponse.redirect(authorizeUrl.toString());
}
