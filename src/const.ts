export const JWT = {
  Scopes: [
    'https://www.googleapis.com/auth/chat.messages.create',
    'https://www.googleapis.com/auth/chat.messages',
    'https://www.googleapis.com/auth/chat.spaces',
  ],
  Algorithm: 'RS256',
  Grant: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
};

export const Environments = ['dev', 'dev2', 'dev3', 'stag'];
export const Services = ['fe', 'be', 'dpo'];

export const EnvironmentAlias: Record<string, string> = {
  dev1: 'dev',
  staging: 'stag',
};

export const ServiceAlias: Record<string, string> = {
  frontend: 'fe',
  'front-end': 'fe',
  backend: 'be',
  'back-end': 'be',
};
