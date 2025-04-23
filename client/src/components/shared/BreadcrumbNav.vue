<template>
  <nav class="mb-6">
    <ol class="flex text-sm">
      <li v-for="(path, index) in paths" :key="index">
        <template v-if="index < paths.length - 1">
          <router-link :to="path.url" class="text-gray-500 hover:text-primary">
            <span>{{ path.name }}</span>
          </router-link>
          <span class="mx-2 text-gray-500">/</span>
        </template>
        <template v-else>
          <span class="text-primary font-medium">{{ path.name }}</span>
        </template>
      </li>
    </ol>
  </nav>
</template>

<script setup lang="ts">
defineProps<{
  paths: Array<{
    name: string
    url: string
  }>
}>()
</script>
