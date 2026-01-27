export interface Env {
  ENVIRONMENT_RESERVATION: KVNamespace;
  SLACK_BOT_TOKEN: string;

  SERVICE_ACCOUNT_EMAIL: string;
  SERVICE_ACCOUNT_PRIVATE_KEY: string;
}

export interface JWTResponse {
  access_token: string;
}
