<template>
  <header class="bg-white shadow-sm sticky top-0 z-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center h-16">
        <!-- Logo -->
        <div class="flex-shrink-0 flex items-center">
          <router-link to="/" class="text-2xl font-bold text-primary">
            <i class="fas fa-shopping-bag mr-2"></i>E-Shop
          </router-link>
        </div>

        <!-- Navigation -->
        <nav class="hidden md:flex space-x-8">
          <router-link to="/" class="text-gray-700 hover:text-primary px-3 py-2 font-medium" :class="{ 'text-primary border-b-2 border-primary': $route.path === '/' }">
            {{ $t('nav.home') }}
          </router-link>
          <router-link to="/products" class="text-gray-700 hover:text-primary px-3 py-2 font-medium" :class="{ 'text-primary border-b-2 border-primary': $route.path.startsWith('/products') }">
            {{ $t('nav.products') }}
          </router-link>
          <router-link to="/about" class="text-gray-700 hover:text-primary px-3 py-2 font-medium" :class="{ 'text-primary border-b-2 border-primary': $route.path === '/about' }">
            {{ $t('nav.about') }}
          </router-link>
          <router-link to="/contact" class="text-gray-700 hover:text-primary px-3 py-2 font-medium" :class="{ 'text-primary border-b-2 border-primary': $route.path === '/contact' }">
            {{ $t('nav.contact') }}
          </router-link>
        </nav>

        <!-- Right section: Language, User, Cart -->
        <div class="flex items-center space-x-6">
          <!-- Language Switcher -->
          <div class="relative">
            <button @click="toggleLanguage" class="flex items-center text-gray-700 hover:text-primary focus:outline-none">
              <span class="mr-1">{{ userStore.currentLang.toUpperCase() }}</span>
              <i class="fas fa-chevron-down text-xs"></i>
            </button>
            <div v-if="languageMenuOpen" class="absolute right-0 mt-2 py-2 w-24 bg-white rounded-md shadow-lg" id="language-menu">
              <a @click="setLanguage('en')" href="#" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">English</a>
              <a @click="setLanguage('fr')" href="#" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Français</a>
            </div>
          </div>

          <!-- User menu -->
          <div class="relative">
            <button @click="toggleUserMenu" class="flex items-center text-gray-700 hover:text-primary focus:outline-none">
              <span class="sr-only">Open user menu</span>
              <img class="h-8 w-8 rounded-full" src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="User avatar">
              <i class="fas fa-chevron-down text-xs ml-1"></i>
            </button>
            <div v-if="userMenuOpen" class="absolute right-0 mt-2 py-2 w-48 bg-white rounded-md shadow-lg" id="user-menu">
              <router-link to="/profile" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                {{ $t('user.profile') }}
              </router-link>
              <router-link to="/orders" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                {{ $t('user.orders') }}
              </router-link>
              <router-link to="/settings" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                {{ $t('user.settings') }}
              </router-link>
              <router-link to="/admin" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                {{ $t('user.admin') }}
              </router-link>
              <a @click="logout" href="#" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                {{ $t('user.logout') }}
              </a>
            </div>
          </div>

          <!-- Shopping Cart -->
          <div class="relative">
            <button @click="toggleCart" class="p-1 text-gray-700 hover:text-primary focus:outline-none">
              <span class="sr-only">View shopping cart</span>
              <i class="fas fa-shopping-cart text-xl"></i>
              <span class="absolute -top-2 -right-2 bg-accent text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                {{ cartStore.totalItems }}
              </span>
            </button>
          </div>

          <!-- Mobile menu button -->
          <button @click="toggleMobileMenu" class="md:hidden p-1 text-gray-700 hover:text-primary focus:outline-none">
            <span class="sr-only">Open main menu</span>
            <i class="fas fa-bars text-xl"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- Mobile menu -->
    <div v-if="mobileMenuOpen" class="md:hidden" id="mobile-menu">
      <div class="px-2 pt-2 pb-3 space-y-1 sm:px-3">
        <router-link to="/" @click="mobileMenuOpen = false" class="block px-3 py-2 text-base font-medium text-gray-700 hover:text-primary" :class="{ 'text-primary': $route.path === '/' }">
          {{ $t('nav.home') }}
        </router-link>
        <router-link to="/products" @click="mobileMenuOpen = false" class="block px-3 py-2 text-base font-medium text-gray-700 hover:text-primary" :class="{ 'text-primary': $route.path.startsWith('/products') }">
          {{ $t('nav.products') }}
        </router-link>
        <router-link to="/about" @click="mobileMenuOpen = false" class="block px-3 py-2 text-base font-medium text-gray-700 hover:text-primary" :class="{ 'text-primary': $route.path === '/about' }">
          {{ $t('nav.about') }}
        </router-link>
        <router-link to="/contact" @click="mobileMenuOpen = false" class="block px-3 py-2 text-base font-medium text-gray-700 hover:text-primary" :class="{ 'text-primary': $route.path === '/contact' }">
          {{ $t('nav.contact') }}
        </router-link>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useCartStore } from '../../stores/cartStore'
import { useUserStore } from '../../stores/userStore'

const { t } = useI18n()
const cartStore = useCartStore()
const userStore = useUserStore()

const mobileMenuOpen = ref(false)
const userMenuOpen = ref(false)
const languageMenuOpen = ref(false)

const toggleMobileMenu = () => {
  mobileMenuOpen.value = !mobileMenuOpen.value
}

const toggleUserMenu = () => {
  userMenuOpen.value = !userMenuOpen.value
}

const toggleLanguage = () => {
  languageMenuOpen.value = !languageMenuOpen.value
}

const toggleCart = () => {
  cartStore.isCartOpen = !cartStore.isCartOpen
}

const setLanguage = (lang: string) => {
  userStore.setLanguage(lang)
  languageMenuOpen.value = false
}

const logout = () => {
  userStore.logout()
  userMenuOpen.value = false
}

// Close menus when clicking outside
const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  
  if (!target.closest('button[onclick="toggleMobileMenu"]') && !target.closest('#mobile-menu')) {
    mobileMenuOpen.value = false
  }

  if (!target.closest('button[onclick="toggleUserMenu"]') && !target.closest('#user-menu')) {
    userMenuOpen.value = false
  }
  
  if (!target.closest('button[onclick="toggleLanguage"]') && !target.closest('#language-menu')) {
    languageMenuOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>
