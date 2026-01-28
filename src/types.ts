export interface Env {
  ENVIRONMENT_RESERVATION: KVNamespace;
  SLACK_BOT_TOKEN: string;

  SERVICE_ACCOUNT_EMAIL: string;
  SERVICE_ACCOUNT_PRIVATE_KEY: string;
}

export interface GoogleAuthResponse {
  access_token: string;
}

export interface GoogleChatEvent {
  type: string;
  message?: {
    text: string;
    slashCommand?: {
      commandId: number;
    }
  }
  user: {
    name: string;
    displayName: string;
    email: string;
    type: 'HUMAN' | 'BOT';
  }
}