<template>
  <Toast />
  <AppHeader />
  <ShoppingCart />
  <router-view v-slot="{ Component }">
    <transition name="fade" mode="out-in">
      <component :is="Component" />
    </transition>
  </router-view>
  <AppFooter />
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useProductStore } from './stores/productStore'
import { useCartStore } from './stores/cartStore'
import { useUserStore } from './stores/userStore'
import AppHeader from './components/layout/AppHeader.vue'
import AppFooter from './components/layout/AppFooter.vue'
import ShoppingCart from './components/layout/ShoppingCart.vue'

const productStore = useProductStore()
const cartStore = useCartStore()
const userStore = useUserStore()

onMounted(async () => {
  await productStore.initializeStore()
  cartStore.initializeCart()
  userStore.checkAuth()
})
</script>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
