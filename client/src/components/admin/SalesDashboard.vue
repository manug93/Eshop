<template>
  <div class="bg-white rounded-lg shadow-sm p-6">
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold text-gray-800">{{ $t('admin.dashboard.salesOverview') }}</h2>
      <div>
        <Dropdown 
          v-model="timeRange" 
          :options="timeRangeOptions" 
          optionLabel="name" 
          placeholder="Select Time Range" 
          class="w-48"
        />
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <div class="bg-blue-50 rounded-lg p-4">
        <h3 class="text-sm font-medium text-blue-600 mb-2">{{ $t('admin.dashboard.totalSales') }}</h3>
        <p class="text-3xl font-bold text-blue-800">${{ formatNumber(adminStore.metrics.totalSales) }}</p>
        <div class="mt-1 text-sm text-blue-600">
          <span :class="`${salesTrend > 0 ? 'text-green-600' : 'text-red-600'}`">
            <i :class="`fas ${salesTrend > 0 ? 'fa-arrow-up' : 'fa-arrow-down'}`"></i>
            {{ Math.abs(salesTrend) }}%
          </span>
          <span class="ml-1">{{ $t('admin.dashboard.vsPreviousPeriod') }}</span>
        </div>
      </div>

      <div class="bg-green-50 rounded-lg p-4">
        <h3 class="text-sm font-medium text-green-600 mb-2">{{ $t('admin.dashboard.totalOrders') }}</h3>
        <p class="text-3xl font-bold text-green-800">{{ adminStore.metrics.totalOrders }}</p>
        <div class="mt-1 text-sm text-green-600">
          <span :class="`${ordersTrend > 0 ? 'text-green-600' : 'text-red-600'}`">
            <i :class="`fas ${ordersTrend > 0 ? 'fa-arrow-up' : 'fa-arrow-down'}`"></i>
            {{ Math.abs(ordersTrend) }}%
          </span>
          <span class="ml-1">{{ $t('admin.dashboard.vsPreviousPeriod') }}</span>
        </div>
      </div>

      <div class="bg-purple-50 rounded-lg p-4">
        <h3 class="text-sm font-medium text-purple-600 mb-2">{{ $t('admin.dashboard.averageOrderValue') }}</h3>
        <p class="text-3xl font-bold text-purple-800">${{ formatNumber(adminStore.metrics.averageOrderValue) }}</p>
        <div class="mt-1 text-sm text-purple-600">
          <span :class="`${aovTrend > 0 ? 'text-green-600' : 'text-red-600'}`">
            <i :class="`fas ${aovTrend > 0 ? 'fa-arrow-up' : 'fa-arrow-down'}`"></i>
            {{ Math.abs(aovTrend) }}%
          </span>
          <span class="ml-1">{{ $t('admin.dashboard.vsPreviousPeriod') }}</span>
        </div>
      </div>
    </div>

    <div class="mb-8">
      <h3 class="text-lg font-semibold mb-4">{{ $t('admin.dashboard.salesTrend') }}</h3>
      <div class="h-80 bg-gray-50 rounded-lg p-4">
        <Chart type="line" :data="salesChartData" :options="chartOptions" class="h-full" />
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <h3 class="text-lg font-semibold mb-4">{{ $t('admin.dashboard.topCategories') }}</h3>
        <div class="bg-gray-50 rounded-lg p-4">
          <Chart type="doughnut" :data="categoriesChartData" :options="doughnutOptions" style="height: 240px" />
        </div>
      </div>

      <div>
        <h3 class="text-lg font-semibold mb-4">{{ $t('admin.dashboard.topProducts') }}</h3>
        <div class="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <ul class="divide-y divide-gray-200">
            <li v-for="(product, index) in adminStore.topProducts" :key="index" class="p-4 flex justify-between items-center">
              <div class="flex items-center">
                <span class="w-6 h-6 bg-blue-100 text-blue-800 rounded-full inline-flex items-center justify-center text-xs font-medium mr-3">
                  {{ index + 1 }}
                </span>
                <span class="text-gray-900 font-medium">{{ product.title }}</span>
              </div>
              <span class="text-gray-600">${{ product.revenue.toFixed(2) }}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAdminStore } from '../../stores/adminStore'

const { t } = useI18n()
const adminStore = useAdminStore()

// Time range selection
const timeRangeOptions = [
  { name: t('admin.dashboard.timeRanges.today'), value: 'today' },
  { name: t('admin.dashboard.timeRanges.week'), value: 'week' },
  { name: t('admin.dashboard.timeRanges.month'), value: 'month' },
  { name: t('admin.dashboard.timeRanges.quarter'), value: 'quarter' },
  { name: t('admin.dashboard.timeRanges.year'), value: 'year' }
]
const timeRange = ref(timeRangeOptions[2])

// Metrics trends (simulated)
const salesTrend = ref(12.3)
const ordersTrend = ref(8.5)
const aovTrend = ref(3.2)

// Chart data
const salesChartData = computed(() => ({
  labels: adminStore.salesData.map(item => item.date),
  datasets: [
    {
      label: t('admin.dashboard.revenue'),
      data: adminStore.salesData.map(item => item.revenue),
      fill: false,
      borderColor: '#3B82F6',
      tension: 0.4
    },
    {
      label: t('admin.dashboard.orders'),
      data: adminStore.salesData.map(item => item.orders),
      fill: false,
      borderColor: '#10B981',
      tension: 0.4
    }
  ]
}))

const categoriesChartData = computed(() => ({
  labels: adminStore.categoryData.map(item => item.name),
  datasets: [
    {
      data: adminStore.categoryData.map(item => item.value),
      backgroundColor: [
        '#3B82F6',
        '#10B981',
        '#F59E0B',
        '#EC4899',
        '#8B5CF6'
      ]
    }
  ]
}))

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    y: {
      beginAtZero: true,
      grid: {
        display: true,
        color: 'rgba(0,0,0,0.05)'
      }
    },
    x: {
      grid: {
        display: false
      }
    }
  },
  plugins: {
    legend: {
      position: 'top'
    }
  }
}

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '70%',
  plugins: {
    legend: {
      position: 'bottom'
    }
  }
}

// Format number with commas
const formatNumber = (value: number) => {
  return value.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,')
}

// Load data when timeRange changes
watch(timeRange, (newValue) => {
  adminStore.fetchSalesData(newValue.value)
})

onMounted(() => {
  adminStore.fetchSalesData(timeRange.value.value)
})
</script>
