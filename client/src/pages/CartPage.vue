<template>
  <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <h1 class="text-3xl font-bold text-gray-900 mb-8">{{ $t('cart.title') }}</h1>

    <div v-if="cartStore.items.length === 0" class="text-center py-16">
      <i class="fas fa-shopping-cart text-gray-300 text-6xl mb-4"></i>
      <h2 class="text-2xl font-medium text-gray-600 mb-2">{{ $t('cart.empty') }}</h2>
      <p class="text-gray-500 mb-6">{{ $t('cart.emptyMessage') }}</p>
      <router-link to="/products" class="inline-block bg-primary hover:bg-primary-dark text-white font-medium py-2 px-6 rounded-md transition-colors">
        {{ $t('cart.continueShopping') }}
      </router-link>
    </div>

    <div v-else class="lg:grid lg:grid-cols-12 lg:gap-x-12">
      <!-- Cart Items -->
      <div class="lg:col-span-8">
        <div class="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm mb-6 lg:mb-0">
          <div class="px-6 py-4 border-b border-gray-200">
            <h2 class="font-medium text-lg text-gray-900">{{ $t('cart.items') }} ({{ cartStore.totalItems }})</h2>
          </div>

          <ul class="divide-y divide-gray-200">
            <li v-for="item in cartStore.items" :key="item.id" class="p-6 flex flex-col sm:flex-row">
              <div class="flex-shrink-0 w-24 h-24 border border-gray-200 rounded-md overflow-hidden">
                <img :src="item.thumbnail" :alt="item.title" class="w-full h-full object-center object-cover">
              </div>

              <div class="sm:ml-6 flex-1 flex flex-col">
                <div>
                  <div class="flex justify-between">
                    <h3 class="text-base font-medium text-gray-900">
                      <router-link :to="`/products/${item.id}`" class="hover:text-primary">
                        {{ item.title }}
                      </router-link>
                    </h3>
                    <p class="ml-4 text-base font-medium text-gray-900">${{ (item.price * item.quantity).toFixed(2) }}</p>
                  </div>
                  <p class="mt-1 text-sm text-gray-500">{{ item.brand }}</p>
                </div>
                <div class="flex-1 flex items-end justify-between text-sm">
                  <div class="flex items-center mt-2 sm:mt-0">
                    <button @click="decrementQuantity(item)" class="text-gray-500 hover:text-primary border border-gray-300 rounded-l px-3 py-1">
                      <i class="fas fa-minus"></i>
                    </button>
                    <span class="mx-3 text-gray-700">{{ item.quantity }}</span>
                    <button @click="incrementQuantity(item)" class="text-gray-500 hover:text-primary border border-gray-300 rounded-r px-3 py-1">
                      <i class="fas fa-plus"></i>
                    </button>
                  </div>

                  <button @click="removeFromCart(item)" type="button" class="font-medium text-primary hover:text-primary-dark mt-2 sm:mt-0">
                    <i class="fas fa-trash-alt mr-1"></i> 
                    <span>{{ $t('cart.remove') }}</span>
                  </button>
                </div>
              </div>
            </li>
          </ul>
        </div>
      </div>

      <!-- Order Summary -->
      <div class="lg:col-span-4 mt-8 lg:mt-0">
        <div class="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
          <div class="px-6 py-4 border-b border-gray-200">
            <h2 class="font-medium text-lg text-gray-900">{{ $t('cart.orderSummary') }}</h2>
          </div>

          <div class="p-6">
            <div class="flex justify-between mb-4">
              <span class="text-gray-600">{{ $t('cart.subtotal') }}</span>
              <span class="font-medium">${{ cartStore.subtotal.toFixed(2) }}</span>
            </div>

            <div class="flex justify-between mb-4">
              <span class="text-gray-600">{{ $t('cart.shipping') }}</span>
              <span class="font-medium">
                {{ cartStore.subtotal > 50 ? $t('cart.freeShipping') : `$${shippingCost.toFixed(2)}` }}
              </span>
            </div>

            <div class="flex justify-between mb-4">
              <span class="text-gray-600">{{ $t('cart.tax') }}</span>
              <span class="font-medium">${{ (cartStore.subtotal * 0.08).toFixed(2) }}</span>
            </div>

            <div v-if="discount > 0" class="flex justify-between mb-4 text-green-600">
              <span>{{ $t('cart.discount') }}</span>
              <span class="font-medium">-${{ discount.toFixed(2) }}</span>
            </div>

            <div class="border-t border-gray-200 pt-4 mt-4">
              <div class="flex justify-between mb-2">
                <span class="text-lg font-bold text-gray-900">{{ $t('cart.total') }}</span>
                <span class="text-lg font-bold text-gray-900">${{ orderTotal.toFixed(2) }}</span>
              </div>
              <p class="text-xs text-gray-500 mb-6">{{ $t('cart.taxesIncluded') }}</p>

              <!-- Promo Code Input -->
              <div class="mb-6">
                <label for="promo-code" class="block text-sm font-medium text-gray-700 mb-2">
                  {{ $t('cart.promoCode') }}
                </label>
                <div class="flex">
                  <input 
                    v-model="promoCode" 
                    type="text" 
                    id="promo-code" 
                    class="flex-1 rounded-l-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-primary focus:border-primary" 
                    placeholder="SUMMER2023"
                  />
                  <button 
                    @click="applyPromoCode" 
                    type="button" 
                    class="bg-gray-100 border border-gray-300 border-l-0 rounded-r-md px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
                  >
                    {{ $t('cart.apply') }}
                  </button>
                </div>
                <p v-if="promoError" class="mt-1 text-sm text-red-600">{{ promoError }}</p>
                <p v-if="promoSuccess" class="mt-1 text-sm text-green-600">{{ promoSuccess }}</p>
              </div>

              <router-link to="/checkout" class="flex justify-center items-center w-full bg-primary hover:bg-primary-dark text-white py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium">
                {{ $t('cart.proceedToCheckout') }}
              </router-link>

              <div class="mt-4 text-center">
                <router-link to="/products" class="text-primary hover:text-primary-dark text-sm font-medium">
                  {{ $t('cart.continueShopping') }} →
                </router-link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useI18n } from 'vue-i18n'
import { useCartStore } from '../stores/cartStore'
import type { CartItem } from '../stores/cartStore'

const cartStore = useCartStore()
const toast = useToast()
const { t } = useI18n()

// State
const promoCode = ref('')
const promoError = ref('')
const promoSuccess = ref('')
const discount = ref(0)
const shippingCost = ref(5.99)

// Computed properties
const orderTotal = computed(() => {
  const subtotal = cartStore.subtotal
  const shipping = subtotal > 50 ? 0 : shippingCost.value
  const tax = subtotal * 0.08
  return subtotal + shipping + tax - discount.value
})

// Methods
const incrementQuantity = (item: CartItem) => {
  cartStore.incrementQuantity(item.id)
}

const decrementQuantity = (item: CartItem) => {
  cartStore.decrementQuantity(item.id)
}

const removeFromCart = (item: CartItem) => {
  cartStore.removeFromCart(item.id)
  
  toast.add({
    severity: 'info',
    summary: t('toast.info'),
    detail: t('toast.productRemoved', { title: item.title }),
    life: 3000
  })
}

const applyPromoCode = () => {
  // Reset messages
  promoError.value = ''
  promoSuccess.value = ''
  
  if (!promoCode.value) {
    promoError.value = t('cart.enterPromoCode')
    return
  }
  
  // Mock promo code functionality
  const validPromos: Record<string, number> = {
    'SUMMER2023': 10,  // $10 off
    'WELCOME15': 15,   // $15 off
    'SAVE20': 20      // $20 off
  }
  
  if (validPromos[promoCode.value]) {
    discount.value = validPromos[promoCode.value]
    promoSuccess.value = t('cart.promoApplied', { discount: `$${discount.value.toFixed(2)}` })
    
    toast.add({
      severity: 'success',
      summary: t('toast.success'),
      detail: t('toast.promoApplied', { code: promoCode.value }),
      life: 3000
    })
  } else {
    promoError.value = t('cart.invalidPromo')
    discount.value = 0
  }
}
</script>
