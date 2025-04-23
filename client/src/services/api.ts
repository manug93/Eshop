/**
 * API service for interacting with the dummyjson.com API
 */

export interface ApiProduct {
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

export interface ApiProductsResponse {
  products: ApiProduct[]
  total: number
  skip: number
  limit: number
}

// Base URL for the dummyjson API
const API_BASE_URL = 'https://dummyjson.com'

/**
 * Fetch all products with optional limit and skip parameters
 */
export async function fetchProducts(limit: number = 100, skip: number = 0): Promise<ApiProductsResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/products?limit=${limit}&skip=${skip}`)
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error fetching products:', error)
    throw error
  }
}

/**
 * Fetch a single product by ID
 */
export async function fetchProductById(id: number): Promise<ApiProduct> {
  try {
    const response = await fetch(`${API_BASE_URL}/products/${id}`)
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error(`Error fetching product ${id}:`, error)
    throw error
  }
}

/**
 * Fetch all product categories
 */
export async function fetchCategories(): Promise<string[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/products/categories`)
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error fetching categories:', error)
    throw error
  }
}

/**
 * Fetch products by category
 */
export async function fetchProductsByCategory(category: string, limit: number = 20): Promise<ApiProductsResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/products/category/${category}?limit=${limit}`)
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error(`Error fetching products for category ${category}:`, error)
    throw error
  }
}

/**
 * Search products by query
 */
export async function searchProducts(query: string): Promise<ApiProductsResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/products/search?q=${encodeURIComponent(query)}`)
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error(`Error searching products for query "${query}":`, error)
    throw error
  }
}

/**
 * Fetch all products with filters
 * This is a custom implementation as dummyjson doesn't support all these filters directly
 * We'll fetch all products and filter them client-side
 */
export async function fetchProductsWithFilters(
  filters: {
    categories?: string[]
    brands?: string[]
    priceRange?: [number, number]
    minRating?: number
  }
): Promise<ApiProduct[]> {
  try {
    // Fetch all products first
    const { products } = await fetchProducts(100, 0)
    
    // Apply filters
    return products.filter(product => {
      // Filter by categories
      if (filters.categories && filters.categories.length > 0 && 
          !filters.categories.includes(product.category)) {
        return false
      }
      
      // Filter by brands
      if (filters.brands && filters.brands.length > 0 && 
          !filters.brands.includes(product.brand)) {
        return false
      }
      
      // Filter by price range
      if (filters.priceRange) {
        const [min, max] = filters.priceRange
        const actualPrice = product.discountPercentage > 0 
          ? product.price * (1 - product.discountPercentage / 100)
          : product.price
          
        if (actualPrice < min || actualPrice > max) {
          return false
        }
      }
      
      // Filter by minimum rating
      if (filters.minRating && product.rating < filters.minRating) {
        return false
      }
      
      return true
    })
  } catch (error) {
    console.error('Error fetching products with filters:', error)
    throw error
  }
}
