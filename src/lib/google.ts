import { JWT } from '../const';

import type { GoogleAuthResponse } from '../types';

function b64(input: ArrayBuffer | string) {
  const bytes =
    typeof input === 'string'
      ? new TextEncoder().encode(input)
      : new Uint8Array(input);

  return btoa(String.fromCharCode(...bytes))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function pemToArrayBuffer(pem: string) {
  const base64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\\n/g, '')
    .replace(/\s+/g, '');

  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes.buffer;
}

/**
 * Get auth token that can be used to interact with Google Chat API
 * using the provided service account credentials.
 *
 * @param {string} email Service account e-mail
 * @param {string} pem Service account private key
 * @returns {Promise<string>} Resolves into a string. If successful, it will
 * resolve into an access token. If not, it will resolve an empty string.
 */
export async function getGoogleAuthToken(
  email: string,
  pem: string,
): Promise<string> {
  try {
    const iat = Math.floor(Date.now() / 1_000);
    const exp = iat + 3_600;

    const header = b64(JSON.stringify({ alg: JWT.Algorithm, typ: 'JWT' }));

    const claims = b64(
      JSON.stringify({
        iss: email,
        scope: JWT.Scopes.join(' '),
        aud: 'https://oauth2.googleapis.com/token',
        exp,
        iat,
      }),
    );

    const signatureInput = `${header}.${claims}`;
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'pkcs8',
      pemToArrayBuffer(pem),
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['sign'],
    );

    const signature = await crypto.subtle.sign(
      'RSASSA-PKCS1-v1_5',
      key,
      encoder.encode(signatureInput),
    );

    const jwt = `${signatureInput}.${b64(signature)}`;

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: JWT.Grant,
        assertion: jwt,
      }),
    });

    if (!response.ok) {
      throw new Error(`Response returned ${response.status}`);
    }

    const body = (await response.json()) as GoogleAuthResponse;

    if (!body.access_token) {
      throw new Error('Access token is empty');
    }

    return body.access_token;
  } catch (err) {
    console.error('Failed to get access token from Google:', err);

    return '';
  }
}

async function createNewDM(email: string, token: string) {
  const url = `https://chat.googleapis.com/v1/spaces:setup`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      space: {
        spaceType: 'DIRECT_MESSAGE',
        singleUserBotDm: false,
      },
      membership: {
        member: {
          name: `users/${email}`,
          type: 'HUMAN',
        },
      },
    }),
  });

  if (!response.ok) {
    console.error(
      `Failed to create space. Response returned ${response.status}`,
    );

    return '';
  }

  const data = (await response.json()) as { name: string };

  return `https://chat.google.com/room/${data.name.split('/')[1]}`;
}

/**
 * Fetches the DM space ID and constructs a deep link.
 *
 * @param {string} targetEmail - The email of the person you want to chat with.
 * @param {string} accessToken - A valid OAuth2 access token.
 */
export async function getChatLink(
  email: string,
  token: string,
): Promise<string> {
  if (!email) {
    return '';
  }

  const userAlias = `users/${email}`;
  const url = `https://chat.googleapis.com/v1/spaces:findDirectMessage?name=${encodeURIComponent(userAlias)}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return createNewDM(email, token);
      }

      console.error(
        `Failed to find Google Space for ${email}. Response returned `,
      );
    }

    const data = (await response.json()) as { name: string };

    const spaceId = data.name.split('/')[1];
    const deepLink = `https://chat.google.com/room/${spaceId}`;

    return deepLink;
  } catch (err) {
    console.error('Failed to fetch space:', err);

    return '';
  }
}
