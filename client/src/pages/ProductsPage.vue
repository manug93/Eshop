<template>
  <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- Breadcrumb Navigation -->
    <BreadcrumbNav :paths="breadcrumbPaths" />

    <div class="lg:grid lg:grid-cols-4 lg:gap-x-8 xl:grid-cols-5">
      <!-- Desktop Filters Sidebar -->
      <div class="hidden lg:block lg:col-span-1">
        <FilterSidebar 
          :categories="productStore.categories"
          :brands="productStore.brands"
          :initial-filters="filters"
          @apply-filters="applyFilters"
          @clear-filters="clearFilters"
        />
      </div>

      <!-- Mobile Filters Dialog -->
      <FilterMobile 
        :is-open="mobileFiltersOpen"
        :categories="productStore.categories"
        :brands="productStore.brands"
        :initial-filters="filters"
        @close="mobileFiltersOpen = false"
        @apply-filters="applyFilters"
        @clear-filters="clearFilters"
      />

      <!-- Product Grid and Controls -->
      <div class="lg:col-span-3 xl:col-span-4">
        <!-- Controls -->
        <div class="flex items-center justify-between mb-6">
          <div class="flex items-center">
            <button 
              type="button" 
              class="lg:hidden text-gray-600 hover:text-gray-900 mr-4"
              @click="mobileFiltersOpen = true"
            >
              <i class="fas fa-sliders-h mr-2"></i>
              <span>{{ $t('products.filters') }}</span>
            </button>
            <span class="text-sm text-gray-700">
              {{ $t('products.showing', { count: paginatedProducts.length, total: filteredProducts.length }) }}
            </span>
          </div>
          <div class="flex items-center">
            <label for="sort-by" class="text-sm font-medium text-gray-700 mr-2 hidden sm:block">{{ $t('products.sortBy') }}</label>
            <select 
              v-model="sortBy" 
              id="sort-by" 
              class="text-sm border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
            >
              <option value="recommended">{{ $t('products.sort.recommended') }}</option>
              <option value="price-low-high">{{ $t('products.sort.priceLowHigh') }}</option>
              <option value="price-high-low">{{ $t('products.sort.priceHighLow') }}</option>
              <option value="rating">{{ $t('products.sort.rating') }}</option>
              <option value="newest">{{ $t('products.sort.newest') }}</option>
            </select>
          </div>
        </div>

        <!-- Active Filters -->
        <ActiveFilters 
          :filters="filters"
          :default-price-range="defaultPriceRange"
          @update-filters="updateFilters"
          @clear-filters="clearFilters"
        />

        <!-- Product Grid -->
        <ProductGrid 
          :products="paginatedProducts" 
          :is-loading="loading"
          @update-wishlist="handleWishlistUpdate"
        />

        <!-- Pagination -->
        <Pagination 
          v-if="filteredProducts.length > pageSize"
          :current-page="currentPage"
          :total-pages="totalPages"
          @page-change="handlePageChange"
        />
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProductStore } from '../stores/productStore'
import { useUserStore } from '../stores/userStore'
import BreadcrumbNav from '../components/shared/BreadcrumbNav.vue'
import FilterSidebar from '../components/catalog/FilterSidebar.vue'
import FilterMobile from '../components/catalog/FilterMobile.vue'
import ActiveFilters from '../components/catalog/ActiveFilters.vue'
import ProductGrid from '../components/catalog/ProductGrid.vue'
import Pagination from '../components/catalog/Pagination.vue'
import type { Product } from '../stores/productStore'

const route = useRoute()
const router = useRouter()
const productStore = useProductStore()
const userStore = useUserStore()

// States
const loading = ref(true)
const mobileFiltersOpen = ref(false)
const currentPage = ref(1)
const pageSize = ref(12)
const defaultPriceRange = [0, 2000] as [number, number]

// Filter states
const filters = ref({
  categories: [] as string[],
  brands: [] as string[],
  priceRange: [...defaultPriceRange] as [number, number],
  minRating: 0
})

const sortBy = ref('recommended')

// Breadcrumbs
const breadcrumbPaths = computed(() => {
  const paths = [
    { name: 'Home', url: '/' },
    { name: 'Products', url: '/products' }
  ]
  
  // Add category if selected
  if (filters.value.categories.length === 1) {
    paths.push({
      name: filters.value.categories[0],
      url: `/products?category=${filters.value.categories[0]}`
    })
  }
  
  return paths
})

// Computed properties
const filteredProducts = computed(() => {
  let result = [...productStore.products]
  
  // Apply category filter
  if (filters.value.categories.length > 0) {
    result = result.filter(product => 
      filters.value.categories.includes(product.category)
    )
  }
  
  // Apply brand filter
  if (filters.value.brands.length > 0) {
    result = result.filter(product => 
      filters.value.brands.includes(product.brand)
    )
  }
  
  // Apply price filter
  result = result.filter(product => {
    const price = product.discountPercentage > 0 
      ? product.price * (1 - product.discountPercentage / 100)
      : product.price
    
    return price >= filters.value.priceRange[0] && price <= filters.value.priceRange[1]
  })
  
  // Apply rating filter
  if (filters.value.minRating > 0) {
    result = result.filter(product => product.rating >= filters.value.minRating)
  }
  
  // Apply sorting
  switch (sortBy.value) {
    case 'price-low-high':
      result.sort((a, b) => a.price - b.price)
      break
    case 'price-high-low':
      result.sort((a, b) => b.price - a.price)
      break
    case 'rating':
      result.sort((a, b) => b.rating - a.rating)
      break
    case 'newest':
      // For simplicity, we'll use the ID as a proxy for "newest"
      result.sort((a, b) => b.id - a.id)
      break
    default:
      // Recommended - we'll use a combination of rating and popularity
      result.sort((a, b) => b.rating - a.rating)
  }
  
  return result
})

// Pagination
const totalPages = computed(() => {
  return Math.ceil(filteredProducts.value.length / pageSize.value)
})

const paginatedProducts = computed(() => {
  const startIdx = (currentPage.value - 1) * pageSize.value
  const endIdx = startIdx + pageSize.value
  return filteredProducts.value.slice(startIdx, endIdx)
})

// Methods
const applyFilters = (newFilters: any) => {
  filters.value = { ...newFilters }
  
  // Reset to page 1 when filters change
  currentPage.value = 1
  
  // Update URL params
  updateUrlParams()
}

const updateFilters = (newFilters: any) => {
  filters.value = { ...newFilters }
  
  // Reset to page 1 when filters change
  currentPage.value = 1
  
  // Update URL params
  updateUrlParams()
}

const clearFilters = () => {
  filters.value = {
    categories: [],
    brands: [],
    priceRange: [...defaultPriceRange],
    minRating: 0
  }
  
  // Reset to page 1 when filters change
  currentPage.value = 1
  
  // Update URL params
  updateUrlParams()
}

const handlePageChange = (page: number) => {
  currentPage.value = page
  
  // Scroll to top on page change
  window.scrollTo({ top: 0, behavior: 'smooth' })
  
  // Update URL params
  updateUrlParams()
}

const handleWishlistUpdate = (productId: number) => {
  userStore.toggleWishlist(productId)
}

const updateUrlParams = () => {
  const query: Record<string, string> = {}
  
  // Add filter params
  if (filters.value.categories.length === 1) {
    query.category = filters.value.categories[0]
  }
  
  if (filters.value.brands.length > 0) {
    query.brands = filters.value.brands.join(',')
  }
  
  if (filters.value.priceRange[0] !== defaultPriceRange[0] || 
      filters.value.priceRange[1] !== defaultPriceRange[1]) {
    query.minPrice = filters.value.priceRange[0].toString()
    query.maxPrice = filters.value.priceRange[1].toString()
  }
  
  if (filters.value.minRating > 0) {
    query.rating = filters.value.minRating.toString()
  }
  
  // Add sorting and pagination
  if (sortBy.value !== 'recommended') {
    query.sort = sortBy.value
  }
  
  if (currentPage.value > 1) {
    query.page = currentPage.value.toString()
  }
  
  // Update URL without reloading page
  router.replace({ query })
}

// Parse URL parameters
const parseUrlParams = () => {
  const query = route.query
  
  // Reset filters
  const newFilters = {
    categories: [] as string[],
    brands: [] as string[],
    priceRange: [...defaultPriceRange] as [number, number],
    minRating: 0
  }
  
  // Parse category
  if (query.category && typeof query.category === 'string') {
    newFilters.categories = [query.category]
  }
  
  // Parse brands
  if (query.brands && typeof query.brands === 'string') {
    newFilters.brands = query.brands.split(',')
  }
  
  // Parse price range
  if (query.minPrice && typeof query.minPrice === 'string') {
    newFilters.priceRange[0] = parseInt(query.minPrice, 10)
  }
  
  if (query.maxPrice && typeof query.maxPrice === 'string') {
    newFilters.priceRange[1] = parseInt(query.maxPrice, 10)
  }
  
  // Parse rating
  if (query.rating && typeof query.rating === 'string') {
    newFilters.minRating = parseInt(query.rating, 10)
  }
  
  // Update filters
  filters.value = newFilters
  
  // Parse sorting
  if (query.sort && typeof query.sort === 'string') {
    sortBy.value = query.sort
  }
  
  // Parse page
  if (query.page && typeof query.page === 'string') {
    currentPage.value = parseInt(query.page, 10)
  }
}

// Watch for route changes
watch(() => route.query, () => {
  parseUrlParams()
}, { deep: true })

// Watch for sort changes
watch(sortBy, () => {
  updateUrlParams()
})

// Initialize page
onMounted(async () => {
  try {
    // Load products if not already loaded
    if (productStore.products.length === 0) {
      await productStore.fetchProducts()
    }
    
    // Parse URL parameters
    parseUrlParams()
  } finally {
    loading.value = false
  }
})
</script>
