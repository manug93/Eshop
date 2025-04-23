import { defineStore } from 'pinia'

interface SalesDataPoint {
  date: string
  revenue: number
  orders: number
}

interface CategoryData {
  name: string
  value: number
}

interface TopProduct {
  id: number
  title: string
  revenue: number
}

interface Order {
  id: number
  customerName: string
  customerEmail: string
  date: string
  total: number
  status: 'pending' | 'processing' | 'completed' | 'cancelled'
  items: {
    id: number
    title: string
    thumbnail: string
    price: number
    quantity: number
  }[]
  subtotal: number
  shipping: number
  tax: number
}

interface Promotion {
  id: number
  code: string
  type: 'percentage' | 'fixed'
  value: number
  minPurchase: number
  startDate: string
  endDate: string
  description: string
}

export const useAdminStore = defineStore('admin', {
  state: () => ({
    // Dashboard metrics
    metrics: {
      totalSales: 24789.45,
      totalOrders: 321,
      averageOrderValue: 77.23,
    },
    
    // Sales data for charts
    salesData: [] as SalesDataPoint[],
    
    // Category data for charts
    categoryData: [] as CategoryData[],
    
    // Top products by revenue
    topProducts: [] as TopProduct[],
    
    // Orders data
    orders: [] as Order[],
    
    // Promotions data
    promotions: [] as Promotion[],
    
    // Loading states
    isLoading: false
  }),
  
  actions: {
    async fetchSalesData(timeRange: string) {
      // In a real app, this would make an API call based on the time range
      // For demo purposes, generate mock data
      this.salesData = this.generateSalesData(timeRange)
      this.categoryData = this.generateCategoryData()
      this.topProducts = this.generateTopProducts()
    },
    
    async fetchOrders() {
      // In a real app, this would make an API call
      // For demo purposes, generate mock data
      this.orders = this.generateOrders()
    },
    
    async updateOrderStatus(orderId: number, status: string) {
      // In a real app, this would make an API call
      const order = this.orders.find(o => o.id === orderId)
      if (order) {
        order.status = status as any
      }
    },
    
    async fetchPromotions() {
      // In a real app, this would make an API call
      // For demo purposes, generate mock data
      this.promotions = this.generatePromotions()
    },
    
    async createPromotion(promotion: any) {
      // In a real app, this would make an API call
      const newPromotion = {
        ...promotion,
        id: Math.floor(Math.random() * 1000) + 100
      }
      this.promotions.push(newPromotion)
    },
    
    async updatePromotion(promotion: any) {
      // In a real app, this would make an API call
      const index = this.promotions.findIndex(p => p.id === promotion.id)
      if (index !== -1) {
        this.promotions[index] = { ...promotion }
      }
    },
    
    async deletePromotion(id: number) {
      // In a real app, this would make an API call
      this.promotions = this.promotions.filter(p => p.id !== id)
    },
    
    // Helper methods to generate demo data
    generateSalesData(timeRange: string): SalesDataPoint[] {
      const data: SalesDataPoint[] = []
      let days = 7
      
      switch (timeRange) {
        case 'today':
          days = 1
          break
        case 'week':
          days = 7
          break
        case 'month':
          days = 30
          break
        case 'quarter':
          days = 90
          break
        case 'year':
          days = 12 // months
          break
      }
      
      // Generate dates and data points
      const today = new Date()
      
      if (timeRange === 'year') {
        // Monthly data for year view
        for (let i = 0; i < days; i++) {
          const date = new Date(today)
          date.setMonth(today.getMonth() - (days - 1 - i))
          const monthYear = date.toLocaleString('default', { month: 'short', year: 'numeric' })
          
          const revenue = Math.floor(Math.random() * 10000) + 5000
          const orders = Math.floor(Math.random() * 100) + 50
          
          data.push({
            date: monthYear,
            revenue,
            orders
          })
        }
      } else {
        // Daily data
        for (let i = 0; i < days; i++) {
          const date = new Date(today)
          date.setDate(today.getDate() - (days - 1 - i))
          const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          
          const revenue = Math.floor(Math.random() * 1000) + 500
          const orders = Math.floor(Math.random() * 20) + 5
          
          data.push({
            date: formattedDate,
            revenue,
            orders
          })
        }
      }
      
      return data
    },
    
    generateCategoryData(): CategoryData[] {
      return [
        { name: 'Electronics', value: 40 },
        { name: 'Clothing', value: 25 },
        { name: 'Home & Garden', value: 15 },
        { name: 'Books', value: 10 },
        { name: 'Other', value: 10 }
      ]
    },
    
    generateTopProducts(): TopProduct[] {
      return [
        { id: 1, title: 'iPhone 13 Pro', revenue: 4250.00 },
        { id: 2, title: 'Samsung Galaxy S22', revenue: 3187.50 },
        { id: 3, title: 'MacBook Pro M1', revenue: 2895.75 },
        { id: 4, title: 'Sony WH-1000XM4', revenue: 1578.25 },
        { id: 5, title: 'iPad Air', revenue: 1245.00 }
      ]
    },
    
    generateOrders(): Order[] {
      const statuses: ('pending' | 'processing' | 'completed' | 'cancelled')[] = ['pending', 'processing', 'completed', 'cancelled']
      const orders: Order[] = []
      
      for (let i = 1; i <= 30; i++) {
        const orderDate = new Date()
        orderDate.setDate(orderDate.getDate() - Math.floor(Math.random() * 30))
        
        const subtotal = Math.floor(Math.random() * 300) + 50
        const shipping = subtotal > 50 ? 0 : 5.99
        const tax = subtotal * 0.08
        
        orders.push({
          id: 10000 + i,
          customerName: `Customer ${i}`,
          customerEmail: `customer${i}@example.com`,
          date: orderDate.toISOString(),
          total: subtotal + shipping + tax,
          status: statuses[Math.floor(Math.random() * statuses.length)],
          items: [
            {
              id: 1,
              title: 'Product ' + (Math.floor(Math.random() * 10) + 1),
              thumbnail: `https://picsum.photos/id/${(Math.floor(Math.random() * 100))}/200`,
              price: Math.floor(Math.random() * 100) + 20,
              quantity: Math.floor(Math.random() * 3) + 1
            },
            {
              id: 2,
              title: 'Product ' + (Math.floor(Math.random() * 10) + 11),
              thumbnail: `https://picsum.photos/id/${(Math.floor(Math.random() * 100) + 100)}/200`,
              price: Math.floor(Math.random() * 100) + 20,
              quantity: Math.floor(Math.random() * 2) + 1
            }
          ],
          subtotal,
          shipping,
          tax
        })
      }
      
      return orders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    },
    
    generatePromotions(): Promotion[] {
      const now = new Date()
      const oneWeekAgo = new Date(now)
      oneWeekAgo.setDate(now.getDate() - 7)
      
      const oneWeekLater = new Date(now)
      oneWeekLater.setDate(now.getDate() + 7)
      
      const oneMonthLater = new Date(now)
      oneMonthLater.setMonth(now.getMonth() + 1)
      
      return [
        {
          id: 1,
          code: 'SUMMER2023',
          type: 'percentage',
          value: 15,
          minPurchase: 50,
          startDate: oneWeekAgo.toISOString().split('T')[0],
          endDate: oneMonthLater.toISOString().split('T')[0],
          description: 'Summer sale discount'
        },
        {
          id: 2,
          code: 'WELCOME10',
          type: 'fixed',
          value: 10,
          minPurchase: 30,
          startDate: oneWeekAgo.toISOString().split('T')[0],
          endDate: oneMonthLater.toISOString().split('T')[0],
          description: 'New customer discount'
        },
        {
          id: 3,
          code: 'FLASH25',
          type: 'percentage',
          value: 25,
          minPurchase: 100,
          startDate: now.toISOString().split('T')[0],
          endDate: oneWeekLater.toISOString().split('T')[0],
          description: 'Flash sale discount'
        }
      ]
    }
  }
})
