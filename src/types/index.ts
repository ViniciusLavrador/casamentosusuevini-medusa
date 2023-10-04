export interface AsaasOptions {
  api_key: string;
  webhook_secret: string;
  /**
   * Set a default description on the intent if the context does not provide one
   */
  payment_description?: string;
}
