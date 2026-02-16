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
export const Services = ['frontend', 'backend', 'dpo'];

export const EnvironmentAlias: Record<string, string> = {
  dev1: 'dev',
  staging: 'stag',
};

export const ServiceAlias: Record<string, string> = {
  fe: 'frontend',
  'front-end': 'frontend',
  be: 'backend',
  'back-end': 'backend',
};

export const ServiceLabel: Record<string, string> = {
  fe: 'Frontend',
  be: 'Backend',
  dpo: 'DPO',
};

export const ServiceIcon: Record<string, string> = {
  fe: 'devices',
  be: 'host',
  dpo: 'media_link',
};
