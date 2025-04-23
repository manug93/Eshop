<template>
  <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div class="mb-8 flex justify-between items-center">
      <div>
        <h1 class="text-3xl font-bold text-gray-900">{{ $t('admin.dashboard.title') }}</h1>
        <p class="mt-1 text-gray-600">{{ $t('admin.dashboard.subtitle') }}</p>
      </div>
      <div>
        <router-link to="/" class="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">
          <i class="fas fa-arrow-left mr-2"></i>
          {{ $t('admin.backToStore') }}
        </router-link>
      </div>
    </div>

    <div class="flex flex-col lg:flex-row">
      <!-- Sidebar -->
      <div class="lg:w-64 lg:pr-8 mb-6 lg:mb-0">
        <div class="bg-white rounded-lg shadow-sm p-4 sticky top-8">
          <div class="space-y-1">
            <button 
              @click="activeTab = 'dashboard'" 
              class="w-full flex items-center px-3 py-2 text-sm font-medium rounded-md" 
              :class="activeTab === 'dashboard' ? 'bg-primary text-white' : 'text-gray-900 hover:bg-gray-100'"
            >
              <i class="fas fa-tachometer-alt w-5 h-5 mr-2"></i>
              {{ $t('admin.navigation.dashboard') }}
            </button>
            <button 
              @click="activeTab = 'orders'" 
              class="w-full flex items-center px-3 py-2 text-sm font-medium rounded-md" 
              :class="activeTab === 'orders' ? 'bg-primary text-white' : 'text-gray-900 hover:bg-gray-100'"
            >
              <i class="fas fa-shopping-cart w-5 h-5 mr-2"></i>
              {{ $t('admin.navigation.orders') }}
            </button>
            <button 
              @click="activeTab = 'products'" 
              class="w-full flex items-center px-3 py-2 text-sm font-medium rounded-md" 
              :class="activeTab === 'products' ? 'bg-primary text-white' : 'text-gray-900 hover:bg-gray-100'"
            >
              <i class="fas fa-box w-5 h-5 mr-2"></i>
              {{ $t('admin.navigation.products') }}
            </button>
            <button 
              @click="activeTab = 'promotions'" 
              class="w-full flex items-center px-3 py-2 text-sm font-medium rounded-md" 
              :class="activeTab === 'promotions' ? 'bg-primary text-white' : 'text-gray-900 hover:bg-gray-100'"
            >
              <i class="fas fa-tag w-5 h-5 mr-2"></i>
              {{ $t('admin.navigation.promotions') }}
            </button>
            <button 
              @click="activeTab = 'settings'" 
              class="w-full flex items-center px-3 py-2 text-sm font-medium rounded-md" 
              :class="activeTab === 'settings' ? 'bg-primary text-white' : 'text-gray-900 hover:bg-gray-100'"
            >
              <i class="fas fa-cog w-5 h-5 mr-2"></i>
              {{ $t('admin.navigation.settings') }}
            </button>
          </div>
          
          <div class="pt-4 mt-4 border-t border-gray-200">
            <div class="flex items-center">
              <img 
                class="h-8 w-8 rounded-full" 
                src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" 
                alt="Admin avatar"
              >
              <div class="ml-3">
                <p class="text-sm font-medium text-gray-900">Admin User</p>
                <p class="text-xs text-gray-500">admin@example.com</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Main content -->
      <div class="flex-1">
        <div class="mb-6 p-4 bg-white rounded-lg shadow-sm lg:hidden">
          <select 
            v-model="activeTab" 
            class="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
          >
            <option value="dashboard">{{ $t('admin.navigation.dashboard') }}</option>
            <option value="orders">{{ $t('admin.navigation.orders') }}</option>
            <option value="products">{{ $t('admin.navigation.products') }}</option>
            <option value="promotions">{{ $t('admin.navigation.promotions') }}</option>
            <option value="settings">{{ $t('admin.navigation.settings') }}</option>
          </select>
        </div>

        <!-- Dashboard Tab -->
        <div v-if="activeTab === 'dashboard'">
          <SalesDashboard />
        </div>

        <!-- Orders Tab -->
        <div v-else-if="activeTab === 'orders'">
          <OrdersList />
        </div>

        <!-- Products Tab -->
        <div v-else-if="activeTab === 'products'">
          <div class="bg-white rounded-lg shadow-sm p-6">
            <div class="flex justify-between items-center mb-6">
              <h2 class="text-2xl font-bold text-gray-800">{{ $t('admin.products.title') }}</h2>
              <Button label="Add Product" icon="fas fa-plus" class="bg-primary text-white px-4 py-2 rounded-md" />
            </div>
            
            <div class="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
              <div class="flex">
                <div class="flex-shrink-0">
                  <i class="fas fa-exclamation-triangle text-yellow-400"></i>
                </div>
                <div class="ml-3">
                  <p class="text-sm text-yellow-700">
                    {{ $t('admin.products.readOnlyNotice') }}
                  </p>
                </div>
              </div>
            </div>
            
            <DataTable 
              :value="productStore.products.slice(0, 10)" 
              :paginator="true" 
              :rows="10" 
              stripedRows
              responsiveLayout="scroll"
              class="p-datatable-products"
            >
              <Column field="id" header="ID" sortable style="width: 5%"></Column>
              <Column header="Image" style="width: 10%">
                <template #body="{ data }">
                  <img :src="data.thumbnail" :alt="data.title" class="w-12 h-12 object-cover rounded">
                </template>
              </Column>
              <Column field="title" header="Product" sortable style="width: 25%"></Column>
              <Column field="brand" header="Brand" sortable style="width: 15%"></Column>
              <Column field="category" header="Category" sortable style="width: 15%"></Column>
              <Column field="price" header="Price" sortable style="width: 10%">
                <template #body="{ data }">
                  ${{ data.price.toFixed(2) }}
                </template>
              </Column>
              <Column field="stock" header="Stock" sortable style="width: 10%"></Column>
              <Column header="Actions" style="width: 10%">
                <template #body>
                  <Button icon="fas fa-edit" class="p-button-text p-button-sm mr-2" />
                  <Button icon="fas fa-trash-alt" class="p-button-text p-button-sm p-button-danger" />
                </template>
              </Column>
            </DataTable>
          </div>
        </div>

        <!-- Promotions Tab -->
        <div v-else-if="activeTab === 'promotions'">
          <PromotionsManager />
        </div>

        <!-- Settings Tab -->
        <div v-else-if="activeTab === 'settings'">
          <div class="bg-white rounded-lg shadow-sm p-6">
            <h2 class="text-2xl font-bold text-gray-800 mb-6">{{ $t('admin.settings.title') }}</h2>
            
            <div class="border-b border-gray-200 pb-6 mb-6">
              <h3 class="text-lg font-medium text-gray-900 mb-4">{{ $t('admin.settings.generalSettings') }}</h3>
              
              <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label for="store-name" class="block text-sm font-medium text-gray-700 mb-1">
                    {{ $t('admin.settings.storeName') }}
                  </label>
                  <input 
                    type="text" 
                    id="store-name" 
                    value="E-Shop" 
                    class="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-primary focus:border-primary"
                  />
                </div>
                
                <div>
                  <label for="store-email" class="block text-sm font-medium text-gray-700 mb-1">
                    {{ $t('admin.settings.storeEmail') }}
                  </label>
                  <input 
                    type="email" 
                    id="store-email" 
                    value="contact@eshop.com" 
                    class="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-primary focus:border-primary"
                  />
                </div>
                
                <div>
                  <label for="store-currency" class="block text-sm font-medium text-gray-700 mb-1">
                    {{ $t('admin.settings.currency') }}
                  </label>
                  <select 
                    id="store-currency" 
                    class="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-primary focus:border-primary"
                  >
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="GBP">GBP - British Pound</option>
                    <option value="CAD">CAD - Canadian Dollar</option>
                  </select>
                </div>
                
                <div>
                  <label for="tax-rate" class="block text-sm font-medium text-gray-700 mb-1">
                    {{ $t('admin.settings.taxRate') }} (%)
                  </label>
                  <input 
                    type="number" 
                    id="tax-rate" 
                    value="8" 
                    min="0" 
                    max="100" 
                    step="0.1"
                    class="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-primary focus:border-primary"
                  />
                </div>
              </div>
            </div>
            
            <div class="border-b border-gray-200 pb-6 mb-6">
              <h3 class="text-lg font-medium text-gray-900 mb-4">{{ $t('admin.settings.shippingSettings') }}</h3>
              
              <div class="space-y-4">
                <div class="flex items-center">
                  <input id="free-shipping" type="checkbox" checked class="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded" />
                  <label for="free-shipping" class="ml-2 block text-sm text-gray-900">
                    {{ $t('admin.settings.freeShippingOver') }} $50
                  </label>
                </div>
                
                <div>
                  <label for="shipping-flat-rate" class="block text-sm font-medium text-gray-700 mb-1">
                    {{ $t('admin.settings.flatRate') }}
                  </label>
                  <div class="mt-1 relative rounded-md shadow-sm w-40">
                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span class="text-gray-500 sm:text-sm">$</span>
                    </div>
                    <input 
                      type="number" 
                      id="shipping-flat-rate" 
                      value="5.99" 
                      min="0" 
                      step="0.01"
                      class="w-full pl-7 rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-primary focus:border-primary"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <Button label="Save Settings" class="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-md" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useProductStore } from '../stores/productStore'
import SalesDashboard from '../components/admin/SalesDashboard.vue'
import OrdersList from '../components/admin/OrdersList.vue'
import PromotionsManager from '../components/admin/PromotionsManager.vue'

const productStore = useProductStore()
const activeTab = ref('dashboard')
</script>
