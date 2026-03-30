// OAuth token response type (not part of Content API schema)
interface OAuthTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface OAuthError {
  code?: string;
  error?: string;
  error_description?: string;
}

// OAuth paths (separate from Content API)
export interface OAuthPaths {
  '/oauth/token': {
    post: {
      requestBody: {
        content: {
          'application/json': {
            grant_type: string;
            client_id: string;
            client_secret: string;
          };
        };
      };
      responses: {
        200: {
          content: {
            'application/json': OAuthTokenResponse;
          };
        };
        400: {
          content: {
            'application/json': OAuthError;
          };
        };
      };
    };
  };
}
