export const JWT = {
  Grant: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
  Algorithm: 'RS256' as const,
  Scopes: ['https://www.googleapis.com/auth/chat.messages.create']
}
