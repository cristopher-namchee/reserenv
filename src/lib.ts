import { sign } from 'hono/jwt';

import { JWT } from './const';
import { JWTResponse } from './types';

/**
 * Get auth token that can be used to interact with Google Chat API
 * using the provided service account credentials.
 *
 * @param {string} email Service account email
 * @param {string} privateKey Servic
 * @returns {Promise<string>} Resolves into a string. If successful, it will
 * resolve into an access token. If not, it will resolve an empty string.
 */
export async function getGoogleAuthToken(email: string, privateKey: string): Promise<string> {
  const iat = Math.floor(Date.now() / 1_000);
  const exp = iat + 3_600; // one hour

  const payload = {
    iss: email,
    scope: JWT.Scopes.join(' '),
    aud: 'https://oauth2.googleapis.com/token',
    exp,
    iat,
  };

  const jwt = await sign(payload, privateKey, JWT.Algorithm);

  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: JWT.Grant,
        assertion: jwt,
      })
    });

    if (!response.ok) {
      throw new Error(`Got ${response.status}`);
    }

    const body = await response.json() as JWTResponse;

    return body.access_token;
  } catch (err) {
    console.error('Failed to get access token:', err);

    return '';
  }
}
