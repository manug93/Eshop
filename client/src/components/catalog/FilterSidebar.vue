<template>
  <div class="bg-white rounded-lg shadow-sm p-6 custom-scrollbar" style="max-height: calc(100vh - 150px); overflow-y: auto;">
    <h3 class="text-lg font-semibold text-gray-900 mb-4">{{ $t('filters.title') }}</h3>

    <!-- Categories -->
    <div class="border-b border-gray-200 pb-6 mb-6">
      <h3 class="text-sm font-medium text-gray-900 mb-3">{{ $t('filters.categories') }}</h3>
      <div class="space-y-2">
        <div v-for="category in categories" :key="category" class="flex items-center">
          <Checkbox
            :id="`category-${category}`"
            v-model="selectedCategories"
            :value="category"
            class="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
          />
          <label :for="`category-${category}`" class="ml-3 text-sm text-gray-600">{{ category }}</label>
        </div>
      </div>
      <button 
        v-if="!showAllCategories && categories.length > 5" 
        @click="showAllCategories = true" 
        class="text-primary text-sm font-medium mt-2 hover:underline"
      >
        {{ $t('filters.seeMore') }}
      </button>
      <button 
        v-else-if="showAllCategories" 
        @click="showAllCategories = false" 
        class="text-primary text-sm font-medium mt-2 hover:underline"
      >
        {{ $t('filters.seeLess') }}
      </button>
    </div>

    <!-- Price Range -->
    <div class="border-b border-gray-200 pb-6 mb-6">
      <h3 class="text-sm font-medium text-gray-900 mb-3">{{ $t('filters.priceRange') }}</h3>
      <div class="mt-4">
        <Slider v-model="priceRange" range :min="0" :max="2000" class="mb-6" />
        <div class="flex items-center justify-between">
          <div class="w-1/2 pr-2">
            <label for="min-price" class="sr-only">Min Price</label>
            <div class="relative rounded-md">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span class="text-gray-500 sm:text-sm">$</span>
              </div>
              <InputText 
                v-model.number="priceRange[0]" 
                type="number" 
                id="min-price" 
                class="block w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-700 text-sm focus:outline-none focus:ring-primary focus:border-primary" 
                placeholder="Min" 
              />
            </div>
          </div>
          <div class="w-1/2 pl-2">
            <label for="max-price" class="sr-only">Max Price</label>
            <div class="relative rounded-md">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span class="text-gray-500 sm:text-sm">$</span>
              </div>
              <InputText 
                v-model.number="priceRange[1]" 
                type="number" 
                id="max-price" 
                class="block w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-700 text-sm focus:outline-none focus:ring-primary focus:border-primary" 
                placeholder="Max" 
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Brand Filter -->
    <div class="border-b border-gray-200 pb-6 mb-6">
      <h3 class="text-sm font-medium text-gray-900 mb-3">{{ $t('filters.brands') }}</h3>
      <div class="space-y-2">
        <div v-for="brand in displayedBrands" :key="brand" class="flex items-center">
          <Checkbox
            :id="`brand-${brand}`"
            v-model="selectedBrands"
            :value="brand"
            class="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
          />
          <label :for="`brand-${brand}`" class="ml-3 text-sm text-gray-600">{{ brand }}</label>
        </div>
      </div>
      <button 
        v-if="!showAllBrands && brands.length > 4" 
        @click="showAllBrands = true" 
        class="text-primary text-sm font-medium mt-2 hover:underline"
      >
        {{ $t('filters.seeMore') }}
      </button>
      <button 
        v-else-if="showAllBrands" 
        @click="showAllBrands = false" 
        class="text-primary text-sm font-medium mt-2 hover:underline"
      >
        {{ $t('filters.seeLess') }}
      </button>
    </div>

    <!-- Rating Filter -->
    <div class="pb-6 mb-6">
      <h3 class="text-sm font-medium text-gray-900 mb-3">{{ $t('filters.rating') }}</h3>
      <div class="space-y-2">
        <div class="flex items-center">
          <RadioButton v-model="minRating" :value="4" id="rating-4plus" name="rating" class="h-4 w-4 border-gray-300 text-primary focus:ring-primary" />
          <label for="rating-4plus" class="ml-3 text-sm text-gray-600 flex items-center">
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
          <RadioButton v-model="minRating" :value="3" id="rating-3plus" name="rating" class="h-4 w-4 border-gray-300 text-primary focus:ring-primary" />
          <label for="rating-3plus" class="ml-3 text-sm text-gray-600 flex items-center">
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
          <RadioButton v-model="minRating" :value="2" id="rating-2plus" name="rating" class="h-4 w-4 border-gray-300 text-primary focus:ring-primary" />
          <label for="rating-2plus" class="ml-3 text-sm text-gray-600 flex items-center">
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

    <Button 
      @click="applyFilters" 
      class="w-full bg-primary hover:bg-primary-dark text-white rounded-md py-2 px-4 font-medium"
    >
      {{ $t('filters.apply') }}
    </Button>
    <Button 
      @click="clearFilters" 
      class="w-full text-gray-600 hover:text-gray-900 text-sm font-medium py-2 mt-2"
      severity="secondary"
      outlined
    >
      <i class="fas fa-redo mr-1"></i>
      {{ $t('filters.clear') }}
    </Button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  categories: string[]
  brands: string[]
  initialFilters: {
    categories: string[]
    brands: string[]
    priceRange: [number, number]
    minRating: number
  }
}>()

const emit = defineEmits(['apply-filters', 'clear-filters'])
const { t } = useI18n()

// States
const selectedCategories = ref<string[]>([...props.initialFilters.categories])
const selectedBrands = ref<string[]>([...props.initialFilters.brands])
const priceRange = ref<[number, number]>([...props.initialFilters.priceRange])
const minRating = ref<number>(props.initialFilters.minRating)
const showAllCategories = ref(false)
const showAllBrands = ref(false)

// Computed properties for displaying limited items
const displayedCategories = computed(() => {
  return showAllCategories.value 
    ? props.categories 
    : props.categories.slice(0, 5)
})

const displayedBrands = computed(() => {
  return showAllBrands.value 
    ? props.brands 
    : props.brands.slice(0, 4)
})

// Watch for direct prop changes
watch(() => props.initialFilters, (newFilters) => {
  selectedCategories.value = [...newFilters.categories]
  selectedBrands.value = [...newFilters.brands]
  priceRange.value = [...newFilters.priceRange]
  minRating.value = newFilters.minRating
}, { deep: true })

// Methods
const applyFilters = () => {
  emit('apply-filters', {
    categories: selectedCategories.value,
    brands: selectedBrands.value,
    priceRange: priceRange.value,
    minRating: minRating.value
  })
}

const clearFilters = () => {
  selectedCategories.value = []
  selectedBrands.value = []
  priceRange.value = [0, 2000]
  minRating.value = 0
  emit('clear-filters')
}
</script>
