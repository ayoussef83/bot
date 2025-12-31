export type MetaOAuthUrlResponse = {
  url: string;
};

export type MetaOAuthExchangeBody = {
  code: string;
  state: string;
  redirectUri: string;
};


