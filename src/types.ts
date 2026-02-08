export interface Env {
  ENVIRONMENT_RESERVATION: KVNamespace;

  GOOGLE_SPACE: string;

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
  user: {
    name: string;
    type: 'HUMAN' | 'BOT';
    email: string;
    displayName: string;
  };
}

export interface ReservationInfo {
  id: string;
  email: string;
  name: string;
  since: string;
}
