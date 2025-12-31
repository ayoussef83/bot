export type ProviderSendResult = {
  success: boolean;
  messageId?: string;
  provider?: string;
  response?: any;
};

export interface EmailProvider {
  send(
    to: string,
    subject: string,
    message: string,
    template?: string,
    payload?: any,
  ): Promise<ProviderSendResult>;
}

export interface SmsProvider {
  send(
    to: string,
    message: string,
    template?: string,
    payload?: any,
  ): Promise<ProviderSendResult>;
}

export interface WhatsAppProvider {
  send(
    to: string,
    message: string,
    template?: string,
    payload?: any,
  ): Promise<ProviderSendResult>;
}

// Placeholder for future: Meta Messenger / IG DM (Graph API webhooks + send API)
export interface MetaMessengerProvider {
  send(
    to: string,
    message: string,
    template?: string,
    payload?: any,
  ): Promise<ProviderSendResult>;
}


