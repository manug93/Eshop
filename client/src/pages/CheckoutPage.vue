<template>
  <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900">{{ $t('checkout.title') }}</h1>
      <p class="mt-2 text-gray-600">{{ $t('checkout.subtitle') }}</p>
    </div>

    <div v-if="cartStore.items.length === 0" class="text-center py-16">
      <i class="fas fa-shopping-bag text-gray-300 text-6xl mb-4"></i>
      <h2 class="text-2xl font-medium text-gray-600 mb-2">{{ $t('checkout.emptyCart') }}</h2>
      <p class="text-gray-500 mb-6">{{ $t('checkout.addItemsMessage') }}</p>
      <router-link to="/products" class="inline-block bg-primary hover:bg-primary-dark text-white font-medium py-2 px-6 rounded-md transition-colors">
        {{ $t('checkout.browseProducts') }}
      </router-link>
    </div>

    <div v-else class="lg:grid lg:grid-cols-12 lg:gap-x-12">
      <!-- Checkout Form and Payment -->
      <div class="lg:col-span-7">
        <!-- Steps indicator -->
        <div class="mb-8">
          <div class="flex items-center">
            <div class="flex items-center">
              <div class="rounded-full h-8 w-8 flex items-center justify-center bg-primary text-white">
                <span v-if="currentStep > 1" class="fas fa-check text-sm"></span>
                <span v-else>1</span>
              </div>
              <span class="ml-2 text-gray-900 font-medium">{{ $t('checkout.steps.shipping') }}</span>
            </div>
            <div class="w-12 border-t border-gray-300 mx-3"></div>
            <div class="flex items-center">
              <div :class="currentStep >= 2 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'" class="rounded-full h-8 w-8 flex items-center justify-center">
                <span v-if="currentStep > 2" class="fas fa-check text-sm"></span>
                <span v-else>2</span>
              </div>
              <span :class="currentStep >= 2 ? 'text-gray-900' : 'text-gray-500'" class="ml-2 font-medium">{{ $t('checkout.steps.payment') }}</span>
            </div>
            <div class="w-12 border-t border-gray-300 mx-3"></div>
            <div class="flex items-center">
              <div :class="currentStep >= 3 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'" class="rounded-full h-8 w-8 flex items-center justify-center">
                <span v-if="currentStep > 3" class="fas fa-check text-sm"></span>
                <span v-else>3</span>
              </div>
              <span :class="currentStep >= 3 ? 'text-gray-900' : 'text-gray-500'" class="ml-2 font-medium">{{ $t('checkout.steps.confirmation') }}</span>
            </div>
          </div>
        </div>

        <!-- Step 1: Shipping Information -->
        <div v-if="currentStep === 1">
          <div class="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm mb-6">
            <div class="px-6 py-4 border-b border-gray-200">
              <h2 class="font-medium text-lg text-gray-900">{{ $t('checkout.shippingInformation') }}</h2>
            </div>
            <div class="p-6">
              <form @submit.prevent="goToPayment">
                <div class="grid grid-cols-2 gap-6">
                  <div class="col-span-2 sm:col-span-1">
                    <label for="first-name" class="block text-sm font-medium text-gray-700 mb-1">
                      {{ $t('checkout.form.firstName') }}
                    </label>
                    <input 
                      v-model="shippingInfo.firstName" 
                      type="text" 
                      id="first-name" 
                      class="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-primary focus:border-primary"
                      required 
                    />
                  </div>
                  <div class="col-span-2 sm:col-span-1">
                    <label for="last-name" class="block text-sm font-medium text-gray-700 mb-1">
                      {{ $t('checkout.form.lastName') }}
                    </label>
                    <input 
                      v-model="shippingInfo.lastName" 
                      type="text" 
                      id="last-name" 
                      class="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-primary focus:border-primary"
                      required 
                    />
                  </div>
                  <div class="col-span-2">
                    <label for="email" class="block text-sm font-medium text-gray-700 mb-1">
                      {{ $t('checkout.form.email') }}
                    </label>
                    <input 
                      v-model="shippingInfo.email" 
                      type="email" 
                      id="email" 
                      class="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-primary focus:border-primary"
                      required 
                    />
                  </div>
                  <div class="col-span-2">
                    <label for="address" class="block text-sm font-medium text-gray-700 mb-1">
                      {{ $t('checkout.form.address') }}
                    </label>
                    <input 
                      v-model="shippingInfo.address" 
                      type="text" 
                      id="address" 
                      class="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-primary focus:border-primary"
                      required 
                    />
                  </div>
                  <div class="col-span-2 sm:col-span-1">
                    <label for="city" class="block text-sm font-medium text-gray-700 mb-1">
                      {{ $t('checkout.form.city') }}
                    </label>
                    <input 
                      v-model="shippingInfo.city" 
                      type="text" 
                      id="city" 
                      class="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-primary focus:border-primary"
                      required 
                    />
                  </div>
                  <div class="col-span-2 sm:col-span-1">
                    <label for="postal-code" class="block text-sm font-medium text-gray-700 mb-1">
                      {{ $t('checkout.form.postalCode') }}
                    </label>
                    <input 
                      v-model="shippingInfo.postalCode" 
                      type="text" 
                      id="postal-code" 
                      class="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-primary focus:border-primary"
                      required 
                    />
                  </div>
                  <div class="col-span-2 sm:col-span-1">
                    <label for="state" class="block text-sm font-medium text-gray-700 mb-1">
                      {{ $t('checkout.form.state') }}
                    </label>
                    <input 
                      v-model="shippingInfo.state" 
                      type="text" 
                      id="state" 
                      class="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-primary focus:border-primary"
                      required 
                    />
                  </div>
                  <div class="col-span-2 sm:col-span-1">
                    <label for="country" class="block text-sm font-medium text-gray-700 mb-1">
                      {{ $t('checkout.form.country') }}
                    </label>
                    <select 
                      v-model="shippingInfo.country" 
                      id="country" 
                      class="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-primary focus:border-primary"
                      required
                    >
                      <option value="US">United States</option>
                      <option value="CA">Canada</option>
                      <option value="MX">Mexico</option>
                      <option value="FR">France</option>
                      <option value="GB">United Kingdom</option>
                    </select>
                  </div>
                  <div class="col-span-2">
                    <label for="phone" class="block text-sm font-medium text-gray-700 mb-1">
                      {{ $t('checkout.form.phone') }}
                    </label>
                    <input 
                      v-model="shippingInfo.phone" 
                      type="tel" 
                      id="phone" 
                      class="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-primary focus:border-primary"
                      required 
                    />
                  </div>
                </div>
                <div class="mt-6">
                  <button 
                    type="submit" 
                    class="w-full bg-primary hover:bg-primary-dark text-white py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium"
                  >
                    {{ $t('checkout.continueToPayment') }}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        <!-- Step 2: Payment -->
        <div v-else-if="currentStep === 2">
          <div class="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm mb-6">
            <div class="px-6 py-4 border-b border-gray-200">
              <h2 class="font-medium text-lg text-gray-900">{{ $t('checkout.paymentInformation') }}</h2>
            </div>
            <div class="p-6">
              <div v-if="stripeLoaded">
                <CheckoutForm :stripe-promise="stripePromise" />
              </div>
              <div v-else class="flex justify-center py-12">
                <ProgressSpinner style="width:50px;height:50px" strokeWidth="4" fill="var(--surface-ground)" animationDuration=".5s" />
              </div>

              <div class="mt-6 flex items-center">
                <button 
                  @click="currentStep = 1" 
                  class="text-primary hover:text-primary-dark font-medium"
                >
                  <i class="fas fa-arrow-left mr-2"></i>
                  {{ $t('checkout.backToShipping') }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Order Summary -->
      <div class="lg:col-span-5 mt-8 lg:mt-0">
        <div class="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm sticky top-8">
          <div class="px-6 py-4 border-b border-gray-200">
            <h2 class="font-medium text-lg text-gray-900">{{ $t('checkout.orderSummary') }}</h2>
          </div>

          <div class="p-6">
            <ul class="divide-y divide-gray-200 mb-6">
              <li v-for="item in cartStore.items" :key="item.id" class="py-3 flex">
                <div class="relative h-16 w-16 rounded border border-gray-200 overflow-hidden flex-shrink-0">
                  <img :src="item.thumbnail" :alt="item.title" class="h-full w-full object-center object-cover">
                  <div class="absolute top-0 right-0 -mt-1 -mr-1 bg-primary text-white rounded-full h-5 w-5 text-xs flex items-center justify-center">
                    {{ item.quantity }}
                  </div>
                </div>
                <div class="ml-4 flex-1 flex flex-col">
                  <div>
                    <div class="flex justify-between text-base font-medium text-gray-900">
                      <h3 class="text-sm">{{ item.title }}</h3>
                      <p class="ml-4">${{ (item.price * item.quantity).toFixed(2) }}</p>
                    </div>
                    <p class="mt-1 text-xs text-gray-500">{{ item.brand }}</p>
                  </div>
                </div>
              </li>
            </ul>

            <div class="space-y-2">
              <div class="flex justify-between">
                <span class="text-gray-600">{{ $t('checkout.subtotal') }}</span>
                <span class="font-medium">${{ cartStore.subtotal.toFixed(2) }}</span>
              </div>

              <div class="flex justify-between">
                <span class="text-gray-600">{{ $t('checkout.shipping') }}</span>
                <span class="font-medium">
                  {{ cartStore.subtotal > 50 ? $t('checkout.freeShipping') : '$5.99' }}
                </span>
              </div>

              <div class="flex justify-between">
                <span class="text-gray-600">{{ $t('checkout.tax') }}</span>
                <span class="font-medium">${{ (cartStore.subtotal * 0.08).toFixed(2) }}</span>
              </div>

              <div class="border-t border-gray-200 pt-2 mt-2">
                <div class="flex justify-between">
                  <span class="text-base font-bold text-gray-900">{{ $t('checkout.total') }}</span>
                  <span class="text-base font-bold text-gray-900">${{ orderTotal.toFixed(2) }}</span>
                </div>
              </div>
            </div>

            <div class="mt-6">
              <div class="bg-gray-50 p-4 rounded-md">
                <div class="flex items-center mb-2">
                  <i class="fas fa-shield-alt text-green-600 mr-2"></i>
                  <span class="text-sm font-medium text-gray-900">{{ $t('checkout.secureCheckout') }}</span>
                </div>
                <p class="text-xs text-gray-600">{{ $t('checkout.securityMessage') }}</p>
              </div>
            </div>

            <div class="mt-6 flex justify-center space-x-4">
              <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/visa/visa-original.svg" alt="Visa" class="h-8">
              <span class="h-8 w-12 bg-gray-100 rounded flex items-center justify-center">
                <i class="fab fa-cc-mastercard text-gray-900 text-xl"></i>
              </span>
              <span class="h-8 w-12 bg-gray-100 rounded flex items-center justify-center">
                <i class="fab fa-cc-apple-pay text-gray-900 text-xl"></i>
              </span>
              <span class="h-8 w-12 bg-gray-100 rounded flex items-center justify-center">
                <i class="fab fa-cc-paypal text-gray-900 text-xl"></i>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useCartStore } from '../stores/cartStore'
import { loadStripe } from '@stripe/stripe-js'
import CheckoutForm from '../components/checkout/CheckoutForm.vue'

const cartStore = useCartStore()

// Step tracking
const currentStep = ref(1)

// Stripe setup
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || '')
const stripeLoaded = ref(false)

// Form data
const shippingInfo = ref({
  firstName: '',
  lastName: '',
  email: '',
  address: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'US',
  phone: ''
})

// Computed
const orderTotal = computed(() => {
  const subtotal = cartStore.subtotal
  const shipping = subtotal > 50 ? 0 : 5.99
  const tax = subtotal * 0.08
  return subtotal + shipping + tax
})

// Methods
const goToPayment = () => {
  currentStep.value = 2
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

onMounted(async () => {
  try {
    await stripePromise
    stripeLoaded.value = true
  } catch (error) {
    console.error('Failed to load Stripe:', error)
  }
})
</script>
