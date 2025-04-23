<template>
  <div class="bg-white rounded-lg shadow-sm overflow-hidden product-card group">
    <div class="relative aspect-w-1 aspect-h-1 bg-gray-200">
      <router-link :to="`/products/${product.id}`" class="absolute inset-0">
        <img 
          :src="product.thumbnail" 
          :alt="product.title" 
          class="object-cover object-center w-full h-full"
          loading="lazy">
      </router-link>
      <div class="absolute top-0 right-0 m-2">
        <button @click.prevent="$emit('toggle-wishlist', product)" class="bg-white rounded-full p-2 text-gray-400 hover:text-primary shadow-sm transition-colors" :class="{ 'text-primary': isInWishlist }">
          <i :class="isInWishlist ? 'fas fa-heart' : 'far fa-heart'"></i>
        </button>
      </div>
      <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <button @click.prevent="$emit('add-to-cart', product)" class="w-full bg-primary hover:bg-primary-dark text-white py-2 rounded-md text-sm font-medium transition-colors">
          <i class="fas fa-shopping-cart mr-2"></i>
          <span>{{ $t('product.addToCart') }}</span>
        </button>
      </div>
    </div>
    <div class="p-4">
      <div class="flex justify-between">
        <h3 class="text-sm text-gray-500">{{ product.brand }}</h3>
        <div class="flex items-center">
          <i class="fas fa-star text-yellow-400 text-xs"></i>
          <span class="text-xs text-gray-600 ml-1">{{ product.rating }}</span>
        </div>
      </div>
      <router-link :to="`/products/${product.id}`" class="mt-1 block">
        <h2 class="text-lg font-medium text-gray-900 truncate">{{ product.title }}</h2>
      </router-link>
      <div class="mt-2">
        <p class="text-xl font-semibold text-gray-900 price">${{ discountedPrice }}</p>
        <p v-if="product.discountPercentage > 0" class="text-sm text-gray-500 line-through">${{ product.price.toFixed(2) }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useUserStore } from '../../stores/userStore'
import type { Product } from '../../stores/productStore'

const props = defineProps<{
  product: Product
}>()

defineEmits(['add-to-cart', 'toggle-wishlist'])

const userStore = useUserStore()

const isInWishlist = computed(() => {
  return userStore.wishlist.includes(props.product.id)
})

const discountedPrice = computed(() => {
  if (props.product.discountPercentage) {
    const discountedValue = props.product.price * (1 - (props.product.discountPercentage / 100))
    return discountedValue.toFixed(2)
  }
  return props.product.price.toFixed(2)
})
</script>
