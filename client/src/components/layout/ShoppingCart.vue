<template>
  <div v-if="cartStore.isCartOpen" class="fixed inset-0 overflow-hidden z-50" id="shopping-cart-panel">
    <div class="absolute inset-0 overflow-hidden">
      <div @click="closeCart" class="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
      <div class="fixed inset-y-0 right-0 pl-10 max-w-full flex">
        <div class="w-screen max-w-md">
          <div class="h-full flex flex-col bg-white shadow-xl overflow-y-auto">
            <div class="flex-1 py-6 overflow-y-auto px-4 sm:px-6 custom-scrollbar">
              <div class="flex items-start justify-between">
                <h2 class="text-lg font-medium text-gray-900">{{ $t('cart.title') }}</h2>
                <div class="ml-3 h-7 flex items-center">
                  <button @click="closeCart" class="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none">
                    <span class="sr-only">Close panel</span>
                    <i class="fas fa-times text-xl"></i>
                  </button>
                </div>
              </div>

              <div class="mt-8">
                <div class="flow-root">
                  <ul v-if="cartStore.items.length > 0" role="list" class="-my-6 divide-y divide-gray-200">
                    <li v-for="item in cartStore.items" :key="item.id" class="py-6 flex">
                      <div class="flex-shrink-0 w-24 h-24 border border-gray-200 rounded-md overflow-hidden">
                        <img :src="item.thumbnail" :alt="item.title" class="w-full h-full object-center object-cover">
                      </div>

                      <div class="ml-4 flex-1 flex flex-col">
                        <div>
                          <div class="flex justify-between text-base font-medium text-gray-900">
                            <h3>{{ item.title }}</h3>
                            <p class="ml-4 price">${{ item.price.toFixed(2) }}</p>
                          </div>
                          <p class="mt-1 text-sm text-gray-500">{{ item.brand }}</p>
                        </div>
                        <div class="flex-1 flex items-end justify-between text-sm">
                          <div class="flex items-center">
                            <button @click="decrementQuantity(item)" class="text-gray-500 hover:text-primary px-2">
                              <i class="fas fa-minus"></i>
                            </button>
                            <span class="text-gray-700 mx-2">{{ item.quantity }}</span>
                            <button @click="incrementQuantity(item)" class="text-gray-500 hover:text-primary px-2">
                              <i class="fas fa-plus"></i>
                            </button>
                          </div>

                          <div class="flex">
                            <button @click="removeFromCart(item)" type="button" class="font-medium text-primary hover:text-primary-dark">
                              <i class="fas fa-trash-alt mr-1"></i> 
                              <span>{{ $t('cart.remove') }}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </li>
                  </ul>
                  <div v-else class="text-center py-16">
                    <i class="fas fa-shopping-cart text-gray-300 text-5xl mb-4"></i>
                    <p class="text-gray-500">{{ $t('cart.empty') }}</p>
                  </div>
                </div>
              </div>
            </div>

            <div class="border-t border-gray-200 py-6 px-4 sm:px-6">
              <div class="flex justify-between text-base font-medium text-gray-900">
                <p>{{ $t('cart.subtotal') }}</p>
                <p class="price">${{ cartStore.subtotal.toFixed(2) }}</p>
              </div>
              <p class="mt-0.5 text-sm text-gray-500">{{ $t('cart.taxesNote') }}</p>
              <div class="mt-6">
                <router-link to="/checkout" @click="closeCart" class="flex justify-center items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-primary hover:bg-primary-dark">
                  <span>{{ $t('cart.checkout') }}</span>
                  <i class="fas fa-arrow-right ml-2"></i>
                </router-link>
              </div>
              <div class="mt-6 flex justify-center text-sm text-center text-gray-500">
                <p>
                  <span>{{ $t('cart.orContinueShopping') }}</span>
                  <button @click="closeCart" type="button" class="text-primary font-medium hover:text-primary-dark ml-1">
                    <span>{{ $t('cart.continueShopping') }}</span>
                    <span aria-hidden="true"> &rarr;</span>
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useCartStore } from '../../stores/cartStore'
import type { CartItem } from '../../stores/cartStore'

const cartStore = useCartStore()

const closeCart = () => {
  cartStore.isCartOpen = false
}

const incrementQuantity = (item: CartItem) => {
  cartStore.incrementQuantity(item.id)
}

const decrementQuantity = (item: CartItem) => {
  cartStore.decrementQuantity(item.id)
}

const removeFromCart = (item: CartItem) => {
  cartStore.removeFromCart(item.id)
}
</script>
