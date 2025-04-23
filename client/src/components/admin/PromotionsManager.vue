<template>
  <div class="bg-white rounded-lg shadow-sm p-6">
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold text-gray-800">{{ $t('admin.promotions.title') }}</h2>
      <Button 
        @click="openNewPromotionDialog" 
        icon="fas fa-plus"
        label="New Promotion" 
        class="bg-primary text-white px-4 py-2 rounded-md"
      />
    </div>

    <DataTable 
      :value="adminStore.promotions" 
      :paginator="true" 
      :rows="10" 
      :loading="loading" 
      stripedRows
      responsiveLayout="scroll"
      class="p-datatable-promotions"
    >
      <Column field="code" header="Code" sortable>
        <template #body="{ data }">
          <span class="font-mono font-bold text-blue-600">{{ data.code }}</span>
        </template>
      </Column>
      
      <Column field="type" header="Type" sortable>
        <template #body="{ data }">
          <span class="px-3 py-1 text-xs font-medium rounded-full" :class="{
            'bg-green-100 text-green-800': data.type === 'percentage',
            'bg-blue-100 text-blue-800': data.type === 'fixed'
          }">
            {{ data.type === 'percentage' ? 'Percentage' : 'Fixed Amount' }}
          </span>
        </template>
      </Column>
      
      <Column field="value" header="Value" sortable>
        <template #body="{ data }">
          <span class="font-medium">
            {{ data.type === 'percentage' ? `${data.value}%` : `$${data.value.toFixed(2)}` }}
          </span>
        </template>
      </Column>
      
      <Column field="startDate" header="Start Date" sortable>
        <template #body="{ data }">
          {{ formatDate(data.startDate) }}
        </template>
      </Column>
      
      <Column field="endDate" header="End Date" sortable>
        <template #body="{ data }">
          {{ formatDate(data.endDate) }}
        </template>
      </Column>
      
      <Column field="status" header="Status" sortable>
        <template #body="{ data }">
          <span 
            :class="{
              'bg-green-100 text-green-800': isActive(data),
              'bg-gray-100 text-gray-800': !isActive(data) && new Date(data.startDate) > new Date(),
              'bg-red-100 text-red-800': !isActive(data) && new Date(data.endDate) < new Date()
            }"
            class="px-3 py-1 text-xs font-medium rounded-full"
          >
            {{ getStatus(data) }}
          </span>
        </template>
      </Column>
      
      <Column header="Actions">
        <template #body="{ data }">
          <div class="flex space-x-2">
            <Button 
              @click="editPromotion(data)" 
              icon="fas fa-edit" 
              class="p-button-text p-button-sm" 
              :pt="{
                root: { class: 'text-gray-600 hover:text-blue-600' }
              }"
            />
            <Button 
              @click="confirmDeletePromotion(data)" 
              icon="fas fa-trash" 
              class="p-button-text p-button-sm" 
              :pt="{
                root: { class: 'text-gray-600 hover:text-red-600' }
              }"
            />
          </div>
        </template>
      </Column>
    </DataTable>

    <!-- Promotion Dialog -->
    <Dialog 
      v-model:visible="showPromotionDialog" 
      :style="{width: '500px'}" 
      :header="editMode ? $t('admin.promotions.editPromotion') : $t('admin.promotions.newPromotion')" 
      :modal="true"
    >
      <div class="p-fluid">
        <div class="field mb-4">
          <label for="code" class="font-medium mb-2 block">{{ $t('admin.promotions.code') }}</label>
          <InputText 
            id="code" 
            v-model="promotion.code" 
            :class="{'p-invalid': v$.code.$invalid && v$.code.$dirty}"
            placeholder="SUMMER2023"
            class="w-full"
          />
          <small v-if="v$.code.$invalid && v$.code.$dirty" class="p-error">
            {{ v$.code.$errors[0].$message }}
          </small>
        </div>
        
        <div class="field mb-4">
          <label for="type" class="font-medium mb-2 block">{{ $t('admin.promotions.type') }}</label>
          <Dropdown 
            id="type" 
            v-model="promotion.type" 
            :options="promotionTypes" 
            optionLabel="label" 
            optionValue="value"
            placeholder="Select Type"
            class="w-full"
          />
        </div>
        
        <div class="field mb-4">
          <label for="value" class="font-medium mb-2 block">{{ $t('admin.promotions.value') }}</label>
          <div class="p-inputgroup">
            <span v-if="promotion.type === 'fixed'" class="p-inputgroup-addon">$</span>
            <InputText 
              id="value" 
              v-model="promotion.value" 
              :class="{'p-invalid': v$.value.$invalid && v$.value.$dirty}"
              type="number"
              class="w-full"
            />
            <span v-if="promotion.type === 'percentage'" class="p-inputgroup-addon">%</span>
          </div>
          <small v-if="v$.value.$invalid && v$.value.$dirty" class="p-error">
            {{ v$.value.$errors[0].$message }}
          </small>
        </div>
        
        <div class="field mb-4">
          <label for="minPurchase" class="font-medium mb-2 block">{{ $t('admin.promotions.minPurchase') }}</label>
          <div class="p-inputgroup">
            <span class="p-inputgroup-addon">$</span>
            <InputText 
              id="minPurchase" 
              v-model="promotion.minPurchase" 
              type="number"
              class="w-full"
            />
          </div>
        </div>
        
        <div class="grid grid-cols-2 gap-4 mb-4">
          <div class="field">
            <label for="startDate" class="font-medium mb-2 block">{{ $t('admin.promotions.startDate') }}</label>
            <InputText 
              id="startDate" 
              v-model="promotion.startDate" 
              type="date"
              :class="{'p-invalid': v$.startDate.$invalid && v$.startDate.$dirty}"
              class="w-full"
            />
            <small v-if="v$.startDate.$invalid && v$.startDate.$dirty" class="p-error">
              {{ v$.startDate.$errors[0].$message }}
            </small>
          </div>
          
          <div class="field">
            <label for="endDate" class="font-medium mb-2 block">{{ $t('admin.promotions.endDate') }}</label>
            <InputText 
              id="endDate" 
              v-model="promotion.endDate" 
              type="date"
              :class="{'p-invalid': v$.endDate.$invalid && v$.endDate.$dirty}"
              class="w-full"
            />
            <small v-if="v$.endDate.$invalid && v$.endDate.$dirty" class="p-error">
              {{ v$.endDate.$errors[0].$message }}
            </small>
          </div>
        </div>
        
        <div class="field mb-4">
          <label for="description" class="font-medium mb-2 block">{{ $t('admin.promotions.description') }}</label>
          <textarea 
            id="description" 
            v-model="promotion.description" 
            rows="3"
            class="w-full p-3 border border-gray-300 rounded-md"
            placeholder="Describe the promotion"
          ></textarea>
        </div>
      </div>
      
      <template #footer>
        <Button 
          @click="savePromotion" 
          :label="editMode ? $t('admin.promotions.update') : $t('admin.promotions.create')"
          class="p-button-primary mr-2"
          :loading="saving"
        />
        <Button 
          @click="showPromotionDialog = false" 
          :label="$t('admin.promotions.cancel')"
          class="p-button-text"
        />
      </template>
    </Dialog>

    <!-- Confirm Delete Dialog -->
    <Dialog 
      v-model:visible="showDeleteDialog" 
      :style="{width: '450px'}" 
      :header="$t('admin.promotions.confirmDelete')" 
      :modal="true"
    >
      <div class="confirmation-content">
        <i class="fas fa-exclamation-triangle text-yellow-500 text-xl mr-2"></i>
        <span>{{ $t('admin.promotions.deleteConfirmation', { code: promotionToDelete?.code }) }}</span>
      </div>
      
      <template #footer>
        <Button 
          @click="deletePromotion" 
          :label="$t('admin.promotions.delete')"
          class="p-button-danger mr-2"
          :loading="deleting"
        />
        <Button 
          @click="showDeleteDialog = false" 
          :label="$t('admin.promotions.cancel')"
          class="p-button-text"
        />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'primevue/usetoast'
import { useAdminStore } from '../../stores/adminStore'
import { format } from 'date-fns'
import { useVuelidate } from '@vuelidate/core'
import { required, minValue, maxValue } from '@vuelidate/validators'

const { t } = useI18n()
const toast = useToast()
const adminStore = useAdminStore()

// States
const loading = ref(true)
const showPromotionDialog = ref(false)
const showDeleteDialog = ref(false)
const editMode = ref(false)
const saving = ref(false)
const deleting = ref(false)
const promotionToDelete = ref(null)

// Form data
const promotion = reactive({
  id: 0,
  code: '',
  type: 'percentage',
  value: 0,
  minPurchase: 0,
  startDate: '',
  endDate: '',
  description: ''
})

// Promotion types
const promotionTypes = [
  { label: 'Percentage Discount', value: 'percentage' },
  { label: 'Fixed Amount Discount', value: 'fixed' }
]

// Validation rules
const rules = computed(() => {
  return {
    code: { required },
    value: { 
      required,
      minValue: promotion.type === 'percentage' ? minValue(1) : minValue(0.01),
      maxValue: promotion.type === 'percentage' ? maxValue(100) : maxValue(1000)
    },
    startDate: { required },
    endDate: { required }
  }
})

const v$ = useVuelidate(rules, promotion)

// Methods
const formatDate = (dateString: string) => {
  return format(new Date(dateString), 'MMM dd, yyyy')
}

const isActive = (promotion: any) => {
  const now = new Date()
  return new Date(promotion.startDate) <= now && new Date(promotion.endDate) >= now
}

const getStatus = (promotion: any) => {
  if (isActive(promotion)) {
    return 'Active'
  } else if (new Date(promotion.startDate) > new Date()) {
    return 'Scheduled'
  } else {
    return 'Expired'
  }
}

const openNewPromotionDialog = () => {
  // Set default dates
  const today = new Date()
  const nextMonth = new Date()
  nextMonth.setMonth(nextMonth.getMonth() + 1)
  
  // Reset form
  Object.assign(promotion, {
    id: 0,
    code: '',
    type: 'percentage',
    value: 0,
    minPurchase: 0,
    startDate: today.toISOString().split('T')[0],
    endDate: nextMonth.toISOString().split('T')[0],
    description: ''
  })
  
  editMode.value = false
  showPromotionDialog.value = true
}

const editPromotion = (data: any) => {
  // Map data to form model
  Object.assign(promotion, {
    id: data.id,
    code: data.code,
    type: data.type,
    value: data.value,
    minPurchase: data.minPurchase,
    startDate: new Date(data.startDate).toISOString().split('T')[0],
    endDate: new Date(data.endDate).toISOString().split('T')[0],
    description: data.description
  })
  
  editMode.value = true
  showPromotionDialog.value = true
}

const savePromotion = async () => {
  // Validate form
  const isValid = await v$.value.$validate()
  if (!isValid) return
  
  try {
    saving.value = true
    
    if (editMode.value) {
      await adminStore.updatePromotion(promotion)
      toast.add({
        severity: 'success',
        summary: t('toast.success'),
        detail: t('admin.promotions.updateSuccess'),
        life: 3000
      })
    } else {
      await adminStore.createPromotion(promotion)
      toast.add({
        severity: 'success',
        summary: t('toast.success'),
        detail: t('admin.promotions.createSuccess'),
        life: 3000
      })
    }
    
    showPromotionDialog.value = false
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: t('toast.error'),
      detail: t('admin.promotions.saveFailed'),
      life: 3000
    })
  } finally {
    saving.value = false
  }
}

const confirmDeletePromotion = (data: any) => {
  promotionToDelete.value = data
  showDeleteDialog.value = true
}

const deletePromotion = async () => {
  if (!promotionToDelete.value) return
  
  try {
    deleting.value = true
    await adminStore.deletePromotion(promotionToDelete.value.id)
    
    toast.add({
      severity: 'success',
      summary: t('toast.success'),
      detail: t('admin.promotions.deleteSuccess'),
      life: 3000
    })
    
    showDeleteDialog.value = false
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: t('toast.error'),
      detail: t('admin.promotions.deleteFailed'),
      life: 3000
    })
  } finally {
    deleting.value = false
  }
}

onMounted(async () => {
  try {
    await adminStore.fetchPromotions()
  } finally {
    loading.value = false
  }
})
</script>
