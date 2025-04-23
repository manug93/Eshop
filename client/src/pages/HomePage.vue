<template>
  <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- Hero Section -->
    <div class="bg-primary/10 rounded-lg p-8 mb-12">
      <div class="max-w-3xl">
        <h1 class="text-4xl font-bold text-gray-900 mb-4">{{ $t('home.hero.title') }}</h1>
        <p class="text-xl text-gray-600 mb-6">{{ $t('home.hero.subtitle') }}</p>
        <div class="flex flex-wrap gap-4">
          <router-link to="/products" class="bg-primary hover:bg-primary-dark text-white font-medium py-2 px-6 rounded-md transition-colors">
            {{ $t('home.hero.shopNow') }}
          </router-link>
          <router-link to="/products/deals" class="bg-white border border-primary text-primary hover:bg-primary/5 font-medium py-2 px-6 rounded-md transition-colors">
            {{ $t('home.hero.viewDeals') }}
          </router-link>
        </div>
      </div>
    </div>

    <!-- Categories Section -->
    <section class="mb-16">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-2xl font-bold text-gray-900">{{ $t('home.categories.title') }}</h2>
        <router-link to="/products" class="text-primary hover:underline text-sm font-medium">
          {{ $t('home.categories.viewAll') }} →
        </router-link>
      </div>
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div v-for="(category, index) in categories" :key="index" class="relative">
          <router-link :to="`/products?category=${category}`" class="block group">
            <div class="aspect-square bg-gray-100 rounded-lg overflow-hidden">
              <div class="w-full h-full flex items-center justify-center p-4 transition-transform group-hover:scale-110">
                <i :class="`fas ${getCategoryIcon(category)} text-4xl text-primary`"></i>
              </div>
            </div>
            <h3 class="mt-2 text-center text-sm font-medium text-gray-900">{{ category }}</h3>
          </router-link>
        </div>
      </div>
    </section>

    <!-- Featured Products Section -->
    <section class="mb-16">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-2xl font-bold text-gray-900">{{ $t('home.featuredProducts.title') }}</h2>
        <router-link to="/products" class="text-primary hover:underline text-sm font-medium">
          {{ $t('home.featuredProducts.viewAll') }} →
        </router-link>
      </div>
      <div v-if="productsLoading" class="flex justify-center py-12">
        <ProgressSpinner style="width:50px;height:50px" strokeWidth="4" fill="var(--surface-ground)" animationDuration=".5s" />
      </div>
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <ProductCard 
          v-for="product in featuredProducts" 
          :key="product.id" 
          :product="product"
          @add-to-cart="addToCart"
          @toggle-wishlist="toggleWishlist"
        />
      </div>
    </section>

    <!-- Deals Section -->
    <section class="mb-16">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-2xl font-bold text-gray-900">{{ $t('home.deals.title') }}</h2>
        <router-link to="/products/deals" class="text-primary hover:underline text-sm font-medium">
          {{ $t('home.deals.viewAll') }} →
        </router-link>
      </div>
      <div v-if="productsLoading" class="flex justify-center py-12">
        <ProgressSpinner style="width:50px;height:50px" strokeWidth="4" fill="var(--surface-ground)" animationDuration=".5s" />
      </div>
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <ProductCard 
          v-for="product in discountedProducts" 
          :key="product.id" 
          :product="product"
          @add-to-cart="addToCart"
          @toggle-wishlist="toggleWishlist"
        />
      </div>
    </section>

    <!-- Features Section -->
    <section class="mb-16">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-100 text-center">
          <div class="w-12 h-12 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <i class="fas fa-shipping-fast text-primary text-xl"></i>
          </div>
          <h3 class="text-lg font-medium text-gray-900 mb-2">{{ $t('home.features.shipping.title') }}</h3>
          <p class="text-gray-600">{{ $t('home.features.shipping.description') }}</p>
        </div>

        <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-100 text-center">
          <div class="w-12 h-12 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <i class="fas fa-shield-alt text-primary text-xl"></i>
          </div>
          <h3 class="text-lg font-medium text-gray-900 mb-2">{{ $t('home.features.secure.title') }}</h3>
          <p class="text-gray-600">{{ $t('home.features.secure.description') }}</p>
        </div>

        <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-100 text-center">
          <div class="w-12 h-12 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <i class="fas fa-undo-alt text-primary text-xl"></i>
          </div>
          <h3 class="text-lg font-medium text-gray-900 mb-2">{{ $t('home.features.returns.title') }}</h3>
          <p class="text-gray-600">{{ $t('home.features.returns.description') }}</p>
        </div>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useProductStore } from '../stores/productStore'
import { useCartStore } from '../stores/cartStore'
import { useUserStore } from '../stores/userStore'
import ProductCard from '../components/catalog/ProductCard.vue'
import type { Product } from '../stores/productStore'

const productStore = useProductStore()
const cartStore = useCartStore()
const userStore = useUserStore()

const productsLoading = ref(true)

// Get categories
const categories = computed(() => productStore.categories.slice(0, 6))

// Get featured products (random selection)
const featuredProducts = computed(() => {
  const products = [...productStore.products]
  // Sort by rating to get "featured" products
  return products.sort((a, b) => b.rating - a.rating).slice(0, 4)
})

// Get discounted products
const discountedProducts = computed(() => {
  const products = [...productStore.products]
  // Sort by discount percentage
  return products
    .filter(p => p.discountPercentage > 0)
    .sort((a, b) => b.discountPercentage - a.discountPercentage)
    .slice(0, 4)
})

// Load products
onMounted(async () => {
  try {
    if (productStore.products.length === 0) {
      await productStore.fetchProducts()
    }
  } finally {
    productsLoading.value = false
  }
})

// Methods
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
}

// Get icon for category
const getCategoryIcon = (category: string): string => {
  const icons: { [key: string]: string } = {
    'smartphones': 'fa-mobile-alt',
    'laptops': 'fa-laptop',
    'fragrances': 'fa-spray-can',
    'skincare': 'fa-pump-soap',
    'groceries': 'fa-shopping-basket',
    'home-decoration': 'fa-home',
    'furniture': 'fa-couch',
    'tops': 'fa-tshirt',
    'womens-dresses': 'fa-female',
    'womens-shoes': 'fa-shoe-prints',
    'mens-shirts': 'fa-tshirt',
    'mens-shoes': 'fa-shoe-prints',
    'mens-watches': 'fa-clock',
    'womens-watches': 'fa-clock',
    'womens-bags': 'fa-shopping-bag',
    'womens-jewellery': 'fa-gem',
    'sunglasses': 'fa-glasses',
    'automotive': 'fa-car',
    'motorcycle': 'fa-motorcycle',
    'lighting': 'fa-lightbulb'
  }

  return icons[category.toLowerCase()] || 'fa-box'
}
</script>
