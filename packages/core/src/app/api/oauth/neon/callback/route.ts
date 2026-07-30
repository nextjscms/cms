import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  
  if (!code) {
    return NextResponse.json({ error: 'No authorization code provided' }, { status: 400 });
  }

  const clientId = process.env.NEON_OAUTH_CLIENT_ID;
  const clientSecret = process.env.NEON_OAUTH_CLIENT_SECRET;
  const redirectUri = process.env.NEON_OAUTH_REDIRECT_URI || 'http://localhost:3000/api/oauth/neon/callback';

  if (!clientId || !clientSecret) {
    return NextResponse.json({ error: 'Missing OAuth credentials in .env.local' }, { status: 500 });
  }

  try {
    // 1. Exchange code for access token
    const tokenResponse = await fetch('https://oauth2.neon.tech/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const err = await tokenResponse.text();
      console.error('Token exchange failed:', err);
      return NextResponse.json({ error: 'Failed to exchange token' }, { status: tokenResponse.status });
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // 2. Use the access token to fetch/create a project
    const projectsResponse = await fetch('https://console.neon.tech/api/v2/projects', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      }
    });

    const projectsData = await projectsResponse.json();
    let projectId = null;
    
    // For MVP, just take the first project if it exists. 
    // Otherwise, create a new project called "NextjsCMS"
    if (projectsData.projects && projectsData.projects.length > 0) {
      projectId = projectsData.projects[0].id;
    } else {
      const createResponse = await fetch('https://console.neon.tech/api/v2/projects', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          project: {
            name: "NextjsCMS Database"
          }
        })
      });
      const createData = await createResponse.json();
      projectId = createData.project.id;
      
      // Give the new project a few seconds to spin up completely
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    // 3. Get connection URI for the project
    // Fetch connection URI directly
    const connResponse = await fetch(`https://console.neon.tech/api/v2/projects/${projectId}/connection_uri`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      }
    });

    if (!connResponse.ok) {
      const err = await connResponse.text();
      console.error('Failed to get connection URI:', err);
      return NextResponse.json({ error: 'Failed to retrieve connection URI' }, { status: connResponse.status });
    }

    const connData = await connResponse.json();
    if (!connData.uri) {
      return NextResponse.json({ error: 'Could not parse connection URI from Neon response' }, { status: 500 });
    }

    const databaseUrl = connData.uri;

    // 4. Redirect to setup step 2 with the DB URL
    return NextResponse.redirect(new URL(`/setup?step=2&dbUrl=${encodeURIComponent(databaseUrl)}`, request.url));

  } catch (err: any) {
    console.error('OAuth Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
