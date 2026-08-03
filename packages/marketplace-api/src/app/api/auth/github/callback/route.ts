import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const stateStr = searchParams.get('state');

  if (!code || !stateStr) {
    return NextResponse.json({ error: 'Missing code or state' }, { status: 400 });
  }

  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error('GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET is not configured');
    return NextResponse.json({ error: 'OAuth proxy is not fully configured' }, { status: 500 });
  }

  let stateObj: { returnUrl: string, timestamp: number };
  try {
    stateObj = JSON.parse(Buffer.from(stateStr, 'base64url').toString('utf-8'));
  } catch (e) {
    return NextResponse.json({ error: 'Invalid state' }, { status: 400 });
  }

  if (!stateObj.returnUrl) {
    return NextResponse.json({ error: 'Invalid state returnUrl' }, { status: 400 });
  }

  // Exchange code for access token
  const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code
    })
  });

  const tokenData = await tokenResponse.json();

  if (tokenData.error) {
    return NextResponse.json({ error: tokenData.error_description || tokenData.error }, { status: 400 });
  }

  const accessToken = tokenData.access_token;
  if (!accessToken) {
    return NextResponse.json({ error: 'Failed to retrieve access token' }, { status: 500 });
  }

  // Redirect back to the CMS instance with the token
  // In a production app you might want to exchange this for a short-lived token or use postMessage,
  // but passing as a hash fragment or secure param is common for this kind of setup.
  const returnUrl = new URL(stateObj.returnUrl);
  returnUrl.searchParams.append('github_token', accessToken);

  return NextResponse.redirect(returnUrl.toString());
}
