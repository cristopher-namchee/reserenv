export const JWT = {
  Scopes: [
    'https://www.googleapis.com/auth/chat.messages.create',
    'https://www.googleapis.com/auth/chat.messages',
    'https://www.googleapis.com/auth/chat.memberships',
  ],
  Algorithm: 'RS256',
  Grant: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
};

export const Environments = ['dev', 'dev2', 'dev3', 'stag'];
