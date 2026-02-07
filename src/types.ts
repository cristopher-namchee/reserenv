export interface Env {
  ENVIRONMENT_RESERVATION: KVNamespace;

  SERVICE_ACCOUNT_EMAIL: string;
  SERVICE_ACCOUNT_PRIVATE_KEY: string;
}

export interface GoogleAuthResponse {
  access_token: string;
}

export interface GoogleChatEvent {
  type: string;
  space: {
    name: string;
    type: 'SPACE' | 'DM';
    singleUserBotDm: boolean;
  };
  message?: {
    text: string;
    slashCommand?: {
      commandId: string;
    };
  };
  sender: {
    name: string;
    email: string;
    type: 'HUMAN' | 'BOT';
  };
}
