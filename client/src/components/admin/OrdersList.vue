<template>
  <div class="bg-white rounded-lg shadow-sm p-6">
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold text-gray-800">{{ $t('admin.orders.title') }}</h2>
      <div class="flex space-x-2">
        <InputText 
          v-model="searchQuery" 
          placeholder="Search orders..." 
          class="w-64 border-gray-300 rounded-md shadow-sm"
        />
        <Dropdown 
          v-model="filterStatus" 
          :options="statusOptions" 
          optionLabel="name" 
          placeholder="Filter by status"
          class="w-48"
        />
      </div>
    </div>

    <DataTable 
      :value="filteredOrders" 
      :paginator="true" 
      :rows="10" 
      :loading="loading" 
      stripedRows
      responsiveLayout="scroll"
      class="p-datatable-orders"
    >
      <Column field="id" header="Order ID" sortable>
        <template #body="{ data }">
          <span class="font-medium text-blue-600">#{{ data.id }}</span>
        </template>
      </Column>
      
      <Column field="customerName" header="Customer" sortable>
        <template #body="{ data }">
          <div class="flex items-center">
            <span class="font-medium">{{ data.customerName }}</span>
          </div>
        </template>
      </Column>
      
      <Column field="date" header="Date" sortable>
        <template #body="{ data }">
          {{ formatDate(data.date) }}
        </template>
      </Column>
      
      <Column field="total" header="Total" sortable>
        <template #body="{ data }">
          <span class="font-medium">${{ data.total.toFixed(2) }}</span>
        </template>
      </Column>
      
      <Column field="status" header="Status" sortable>
        <template #body="{ data }">
          <span 
            :class="{
              'bg-green-100 text-green-800': data.status === 'completed',
              'bg-blue-100 text-blue-800': data.status === 'processing',
              'bg-yellow-100 text-yellow-800': data.status === 'pending',
              'bg-red-100 text-red-800': data.status === 'cancelled'
            }"
            class="px-3 py-1 text-xs font-medium rounded-full"
          >
            {{ data.status }}
          </span>
        </template>
      </Column>
      
      <Column header="Actions">
        <template #body="{ data }">
          <div class="flex space-x-2">
            <Button 
              @click="viewOrderDetails(data)" 
              icon="fas fa-eye" 
              class="p-button-text p-button-sm" 
              :pt="{
                root: { class: 'text-gray-600 hover:text-blue-600' }
              }"
            />
            <Button 
              v-if="data.status !== 'completed' && data.status !== 'cancelled'"
              @click="updateOrderStatus(data.id, 'completed')" 
              icon="fas fa-check" 
              class="p-button-text p-button-sm" 
              :pt="{
                root: { class: 'text-gray-600 hover:text-green-600' }
              }"
            />
            <Button 
              v-if="data.status !== 'cancelled'"
              @click="updateOrderStatus(data.id, 'cancelled')" 
              icon="fas fa-times" 
              class="p-button-text p-button-sm" 
              :pt="{
                root: { class: 'text-gray-600 hover:text-red-600' }
              }"
            />
          </div>
        </template>
      </Column>
    </DataTable>

    <!-- Order Details Dialog -->
    <Dialog 
      v-model:visible="showOrderDetails" 
      :style="{width: '50vw'}" 
      :header="$t('admin.orders.orderDetails')" 
      :modal="true"
    >
      <div v-if="selectedOrder">
        <div class="flex justify-between mb-6">
          <div>
            <h3 class="text-lg font-medium text-gray-900">{{ $t('admin.orders.order') }} #{{ selectedOrder.id }}</h3>
            <p class="text-sm text-gray-600">{{ formatDate(selectedOrder.date) }}</p>
          </div>
          <span 
            :class="{
              'bg-green-100 text-green-800': selectedOrder.status === 'completed',
              'bg-blue-100 text-blue-800': selectedOrder.status === 'processing',
              'bg-yellow-100 text-yellow-800': selectedOrder.status === 'pending',
              'bg-red-100 text-red-800': selectedOrder.status === 'cancelled'
            }"
            class="px-3 py-1 text-sm font-medium rounded-full self-start"
          >
            {{ selectedOrder.status }}
          </span>
        </div>

        <div class="mb-6">
          <h4 class="text-md font-medium text-gray-900 mb-2">{{ $t('admin.orders.customerInfo') }}</h4>
          <div class="bg-gray-50 rounded-md p-3">
            <p class="text-sm"><span class="font-medium">{{ $t('admin.orders.name') }}:</span> {{ selectedOrder.customerName }}</p>
            <p class="text-sm"><span class="font-medium">{{ $t('admin.orders.email') }}:</span> {{ selectedOrder.customerEmail }}</p>
          </div>
        </div>

        <div class="mb-6">
          <h4 class="text-md font-medium text-gray-900 mb-2">{{ $t('admin.orders.items') }}</h4>
          <div class="bg-gray-50 rounded-md p-3">
            <div v-for="(item, index) in selectedOrder.items" :key="index" class="flex justify-between py-2 border-b border-gray-200 last:border-0">
              <div class="flex">
                <div class="w-12 h-12 rounded-md overflow-hidden bg-gray-200 mr-3">
                  <img :src="item.thumbnail" :alt="item.title" class="w-full h-full object-cover">
                </div>
                <div>
                  <p class="text-sm font-medium">{{ item.title }}</p>
                  <p class="text-xs text-gray-600">{{ $t('admin.orders.quantity') }}: {{ item.quantity }}</p>
                </div>
              </div>
              <p class="text-sm font-medium">${{ item.price.toFixed(2) }}</p>
            </div>
          </div>
        </div>

        <div class="border-t border-gray-200 pt-4">
          <div class="flex justify-between py-2">
            <span class="text-sm text-gray-600">{{ $t('admin.orders.subtotal') }}</span>
            <span class="text-sm font-medium">${{ selectedOrder.subtotal.toFixed(2) }}</span>
          </div>
          <div class="flex justify-between py-2">
            <span class="text-sm text-gray-600">{{ $t('admin.orders.shipping') }}</span>
            <span class="text-sm font-medium">${{ selectedOrder.shipping.toFixed(2) }}</span>
          </div>
          <div class="flex justify-between py-2">
            <span class="text-sm text-gray-600">{{ $t('admin.orders.tax') }}</span>
            <span class="text-sm font-medium">${{ selectedOrder.tax.toFixed(2) }}</span>
          </div>
          <div class="flex justify-between pt-3 border-t border-gray-200">
            <span class="text-base font-bold">{{ $t('admin.orders.total') }}</span>
            <span class="text-base font-bold">${{ selectedOrder.total.toFixed(2) }}</span>
          </div>
        </div>
      </div>
      
      <template #footer>
        <Button 
          v-if="selectedOrder && selectedOrder.status !== 'completed' && selectedOrder.status !== 'cancelled'"
          @click="updateOrderStatus(selectedOrder.id, 'completed')" 
          label="Mark as Completed"
          class="p-button-success mr-2"
        />
        <Button 
          v-if="selectedOrder && selectedOrder.status !== 'cancelled'"
          @click="updateOrderStatus(selectedOrder.id, 'cancelled')" 
          label="Cancel Order"
          class="p-button-danger mr-2"
        />
        <Button 
          @click="showOrderDetails = false" 
          label="Close"
          class="p-button-text"
        />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'primevue/usetoast'
import { useAdminStore } from '../../stores/adminStore'
import { format } from 'date-fns'

const { t } = useI18n()
const toast = useToast()
const adminStore = useAdminStore()

// States
const loading = ref(true)
const searchQuery = ref('')
const showOrderDetails = ref(false)
const selectedOrder = ref(null)
const statusOptions = [
  { name: 'All', value: '' },
  { name: 'Pending', value: 'pending' },
  { name: 'Processing', value: 'processing' },
  { name: 'Completed', value: 'completed' },
  { name: 'Cancelled', value: 'cancelled' }
]
const filterStatus = ref(statusOptions[0])

// Computed properties
const filteredOrders = computed(() => {
  let result = [...adminStore.orders]
  
  // Apply status filter
  if (filterStatus.value.value) {
    result = result.filter(order => order.status === filterStatus.value.value)
  }
  
  // Apply search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(order => 
      order.id.toString().includes(query) ||
      order.customerName.toLowerCase().includes(query) ||
      order.customerEmail.toLowerCase().includes(query)
    )
  }
  
  return result
})

// Methods
const formatDate = (dateString: string) => {
  return format(new Date(dateString), 'MMM dd, yyyy')
}

const viewOrderDetails = (order: any) => {
  selectedOrder.value = order
  showOrderDetails.value = true
}

const updateOrderStatus = async (orderId: number, status: string) => {
  try {
    await adminStore.updateOrderStatus(orderId, status)
    
    toast.add({
      severity: 'success',
      summary: t('toast.success'),
      detail: t('admin.orders.statusUpdated'),
      life: 3000
    })
    
    // Close dialog if it's open
    if (showOrderDetails.value) {
      showOrderDetails.value = false
    }
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: t('toast.error'),
      detail: t('admin.orders.updateFailed'),
      life: 3000
    })
  }
}

onMounted(async () => {
  try {
    await adminStore.fetchOrders()
  } finally {
    loading.value = false
  }
})
</script>
