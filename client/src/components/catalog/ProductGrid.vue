<template>
  <div v-if="isLoading" class="py-20 flex justify-center items-center">
    <ProgressSpinner style="width:50px;height:50px" strokeWidth="4" fill="var(--surface-ground)" animationDuration=".5s" />
  </div>
  <div v-else-if="products.length === 0" class="py-20 text-center">
    <i class="fas fa-box-open text-6xl text-gray-300 mb-4"></i>
    <h3 class="text-xl font-medium text-gray-600">{{ $t('products.noProductsFound') }}</h3>
    <p class="text-gray-500 mt-2">{{ $t('products.tryDifferentFilters') }}</p>
  </div>
  <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
    <ProductCard 
      v-for="product in products" 
      :key="product.id" 
      :product="product"
      @add-to-cart="addToCart"
      @toggle-wishlist="toggleWishlist"
    />
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from 'vue'
import { useCartStore } from '../../stores/cartStore'
import { useUserStore } from '../../stores/userStore'
import ProductCard from './ProductCard.vue'
import type { Product } from '../../stores/productStore'

const props = defineProps<{
  products: Product[]
  isLoading: boolean
}>()

const emit = defineEmits(['update-wishlist'])
const cartStore = useCartStore()
const userStore = useUserStore()

const addToCart = (product: Product) => {
  cartStore.addToCart({
    id: product.id,
    title: product.title,
    price: product.price,
    thumbnail: product.thumbnail,
    brand: product.brand,
    quantity: 1
  })
}

const toggleWishlist = (product: Product) => {
  userStore.toggleWishlist(product.id)
  emit('update-wishlist', product.id)
}
</script>
