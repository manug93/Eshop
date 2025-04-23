import { defineStore } from 'pinia'

export interface CartItem {
  id: number
  title: string
  price: number
  thumbnail: string
  brand: string
  quantity: number
}

export const useCartStore = defineStore('cart', {
  state: () => ({
    items: [] as CartItem[],
    isCartOpen: false
  }),
  
  getters: {
    totalItems: (state) => {
      return state.items.reduce((total, item) => total + item.quantity, 0)
    },
    
    subtotal: (state) => {
      return state.items.reduce((total, item) => total + item.price * item.quantity, 0)
    }
  },
  
  actions: {
    addToCart(item: CartItem) {
      const existingItem = this.items.find(i => i.id === item.id)
      
      if (existingItem) {
        existingItem.quantity += item.quantity
      } else {
        this.items.push({ ...item })
      }
      
      this.saveCartToLocalStorage()
      
      // Open cart when adding item
      this.isCartOpen = true
    },
    
    removeFromCart(id: number) {
      this.items = this.items.filter(item => item.id !== id)
      this.saveCartToLocalStorage()
    },
    
    incrementQuantity(id: number) {
      const item = this.items.find(item => item.id === id)
      if (item) {
        item.quantity++
        this.saveCartToLocalStorage()
      }
    },
    
    decrementQuantity(id: number) {
      const item = this.items.find(item => item.id === id)
      if (item) {
        if (item.quantity > 1) {
          item.quantity--
        } else {
          this.removeFromCart(id)
        }
        this.saveCartToLocalStorage()
      }
    },
    
    clearCart() {
      this.items = []
      this.saveCartToLocalStorage()
    },
    
    saveCartToLocalStorage() {
      localStorage.setItem('cart', JSON.stringify(this.items))
    },
    
    loadCartFromLocalStorage() {
      const savedCart = localStorage.getItem('cart')
      if (savedCart) {
        try {
          this.items = JSON.parse(savedCart)
        } catch (e) {
          console.error('Failed to parse cart from localStorage:', e)
          this.items = []
        }
      }
    },
    
    initializeCart() {
      this.loadCartFromLocalStorage()
    }
  }
})
