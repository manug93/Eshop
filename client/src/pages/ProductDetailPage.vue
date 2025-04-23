<template>
  <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- Breadcrumb Navigation -->
    <BreadcrumbNav :paths="breadcrumbPaths" />

    <div v-if="loading" class="flex justify-center py-16">
      <ProgressSpinner style="width:60px;height:60px" strokeWidth="4" fill="var(--surface-ground)" animationDuration=".5s" />
    </div>
    
    <div v-else-if="!product" class="text-center py-16">
      <i class="fas fa-exclamation-circle text-red-500 text-5xl mb-4"></i>
      <h2 class="text-2xl font-bold text-gray-900 mb-2">{{ $t('product.notFound.title') }}</h2>
      <p class="text-gray-600 mb-6">{{ $t('product.notFound.message') }}</p>
      <router-link to="/products" class="inline-block bg-primary hover:bg-primary-dark text-white font-medium py-2 px-6 rounded-md transition-colors">
        {{ $t('product.notFound.backToProducts') }}
      </router-link>
    </div>
    
    <div v-else>
      <div class="lg:grid lg:grid-cols-2 lg:gap-x-8 xl:gap-x-16">
        <!-- Product Images -->
        <div class="mb-8 lg:mb-0">
          <div class="aspect-w-1 aspect-h-1 bg-gray-100 rounded-lg overflow-hidden mb-4">
            <img 
              :src="selectedImage || product.thumbnail" 
              :alt="product.title" 
              class="object-cover object-center w-full h-full"
            />
          </div>
          
          <!-- Image thumbnails -->
          <div v-if="product.images && product.images.length > 1" class="grid grid-cols-5 gap-2">
            <div 
              v-for="(image, index) in product.images" 
              :key="index" 
              class="aspect-w-1 aspect-h-1 bg-gray-100 rounded-md cursor-pointer overflow-hidden border-2"
              :class="selectedImage === image ? 'border-primary' : 'border-transparent'"
              @click="selectedImage = image"
            >
              <img :src="image" :alt="`${product.title} image ${index + 1}`" class="object-cover object-center">
            </div>
          </div>
        </div>
        
        <!-- Product Details -->
        <div>
          <div class="mb-6">
            <div class="mb-2 flex items-center">
              <span class="text-sm text-gray-500 mr-4">{{ product.brand }}</span>
              <div class="flex items-center">
                <div class="flex items-center">
                  <i class="fas fa-star text-yellow-400 text-xs"></i>
                  <span class="ml-1 text-sm text-gray-600">{{ product.rating }}</span>
                </div>
              </div>
            </div>
            
            <h1 class="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{{ product.title }}</h1>
            
            <div class="flex items-center mt-4">
              <span 
                v-if="product.discountPercentage > 0" 
                class="text-2xl font-bold text-gray-900 mr-2"
              >
                ${{ discountedPrice }}
              </span>
              <span 
                :class="{'text-2xl font-bold text-gray-900': product.discountPercentage === 0, 'text-sm text-gray-500 line-through': product.discountPercentage > 0}"
              >
                ${{ product.price.toFixed(2) }}
              </span>
              <span 
                v-if="product.discountPercentage > 0" 
                class="ml-2 bg-green-100 text-green-800 text-xs font-medium px-2 py-0.5 rounded"
              >
                {{ product.discountPercentage }}% {{ $t('product.off') }}
              </span>
            </div>
          </div>
          
          <div class="border-t border-b border-gray-200 py-4 mb-6">
            <div class="text-sm text-gray-700 leading-relaxed">
              <p>{{ product.description }}</p>
            </div>
          </div>
          
          <!-- Product specifications -->
          <div class="mb-6">
            <h3 class="text-sm font-medium text-gray-900 mb-3">{{ $t('product.specifications') }}</h3>
            <div class="grid grid-cols-2 gap-4 text-sm">
              <div class="flex items-center justify-between">
                <span class="text-gray-500">{{ $t('product.category') }}</span>
                <span class="font-medium">{{ product.category }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-gray-500">{{ $t('product.brand') }}</span>
                <span class="font-medium">{{ product.brand }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-gray-500">{{ $t('product.stock') }}</span>
                <span 
                  :class="{'text-green-600': product.stock > 10, 'text-yellow-600': product.stock <= 10 && product.stock > 0, 'text-red-600': product.stock === 0}"
                  class="font-medium"
                >
                  {{ product.stock > 0 ? product.stock : $t('product.outOfStock') }}
                </span>
              </div>
            </div>
          </div>
          
          <!-- Quantity selector -->
          <div class="mb-6" v-if="product.stock > 0">
            <label for="quantity" class="text-sm font-medium text-gray-900 block mb-2">{{ $t('product.quantity') }}</label>
            <div class="flex items-center">
              <button 
                @click="decrementQuantity" 
                :disabled="quantity <= 1"
                class="text-gray-500 hover:text-primary px-3 py-1 border border-gray-300 rounded-l-md"
                :class="{'opacity-50 cursor-not-allowed': quantity <= 1}"
              >
                <i class="fas fa-minus"></i>
              </button>
              <input 
                v-model="quantity" 
                type="number" 
                min="1" 
                :max="product.stock" 
                class="w-16 text-center py-1 border-t border-b border-gray-300 focus:outline-none focus:ring-0 focus:border-gray-300"
              >
              <button 
                @click="incrementQuantity" 
                :disabled="quantity >= product.stock"
                class="text-gray-500 hover:text-primary px-3 py-1 border border-gray-300 rounded-r-md"
                :class="{'opacity-50 cursor-not-allowed': quantity >= product.stock}"
              >
                <i class="fas fa-plus"></i>
              </button>
            </div>
          </div>
          
          <!-- Action buttons -->
          <div class="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
            <Button 
              v-if="product.stock > 0"
              @click="addToCart" 
              class="flex-1 bg-primary hover:bg-primary-dark text-white font-medium py-3 px-6 rounded-md"
            >
              <i class="fas fa-shopping-cart mr-2"></i>
              {{ $t('product.addToCart') }}
            </Button>
            <Button 
              v-else
              disabled
              class="flex-1 bg-gray-300 text-gray-500 font-medium py-3 px-6 rounded-md cursor-not-allowed"
            >
              {{ $t('product.outOfStock') }}
            </Button>
            
            <Button 
              @click="toggleWishlist" 
              outlined
              class="flex-1 sm:flex-none border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium py-3 px-6 rounded-md"
              :class="{'bg-red-50 border-red-200 text-red-600': isInWishlist}"
            >
              <i :class="isInWishlist ? 'fas fa-heart' : 'far fa-heart'" class="mr-2"></i>
              {{ isInWishlist ? $t('product.removeFromWishlist') : $t('product.addToWishlist') }}
            </Button>
          </div>
        </div>
      </div>
      
      <!-- Related Products Section -->
      <section class="mt-16">
        <h2 class="text-2xl font-bold text-gray-900 mb-6">{{ $t('product.relatedProducts') }}</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <ProductCard 
            v-for="relatedProduct in relatedProducts" 
            :key="relatedProduct.id" 
            :product="relatedProduct"
            @add-to-cart="addRelatedToCart"
            @toggle-wishlist="toggleRelatedWishlist"
          />
        </div>
      </section>
    </div>
  </main>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useI18n } from 'vue-i18n'
import { useProductStore } from '../stores/productStore'
import { useCartStore } from '../stores/cartStore'
import { useUserStore } from '../stores/userStore'
import BreadcrumbNav from '../components/shared/BreadcrumbNav.vue'
import ProductCard from '../components/catalog/ProductCard.vue'
import type { Product } from '../stores/productStore'

const route = useRoute()
const toast = useToast()
const { t } = useI18n()
const productStore = useProductStore()
const cartStore = useCartStore()
const userStore = useUserStore()

// State
const loading = ref(true)
const productId = computed(() => parseInt(route.params.id as string, 10))
const product = ref<Product | null>(null)
const quantity = ref(1)
const selectedImage = ref('')

// Computed properties
const breadcrumbPaths = computed(() => {
  const paths = [
    { name: 'Home', url: '/' },
    { name: 'Products', url: '/products' }
  ]
  
  if (product.value) {
    paths.push({
      name: product.value.category,
      url: `/products?category=${product.value.category}`
    })
    
    paths.push({
      name: product.value.title,
      url: `/products/${product.value.id}`
    })
  }
  
  return paths
})

const discountedPrice = computed(() => {
  if (!product.value) return '0.00'
  
  if (product.value.discountPercentage > 0) {
    const discountedValue = product.value.price * (1 - product.value.discountPercentage / 100)
    return discountedValue.toFixed(2)
  }
  
  return product.value.price.toFixed(2)
})

const isInWishlist = computed(() => {
  if (!product.value) return false
  return userStore.wishlist.includes(product.value.id)
})

const relatedProducts = computed(() => {
  if (!product.value) return []
  
  return productStore.products
    .filter(p => p.category === product.value?.category && p.id !== product.value?.id)
    .slice(0, 4)
})

// Methods
const fetchProduct = async () => {
  try {
    loading.value = true
    
    // First try to find the product in the store
    let foundProduct = productStore.products.find(p => p.id === productId.value)
    
    // If not found in store, fetch it directly
    if (!foundProduct) {
      foundProduct = await productStore.fetchProductById(productId.value)
    }
    
    if (foundProduct) {
      product.value = foundProduct
      
      // Set first image as selected
      if (foundProduct.images && foundProduct.images.length > 0) {
        selectedImage.value = foundProduct.images[0]
      }
    } else {
      product.value = null
    }
  } catch (error) {
    console.error('Error fetching product:', error)
    product.value = null
  } finally {
    loading.value = false
  }
}

const incrementQuantity = () => {
  if (product.value && quantity.value < product.value.stock) {
    quantity.value++
  }
}

const decrementQuantity = () => {
  if (quantity.value > 1) {
    quantity.value--
  }
}

const addToCart = () => {
  if (!product.value) return
  
  cartStore.addToCart({
    id: product.value.id,
    title: product.value.title,
    price: product.value.discountPercentage > 0 
      ? parseFloat(discountedPrice.value) 
      : product.value.price,
    thumbnail: product.value.thumbnail,
    brand: product.value.brand,
    quantity: quantity.value
  })
  
  toast.add({
    severity: 'success',
    summary: t('toast.success'),
    detail: t('toast.productAdded', { title: product.value.title }),
    life: 3000
  })
}

const toggleWishlist = () => {
  if (!product.value) return
  
  userStore.toggleWishlist(product.value.id)
  
  if (isInWishlist.value) {
    toast.add({
      severity: 'info',
      summary: t('toast.info'),
      detail: t('toast.removedFromWishlist'),
      life: 3000
    })
  } else {
    toast.add({
      severity: 'success',
      summary: t('toast.success'),
      detail: t('toast.addedToWishlist'),
      life: 3000
    })
  }
}

const addRelatedToCart = (product: Product) => {
  cartStore.addToCart({
    id: product.id,
    title: product.title,
    price: product.price,
    thumbnail: product.thumbnail,
    brand: product.brand,
    quantity: 1
  })
  
  toast.add({
    severity: 'success',
    summary: t('toast.success'),
    detail: t('toast.productAdded', { title: product.title }),
    life: 3000
  })
}

const toggleRelatedWishlist = (product: Product) => {
  userStore.toggleWishlist(product.id)
}

// Watch for route changes to update product
watch(() => route.params.id, () => {
  fetchProduct()
})

// Initialize page
onMounted(() => {
  fetchProduct()
})
</script>
