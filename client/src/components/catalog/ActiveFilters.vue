<template>
  <div v-if="hasActiveFilters" class="mb-6">
    <div class="flex flex-wrap gap-2">
      <span 
        v-for="(category, index) in filters.categories" 
        :key="`cat-${index}`" 
        class="inline-flex items-center py-1 pl-3 pr-2 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
      >
        <span>{{ category }}</span>
        <button @click="removeCategory(category)" type="button" class="ml-1 inline-flex flex-shrink-0 h-4 w-4 items-center justify-center rounded-full text-blue-600 hover:bg-blue-200 hover:text-blue-500 focus:outline-none">
          <span class="sr-only">Remove filter for {{ category }}</span>
          <i class="fas fa-times text-xs"></i>
        </button>
      </span>

      <span 
        v-for="(brand, index) in filters.brands" 
        :key="`brand-${index}`" 
        class="inline-flex items-center py-1 pl-3 pr-2 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
      >
        <span>{{ brand }}</span>
        <button @click="removeBrand(brand)" type="button" class="ml-1 inline-flex flex-shrink-0 h-4 w-4 items-center justify-center rounded-full text-blue-600 hover:bg-blue-200 hover:text-blue-500 focus:outline-none">
          <span class="sr-only">Remove filter for {{ brand }}</span>
          <i class="fas fa-times text-xs"></i>
        </button>
      </span>

      <span 
        v-if="isPriceRangeActive" 
        class="inline-flex items-center py-1 pl-3 pr-2 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
      >
        <span>${{ filters.priceRange[0] }} - ${{ filters.priceRange[1] }}</span>
        <button @click="resetPriceRange" type="button" class="ml-1 inline-flex flex-shrink-0 h-4 w-4 items-center justify-center rounded-full text-blue-600 hover:bg-blue-200 hover:text-blue-500 focus:outline-none">
          <span class="sr-only">Remove price filter</span>
          <i class="fas fa-times text-xs"></i>
        </button>
      </span>

      <span 
        v-if="filters.minRating > 0" 
        class="inline-flex items-center py-1 pl-3 pr-2 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
      >
        <span>{{ filters.minRating }}+ ⭐</span>
        <button @click="resetRating" type="button" class="ml-1 inline-flex flex-shrink-0 h-4 w-4 items-center justify-center rounded-full text-blue-600 hover:bg-blue-200 hover:text-blue-500 focus:outline-none">
          <span class="sr-only">Remove rating filter</span>
          <i class="fas fa-times text-xs"></i>
        </button>
      </span>

      <button 
        v-if="hasActiveFilters" 
        @click="clearAll" 
        class="text-sm text-primary hover:text-primary-dark hover:underline font-medium ml-2"
      >
        {{ $t('filters.clearAll') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  filters: {
    categories: string[]
    brands: string[]
    priceRange: [number, number]
    minRating: number
  }
  defaultPriceRange: [number, number]
}>()

const emit = defineEmits(['update-filters', 'clear-filters'])
const { t } = useI18n()

const hasActiveFilters = computed(() => {
  return props.filters.categories.length > 0 ||
    props.filters.brands.length > 0 ||
    isPriceRangeActive.value ||
    props.filters.minRating > 0
})

const isPriceRangeActive = computed(() => {
  return props.filters.priceRange[0] !== props.defaultPriceRange[0] ||
    props.filters.priceRange[1] !== props.defaultPriceRange[1]
})

const removeCategory = (category: string) => {
  const updatedFilters = {
    ...props.filters,
    categories: props.filters.categories.filter(cat => cat !== category)
  }
  emit('update-filters', updatedFilters)
}

const removeBrand = (brand: string) => {
  const updatedFilters = {
    ...props.filters,
    brands: props.filters.brands.filter(b => b !== brand)
  }
  emit('update-filters', updatedFilters)
}

const resetPriceRange = () => {
  const updatedFilters = {
    ...props.filters,
    priceRange: [...props.defaultPriceRange]
  }
  emit('update-filters', updatedFilters)
}

const resetRating = () => {
  const updatedFilters = {
    ...props.filters,
    minRating: 0
  }
  emit('update-filters', updatedFilters)
}

const clearAll = () => {
  emit('clear-filters')
}
</script>
