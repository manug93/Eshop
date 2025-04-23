import { defineStore } from 'pinia'
import { fetchProducts, fetchProductById, fetchCategories } from '../services/api'

export interface Product {
  id: number
  title: string
  description: string
  price: number
  discountPercentage: number
  rating: number
  stock: number
  brand: string
  category: string
  thumbnail: string
  images: string[]
}

export const useProductStore = defineStore('product', {
  state: () => ({
    products: [] as Product[],
    categories: [] as string[],
    brands: [] as string[],
    isLoading: false,
    error: null as string | null
  }),
  
  getters: {
    getProductById: (state) => (id: number) => {
      return state.products.find(product => product.id === id)
    },
    
    getProductsByCategory: (state) => (category: string) => {
      return state.products.filter(product => product.category === category)
    },
    
    getProductsByBrand: (state) => (brand: string) => {
      return state.products.filter(product => product.brand === brand)
    },
    
    getDiscountedProducts: (state) => {
      return state.products
        .filter(product => product.discountPercentage > 0)
        .sort((a, b) => b.discountPercentage - a.discountPercentage)
    },
    
    getTopRatedProducts: (state) => {
      return [...state.products]
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 10)
    }
  },
  
  actions: {
    async fetchProducts() {
      this.isLoading = true
      this.error = null
      
      try {
        const data = await fetchProducts()
        this.products = data.products
        
        // Extract unique brands
        const brandSet = new Set<string>()
        data.products.forEach(product => brandSet.add(product.brand))
        this.brands = Array.from(brandSet).sort()
        
        // Fetch categories if not already loaded
        if (this.categories.length === 0) {
          await this.fetchCategories()
        }
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to fetch products'
        console.error('Error fetching products:', error)
      } finally {
        this.isLoading = false
      }
    },
    
    async fetchProductById(id: number): Promise<Product | null> {
      this.isLoading = true
      this.error = null
      
      try {
        const product = await fetchProductById(id)
        
        // Add to products array if not already there
        if (!this.products.some(p => p.id === product.id)) {
          this.products.push(product)
        }
        
        return product
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to fetch product'
        console.error(`Error fetching product ${id}:`, error)
        return null
      } finally {
        this.isLoading = false
      }
    },
    
    async fetchCategories() {
      try {
        const categories = await fetchCategories()
        this.categories = categories
      } catch (error) {
        console.error('Error fetching categories:', error)
      }
    },
    
    async initializeStore() {
      if (this.products.length === 0) {
        await this.fetchProducts()
      }
    }
  }
})
