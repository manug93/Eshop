import { defineStore } from 'pinia'
import { useI18n } from 'vue-i18n'

interface User {
  id: number
  username: string
  email: string
  isAdmin: boolean
}

export const useUserStore = defineStore('user', {
  state: () => ({
    currentUser: null as User | null,
    isAuthenticated: false,
    wishlist: [] as number[],
    currentLang: 'en'
  }),
  
  actions: {
    setLanguage(lang: string) {
      this.currentLang = lang
      
      // Set locale in i18n
      const i18n = useI18n()
      i18n.locale.value = lang
      
      // Save to localStorage
      localStorage.setItem('language', lang)
      
      // Set html lang attribute
      document.documentElement.setAttribute('lang', lang)
    },
    
    toggleWishlist(productId: number) {
      const index = this.wishlist.indexOf(productId)
      
      if (index === -1) {
        // Add to wishlist
        this.wishlist.push(productId)
      } else {
        // Remove from wishlist
        this.wishlist.splice(index, 1)
      }
      
      // Save to localStorage
      this.saveWishlistToLocalStorage()
    },
    
    saveWishlistToLocalStorage() {
      localStorage.setItem('wishlist', JSON.stringify(this.wishlist))
    },
    
    loadWishlistFromLocalStorage() {
      const savedWishlist = localStorage.getItem('wishlist')
      if (savedWishlist) {
        try {
          this.wishlist = JSON.parse(savedWishlist)
        } catch (e) {
          console.error('Failed to parse wishlist from localStorage:', e)
          this.wishlist = []
        }
      }
    },
    
    loadLanguageFromLocalStorage() {
      const savedLang = localStorage.getItem('language')
      if (savedLang && (savedLang === 'en' || savedLang === 'fr')) {
        this.setLanguage(savedLang)
      }
    },
    
    login(user: User) {
      this.currentUser = user
      this.isAuthenticated = true
      localStorage.setItem('user', JSON.stringify(user))
    },
    
    logout() {
      this.currentUser = null
      this.isAuthenticated = false
      localStorage.removeItem('user')
    },
    
    checkAuth() {
      const savedUser = localStorage.getItem('user')
      if (savedUser) {
        try {
          this.currentUser = JSON.parse(savedUser)
          this.isAuthenticated = true
        } catch (e) {
          console.error('Failed to parse user from localStorage:', e)
          this.currentUser = null
          this.isAuthenticated = false
        }
      }
      
      // Load wishlist and language preferences
      this.loadWishlistFromLocalStorage()
      this.loadLanguageFromLocalStorage()
    }
  }
})
