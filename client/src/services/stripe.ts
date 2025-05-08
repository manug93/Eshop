import { apiRequest } from '../lib/queryClient'

export interface CartItemRequest {
  id: number
  quantity: number
}

/**
 * Creates a payment intent using the current cart items
 */
export async function createPaymentIntent(amount: number, currency: string) {
  const response = await apiRequest('POST', '/api/create-payment-intent', {
    body: { amount, currency }
  });
  return response.data;
}

/**
 * Get or create a subscription
 * Note: This is for future implementation of subscription-based products
 */
export async function getOrCreateSubscription() {
  const response = await apiRequest('POST', '/api/get-or-create-subscription', {});
  return response.data;
}

/**
 * Verify that a payment was successful
 */
export async function verifyPayment(paymentIntentId: string) {
  const response = await apiRequest('GET', `/api/verify-payment/${paymentIntentId}`, undefined);
  return response.data;
}

/**
 * Apply a promo code to get discount
 */
export async function applyPromoCode(code: string) {
  const response = await apiRequest('POST', '/api/apply-promo', {
    body: { code }
  });
  return response.data;
}
