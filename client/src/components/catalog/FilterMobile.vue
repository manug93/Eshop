<template>
  <div v-if="isOpen" class="fixed inset-0 flex z-40 lg:hidden" id="mobile-filters-dialog">
    <div @click="close" class="fixed inset-0 bg-black bg-opacity-25"></div>
    <div class="relative ml-auto flex h-full w-full max-w-xs flex-col overflow-y-auto bg-white py-4 pb-12 shadow-xl">
      <div class="flex items-center justify-between px-4">
        <h2 class="text-lg font-medium text-gray-900">{{ $t('filters.title') }}</h2>
        <button @click="close" type="button" class="-mr-2 flex h-10 w-10 items-center justify-center rounded-md p-2 text-gray-400">
          <span class="sr-only">Close menu</span>
          <i class="fas fa-times text-lg"></i>
        </button>
      </div>

      <!-- Mobile filters content -->
      <div class="px-4 mt-4">
        <!-- Categories -->
        <div class="border-b border-gray-200 py-6">
          <h3 class="text-sm font-medium text-gray-900 mb-3">{{ $t('filters.categories') }}</h3>
          <div class="space-y-4">
            <div v-for="category in categories" :key="category" class="flex items-center">
              <Checkbox
                :id="`m-category-${category}`"
                v-model="selectedCategories"
                :value="category"
                class="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label :for="`m-category-${category}`" class="ml-3 text-sm text-gray-600">{{ category }}</label>
            </div>
          </div>
        </div>

        <!-- Price Range -->
        <div class="border-b border-gray-200 py-6">
          <h3 class="text-sm font-medium text-gray-900 mb-3">{{ $t('filters.priceRange') }}</h3>
          <div class="mt-4">
            <Slider v-model="priceRange" range :min="0" :max="2000" class="mb-6" />
            <div class="flex items-center justify-between">
              <div class="w-1/2 pr-2">
                <label for="m-min-price" class="sr-only">Min Price</label>
                <div class="relative rounded-md">
                  <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span class="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <InputText 
                    v-model.number="priceRange[0]" 
                    type="number" 
                    id="m-min-price" 
                    class="block w-full pl-7 pr-3 py-3 border border-gray-300 rounded-md shadow-sm text-gray-700 text-sm focus:outline-none focus:ring-primary focus:border-primary" 
                    placeholder="Min"
                  />
                </div>
              </div>
              <div class="w-1/2 pl-2">
                <label for="m-max-price" class="sr-only">Max Price</label>
                <div class="relative rounded-md">
                  <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span class="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <InputText 
                    v-model.number="priceRange[1]" 
                    type="number" 
                    id="m-max-price" 
                    class="block w-full pl-7 pr-3 py-3 border border-gray-300 rounded-md shadow-sm text-gray-700 text-sm focus:outline-none focus:ring-primary focus:border-primary" 
                    placeholder="Max"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Brand Filter -->
        <div class="border-b border-gray-200 py-6">
          <h3 class="text-sm font-medium text-gray-900 mb-3">{{ $t('filters.brands') }}</h3>
          <div class="space-y-4">
            <div v-for="brand in brands" :key="brand" class="flex items-center">
              <Checkbox
                :id="`m-brand-${brand}`"
                v-model="selectedBrands"
                :value="brand"
                class="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label :for="`m-brand-${brand}`" class="ml-3 text-sm text-gray-600">{{ brand }}</label>
            </div>
          </div>
        </div>

        <!-- Rating Filter -->
        <div class="border-b border-gray-200 py-6">
          <h3 class="text-sm font-medium text-gray-900 mb-3">{{ $t('filters.rating') }}</h3>
          <div class="space-y-4">
            <div class="flex items-center">
              <RadioButton v-model="minRating" :value="4" id="m-rating-4plus" name="m-rating" class="h-5 w-5 border-gray-300 text-primary focus:ring-primary" />
              <label for="m-rating-4plus" class="ml-3 text-sm text-gray-600 flex items-center">
                <span class="flex items-center">
                  <i class="fas fa-star text-yellow-400"></i>
                  <i class="fas fa-star text-yellow-400"></i>
                  <i class="fas fa-star text-yellow-400"></i>
                  <i class="fas fa-star text-yellow-400"></i>
                  <i class="far fa-star text-yellow-400"></i>
                </span>
                <span class="ml-1">& Up</span>
              </label>
            </div>
            <div class="flex items-center">
              <RadioButton v-model="minRating" :value="3" id="m-rating-3plus" name="m-rating" class="h-5 w-5 border-gray-300 text-primary focus:ring-primary" />
              <label for="m-rating-3plus" class="ml-3 text-sm text-gray-600 flex items-center">
                <span class="flex items-center">
                  <i class="fas fa-star text-yellow-400"></i>
                  <i class="fas fa-star text-yellow-400"></i>
                  <i class="fas fa-star text-yellow-400"></i>
                  <i class="far fa-star text-yellow-400"></i>
                  <i class="far fa-star text-yellow-400"></i>
                </span>
                <span class="ml-1">& Up</span>
              </label>
            </div>
            <div class="flex items-center">
              <RadioButton v-model="minRating" :value="2" id="m-rating-2plus" name="m-rating" class="h-5 w-5 border-gray-300 text-primary focus:ring-primary" />
              <label for="m-rating-2plus" class="ml-3 text-sm text-gray-600 flex items-center">
                <span class="flex items-center">
                  <i class="fas fa-star text-yellow-400"></i>
                  <i class="fas fa-star text-yellow-400"></i>
                  <i class="far fa-star text-yellow-400"></i>
                  <i class="far fa-star text-yellow-400"></i>
                  <i class="far fa-star text-yellow-400"></i>
                </span>
                <span class="ml-1">& Up</span>
              </label>
            </div>
          </div>
        </div>

        <!-- Apply Filters Button -->
        <div class="mt-6">
          <Button 
            @click="applyFilters" 
            class="w-full bg-primary hover:bg-primary-dark text-white rounded-md py-3 px-4 font-medium"
          >
            {{ $t('filters.apply') }}
          </Button>
          <Button 
            @click="clearFilters" 
            class="w-full text-gray-600 hover:text-gray-900 text-sm font-medium py-3 mt-3"
            severity="secondary"
            outlined
          >
            <i class="fas fa-redo mr-1"></i>
            {{ $t('filters.clear') }}
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  isOpen: boolean
  categories: string[]
  brands: string[]
  initialFilters: {
    categories: string[]
    brands: string[]
    priceRange: [number, number]
    minRating: number
  }
}>()

const emit = defineEmits(['close', 'apply-filters', 'clear-filters'])

// States
const selectedCategories = ref<string[]>([...props.initialFilters.categories])
const selectedBrands = ref<string[]>([...props.initialFilters.brands])
const priceRange = ref<[number, number]>([...props.initialFilters.priceRange])
const minRating = ref<number>(props.initialFilters.minRating)

// Watch for direct prop changes
watch(() => props.initialFilters, (newFilters) => {
  selectedCategories.value = [...newFilters.categories]
  selectedBrands.value = [...newFilters.brands]
  priceRange.value = [...newFilters.priceRange]
  minRating.value = newFilters.minRating
}, { deep: true })

// Methods
const close = () => {
  emit('close')
}

const applyFilters = () => {
  emit('apply-filters', {
    categories: selectedCategories.value,
    brands: selectedBrands.value,
    priceRange: priceRange.value,
    minRating: minRating.value
  })
  close()
}

const clearFilters = () => {
  selectedCategories.value = []
  selectedBrands.value = []
  priceRange.value = [0, 2000]
  minRating.value = 0
  emit('clear-filters')
  close()
}
</script>
