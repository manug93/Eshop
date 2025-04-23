import { apiRequest } from '../lib/queryClient'

export interface CartItemRequest {
  id: number
  quantity: number
}

/**
 * Creates a payment intent using the current cart items
 */
export async function createPaymentIntent(
  items: CartItemRequest[],
  amount: number
): Promise<{ clientSecret: string }> {
  try {
    const response = await apiRequest('POST', '/api/create-payment-intent', {
      items,
      amount
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(errorText || 'Failed to create payment intent')
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error creating payment intent:', error)
    throw error
  }
}

/**
 * Get or create a subscription
 * Note: This is for future implementation of subscription-based products
 */
export async function getOrCreateSubscription(): Promise<{ 
  subscriptionId: string, 
  clientSecret: string 
}> {
  try {
    const response = await apiRequest('POST', '/api/get-or-create-subscription', {})
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(errorText || 'Failed to create subscription')
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error creating subscription:', error)
    throw error
  }
}

/**
 * Verify that a payment was successful
 */
export async function verifyPayment(paymentIntentId: string): Promise<{ 
  success: boolean,
  orderId?: string
}> {
  try {
    const response = await apiRequest('GET', `/api/verify-payment/${paymentIntentId}`, undefined)
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(errorText || 'Failed to verify payment')
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error verifying payment:', error)
    throw error
  }
}

/**
 * Apply a promo code to get discount
 */
export async function applyPromoCode(code: string): Promise<{ 
  valid: boolean,
  discount?: number,
  type?: 'percentage' | 'fixed',
  message?: string
}> {
  try {
    const response = await apiRequest('POST', '/api/apply-promo', { code })
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(errorText || 'Failed to apply promo code')
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error applying promo code:', error)
    throw error
  }
}
