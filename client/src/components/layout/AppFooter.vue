<template>
  <footer class="bg-white border-t border-gray-200 mt-16">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
            {{ $t('footer.shop') }}
          </h3>
          <ul class="space-y-3">
            <li>
              <router-link to="/products/new" class="text-base text-gray-600 hover:text-primary">
                {{ $t('footer.newArrivals') }}
              </router-link>
            </li>
            <li>
              <router-link to="/products/best-sellers" class="text-base text-gray-600 hover:text-primary">
                {{ $t('footer.bestSellers') }}
              </router-link>
            </li>
            <li>
              <router-link to="/products/deals" class="text-base text-gray-600 hover:text-primary">
                {{ $t('footer.deals') }}
              </router-link>
            </li>
            <li>
              <router-link to="/products/clearance" class="text-base text-gray-600 hover:text-primary">
                {{ $t('footer.clearance') }}
              </router-link>
            </li>
          </ul>
        </div>

        <div>
          <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
            {{ $t('footer.about') }}
          </h3>
          <ul class="space-y-3">
            <li>
              <router-link to="/about/story" class="text-base text-gray-600 hover:text-primary">
                {{ $t('footer.ourStory') }}
              </router-link>
            </li>
            <li>
              <router-link to="/about/careers" class="text-base text-gray-600 hover:text-primary">
                {{ $t('footer.careers') }}
              </router-link>
            </li>
            <li>
              <router-link to="/about/press" class="text-base text-gray-600 hover:text-primary">
                {{ $t('footer.press') }}
              </router-link>
            </li>
            <li>
              <router-link to="/about/sustainability" class="text-base text-gray-600 hover:text-primary">
                {{ $t('footer.sustainability') }}
              </router-link>
            </li>
          </ul>
        </div>

        <div>
          <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
            {{ $t('footer.customerService') }}
          </h3>
          <ul class="space-y-3">
            <li>
              <router-link to="/contact" class="text-base text-gray-600 hover:text-primary">
                {{ $t('footer.contact') }}
              </router-link>
            </li>
            <li>
              <router-link to="/shipping" class="text-base text-gray-600 hover:text-primary">
                {{ $t('footer.shipping') }}
              </router-link>
            </li>
            <li>
              <router-link to="/warranty" class="text-base text-gray-600 hover:text-primary">
                {{ $t('footer.warranty') }}
              </router-link>
            </li>
            <li>
              <router-link to="/faq" class="text-base text-gray-600 hover:text-primary">
                {{ $t('footer.faq') }}
              </router-link>
            </li>
          </ul>
        </div>

        <div>
          <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
            {{ $t('footer.newsletter') }}
          </h3>
          <p class="text-base text-gray-600 mb-4">
            {{ $t('footer.newsletterText') }}
          </p>
          <form @submit.prevent="subscribeNewsletter" class="flex">
            <InputText v-model="email" type="email" placeholder="Your email" class="min-w-0 flex-1 border border-gray-300 rounded-l-md py-2 px-3 bg-white focus:outline-none focus:ring-primary focus:border-primary" />
            <Button type="submit" class="bg-primary hover:bg-primary-dark text-white rounded-r-md px-4 py-2 font-medium">
              {{ $t('footer.subscribe') }}
            </Button>
          </form>
          
          <div class="mt-4 flex space-x-6">
            <a href="#" class="text-gray-400 hover:text-primary">
              <span class="sr-only">Facebook</span>
              <i class="fab fa-facebook-f text-lg"></i>
            </a>
            <a href="#" class="text-gray-400 hover:text-primary">
              <span class="sr-only">Instagram</span>
              <i class="fab fa-instagram text-lg"></i>
            </a>
            <a href="#" class="text-gray-400 hover:text-primary">
              <span class="sr-only">Twitter</span>
              <i class="fab fa-twitter text-lg"></i>
            </a>
            <a href="#" class="text-gray-400 hover:text-primary">
              <span class="sr-only">YouTube</span>
              <i class="fab fa-youtube text-lg"></i>
            </a>
          </div>
        </div>
      </div>

      <div class="mt-12 border-t border-gray-200 pt-8">
        <div class="flex flex-col md:flex-row justify-between items-center">
          <p class="text-base text-gray-500">
            © {{ new Date().getFullYear() }} E-Shop, Inc. 
            <span>{{ $t('footer.rightsReserved') }}</span>
          </p>
          <div class="flex space-x-6 mt-4 md:mt-0">
            <router-link to="/privacy" class="text-sm text-gray-500 hover:text-primary">
              {{ $t('footer.privacy') }}
            </router-link>
            <router-link to="/terms" class="text-sm text-gray-500 hover:text-primary">
              {{ $t('footer.terms') }}
            </router-link>
            <router-link to="/cookies" class="text-sm text-gray-500 hover:text-primary">
              {{ $t('footer.cookies') }}
            </router-link>
          </div>
        </div>
        <div class="mt-4 flex justify-center space-x-4">
          <!-- Payment Method Icons -->
          <span class="h-8 w-12 bg-gray-200 rounded flex items-center justify-center">
            <i class="fab fa-cc-visa text-gray-700 text-xl"></i>
          </span>
          <span class="h-8 w-12 bg-gray-200 rounded flex items-center justify-center">
            <i class="fab fa-cc-mastercard text-gray-700 text-xl"></i>
          </span>
          <span class="h-8 w-12 bg-gray-200 rounded flex items-center justify-center">
            <i class="fab fa-cc-apple-pay text-gray-700 text-xl"></i>
          </span>
          <span class="h-8 w-12 bg-gray-200 rounded flex items-center justify-center">
            <i class="fab fa-cc-paypal text-gray-700 text-xl"></i>
          </span>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const toast = useToast()
const email = ref('')

const subscribeNewsletter = () => {
  if (!email.value || !email.value.includes('@')) {
    toast.add({
      severity: 'error',
      summary: t('toast.error'),
      detail: t('toast.invalidEmail'),
      life: 3000
    })
    return
  }
  
  toast.add({
    severity: 'success',
    summary: t('toast.success'),
    detail: t('toast.subscribeSuccess'),
    life: 3000
  })
  
  email.value = ''
}
</script>
