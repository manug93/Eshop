<template>
  <div class="min-h-screen w-full flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8 text-center">
      <div>
        <i class="fas fa-exclamation-circle text-red-500 text-7xl mb-4"></i>
        <h1 class="mt-6 text-4xl font-extrabold text-gray-900">{{ $t('notFound.title') }}</h1>
        <p class="mt-3 text-gray-600">{{ $t('notFound.message') }}</p>
      </div>
      <div class="mt-8 space-y-4">
        <router-link to="/" class="inline-block bg-primary hover:bg-primary-dark text-white font-medium py-3 px-6 rounded-md transition-colors">
          {{ $t('notFound.backToHome') }}
        </router-link>
        <div class="mt-4">
          <router-link to="/products" class="text-primary hover:text-primary-dark font-medium">
            {{ $t('notFound.browseProducts') }} →
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// No additional logic needed
</script>
