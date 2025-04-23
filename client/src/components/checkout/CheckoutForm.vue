<template>
  <div class="max-w-lg mx-auto bg-white p-6 rounded-lg shadow">
    <div v-if="loading" class="flex flex-col items-center justify-center py-12">
      <ProgressSpinner style="width:50px;height:50px" strokeWidth="4" />
      <p class="mt-4 text-gray-600">{{ $t('checkout.preparing') }}</p>
    </div>
    
    <div v-else-if="!clientSecret" class="text-center py-12">
      <i class="fas fa-exclamation-circle text-red-500 text-5xl mb-4"></i>
      <h3 class="text-xl font-medium text-gray-800 mb-2">{{ $t('checkout.error') }}</h3>
      <p class="text-gray-600 mb-6">{{ $t('checkout.unableToInitialize') }}</p>
      <Button @click="retry" class="bg-primary hover:bg-primary-dark text-white font-medium py-2 px-4 rounded">
        {{ $t('checkout.tryAgain') }}
      </Button>
    </div>
    
    <div v-else>
      <h2 class="text-2xl font-bold mb-6">{{ $t('checkout.title') }}</h2>
      
      <div v-if="error" class="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        {{ error }}
      </div>
      
      <form @submit.prevent="handleSubmit">
        <div class="mb-6">
          <div id="payment-element"></div>
        </div>
        
        <Button
          type="submit"
          :disabled="isProcessing"
          class="w-full bg-primary hover:bg-primary-dark text-white font-medium py-3 px-4 rounded"
          :class="{ 'opacity-70 cursor-not-allowed': isProcessing }"
        >
          <span v-if="isProcessing">
            <i class="fas fa-spinner fa-spin mr-2"></i>
            {{ $t('checkout.processing') }}
          </span>
          <span v-else>
            {{ $t('checkout.pay') }} - ${{ totalAmount.toFixed(2) }}
          </span>
        </Button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useCartStore } from '../../stores/cartStore'
import { createPaymentIntent } from '../../services/stripe'
import type { Stripe, StripeElements, StripePaymentElement } from '@stripe/stripe-js'

const props = defineProps<{
  stripePromise: Promise<Stripe | null>
}>()

const cartStore = useCartStore()
const toast = useToast()
const { t } = useI18n()
const router = useRouter()

const clientSecret = ref<string | null>(null)
const elements = ref<StripeElements | null>(null)
const stripe = ref<Stripe | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const isProcessing = ref(false)
const totalAmount = ref(cartStore.subtotal)

const fetchPaymentIntent = async () => {
  try {
    loading.value = true
    error.value = null
    
    // Create cart items array for the API
    const items = cartStore.items.map(item => ({
      id: item.id,
      quantity: item.quantity
    }))
    
    // Create payment intent on the server
    const { clientSecret: secret } = await createPaymentIntent(items, totalAmount.value)
    clientSecret.value = secret
    
    // Load Stripe elements
    if (clientSecret.value) {
      await initializeStripe()
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : t('checkout.errorMessage')
    console.error('Payment intent error:', err)
  } finally {
    loading.value = false
  }
}

const retry = () => {
  fetchPaymentIntent()
}

const initializeStripe = async () => {
  try {
    stripe.value = await props.stripePromise
    
    if (!stripe.value || !clientSecret.value) {
      throw new Error('Stripe or client secret not available')
    }
    
    elements.value = stripe.value.elements({
      clientSecret: clientSecret.value,
      appearance: {
        theme: 'stripe',
        variables: {
          colorPrimary: '#3B82F6',
          colorBackground: '#ffffff',
          colorText: '#1f2937',
          colorDanger: '#ef4444',
          fontFamily: 'Roboto, system-ui, sans-serif',
          borderRadius: '0.5rem'
        }
      }
    })
    
    // Create and mount the Payment Element
    const paymentElement = elements.value.create('payment')
    paymentElement.mount('#payment-element')
  } catch (err) {
    error.value = err instanceof Error ? err.message : t('checkout.stripeError')
    console.error('Stripe initialization error:', err)
  }
}

const handleSubmit = async () => {
  if (!stripe.value || !elements.value) {
    return
  }
  
  try {
    isProcessing.value = true
    error.value = null
    
    // Confirm payment
    const { error: paymentError } = await stripe.value.confirmPayment({
      elements: elements.value,
      confirmParams: {
        return_url: `${window.location.origin}/order-confirmation`
      },
      redirect: 'if_required'
    })
    
    if (paymentError) {
      error.value = paymentError.message || t('checkout.paymentFailed')
      toast.add({
        severity: 'error',
        summary: t('toast.error'),
        detail: error.value,
        life: 5000
      })
    } else {
      // Payment succeeded
      toast.add({
        severity: 'success',
        summary: t('toast.success'),
        detail: t('checkout.paymentSuccess'),
        life: 3000
      })
      
      // Clear cart and redirect
      cartStore.clearCart()
      router.push('/order-confirmation')
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : t('checkout.unexpectedError')
    console.error('Payment error:', err)
    
    toast.add({
      severity: 'error',
      summary: t('toast.error'),
      detail: error.value,
      life: 5000
    })
  } finally {
    isProcessing.value = false
  }
}

onMounted(() => {
  fetchPaymentIntent()
})

onUnmounted(() => {
  if (elements.value) {
    const paymentElement = elements.value.getElement('payment') as StripePaymentElement
    if (paymentElement) {
      paymentElement.unmount()
    }
  }
})
</script>
