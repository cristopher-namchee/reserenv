export const JWT = {
  Scopes: [
    'https://www.googleapis.com/auth/chat.messages.create',
    'https://www.googleapis.com/auth/chat.messages',
    'https://www.googleapis.com/auth/chat.spaces',
  ],
  Algorithm: 'RS256',
  Grant: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
};

type Environments = 'dev' | 'dev2' | 'dev3' | 'stag';
type Services = 'frontend' | 'backend' | 'dpo';

export const Environments = ['dev', 'dev2', 'dev3', 'stag'];
export const Services = ['frontend', 'backend', 'dpo'];

export const EnvironmentAlias: Record<string, Environments> = {
  dev1: 'dev',
  staging: 'stag',
};

export const ServiceAlias: Record<string, Services> = {
  fe: 'frontend',
  'front-end': 'frontend',
  be: 'backend',
  'back-end': 'backend',
};

export const ServiceLabel: Record<Services, string> = {
  frontend: 'Frontend',
  backend: 'Backend',
  dpo: 'DPO',
};

export const ServiceIcon: Record<Services, string> = {
  frontend: 'devices',
  backend: 'host',
  dpo: 'media_link',
};
