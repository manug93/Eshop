<template>
  <div class="mt-8 flex justify-center">
    <nav class="inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
      <a 
        @click.prevent="onPageChange(currentPage - 1)" 
        :class="{ 'cursor-not-allowed opacity-50': currentPage === 1 }"
        href="#" 
        class="inline-flex items-center rounded-l-md border border-gray-300 bg-white px-2 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50"
      >
        <span class="sr-only">Previous</span>
        <i class="fas fa-chevron-left text-xs"></i>
      </a>
      
      <template v-for="pageNum in displayedPages" :key="pageNum">
        <span 
          v-if="pageNum === '...'" 
          class="inline-flex items-center border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700"
        >
          ...
        </span>
        <a 
          v-else
          @click.prevent="onPageChange(pageNum)" 
          href="#" 
          class="inline-flex items-center border border-gray-300 px-4 py-2 text-sm font-medium" 
          :class="pageNum === currentPage ? 'bg-primary text-white' : 'bg-white text-gray-500 hover:bg-gray-50'"
        >
          {{ pageNum }}
        </a>
      </template>
      
      <a 
        @click.prevent="onPageChange(currentPage + 1)" 
        :class="{ 'cursor-not-allowed opacity-50': currentPage === totalPages }"
        href="#" 
        class="inline-flex items-center rounded-r-md border border-gray-300 bg-white px-2 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50"
      >
        <span class="sr-only">Next</span>
        <i class="fas fa-chevron-right text-xs"></i>
      </a>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  currentPage: number
  totalPages: number
}>()

const emit = defineEmits(['page-change'])

const displayedPages = computed(() => {
  const pages = []
  
  if (props.totalPages <= 7) {
    // Show all pages if there are 7 or fewer
    for (let i = 1; i <= props.totalPages; i++) {
      pages.push(i)
    }
  } else {
    // Always show first page
    pages.push(1)
    
    // Current page is near the beginning
    if (props.currentPage <= 3) {
      pages.push(2, 3, 4, '...', props.totalPages)
    } 
    // Current page is near the end
    else if (props.currentPage >= props.totalPages - 2) {
      pages.push('...', props.totalPages - 3, props.totalPages - 2, props.totalPages - 1, props.totalPages)
    } 
    // Current page is in the middle
    else {
      pages.push('...', props.currentPage - 1, props.currentPage, props.currentPage + 1, '...', props.totalPages)
    }
  }
  
  return pages
})

const onPageChange = (pageNum: number) => {
  if (pageNum < 1 || pageNum > props.totalPages) {
    return
  }
  emit('page-change', pageNum)
}
</script>
