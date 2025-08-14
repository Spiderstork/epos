<template>
  <div class="q-pa-md">
    <div style="max-width: 500px; margin: auto;">
      <!-- Barcode -->
      <q-input
        outlined
        v-model="barcode_1"
        label="Barcode"
        :error="barcodeError"
        :rules="[val => !!val || 'Required']"
        class="q-mb-md"
      />
      <q-input
        outlined
        v-model="barcode_2"
        label="Check Barcode"
        :error="barcodeError"
        :rules="[val => !!val || 'Required']"
        class="q-mb-md"
      />

      <!-- Item Name -->
      <q-input
        outlined
        v-model="name"
        label="Item Name"
        :rules="[val => !!val || 'Required']"
        class="q-mb-md"
      />

      <!-- Price / Cost / Stock -->
      <q-input
        outlined
        v-model="price_1"
        label="Price"
        type="number"
        :error="priceError"
        :rules="[val => !!val || 'Required']"
        class="q-mb-md"
      />
      <q-input
        outlined
        v-model="price_2"
        label="Check Price"
        type="number"
        :error="priceError"
        :rules="[val => !!val || 'Required']"
        class="q-mb-md"
      />
      <q-input
        outlined
        v-model="costPerUnit"
        label="Cost per Unit"
        type="number"
        :rules="[val => !!val || 'Required']"
        class="q-mb-md"
      />
      <q-input
        outlined
        v-model.number="initialStock"
        label="Initial Stock Quantity"
        type="number"
        :rules="[val => val > 0 || 'Must be greater than 0']"
        class="q-mb-md"
      />

      <!-- Category -->
      <q-select
        outlined
        v-model="category"
        :options="categoryOptions"
        label="Category"
        emit-value
        map-options
        use-input
        new-value-mode="add"
        @new-value="addCategory"
        class="q-mb-md"
      />

      <!-- Error -->
      <div v-if="serverError" class="text-negative q-mb-md">
        {{ serverError }}
      </div>

      <!-- Save -->
      <q-btn
        label="Validate"
        color="primary"
        @click="validateForm"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { api } from 'src/boot/axios'

// Refs
const barcode_1 = ref('')
const barcode_2 = ref('')
const name = ref('')
const price_1 = ref('')
const price_2 = ref('')
const costPerUnit = ref('')
const initialStock = ref('')
const category = ref('')

const barcodeError = ref(false)
const priceError = ref(false)
const serverError = ref('')
const categoryOptions = ref([])

// Load existing categories on mount
onMounted(async () => {
  try {
    const res = await api.get('/api/items')
    const items = res.data
    const uniqueCategories = [...new Set(
      items
        .map(i => i.category)
        .filter(cat => !!cat && cat.trim() !== '')
    )]
    categoryOptions.value = uniqueCategories.map(cat => ({ label: cat, value: cat }))
  } catch (err) {
    console.error('Failed to load categories:', err)
  }
})

// Add new category
function addCategory(newCat) {
  const trimmed = newCat.trim()
  if (!trimmed) return
  if (!categoryOptions.value.find(c => c.value === trimmed)) {
    categoryOptions.value.push({ label: trimmed, value: trimmed })
  }
  category.value = trimmed
}

// Validate and submit form
async function validateForm() {
  barcodeError.value = barcode_1.value !== barcode_2.value
  priceError.value = price_1.value !== price_2.value

  const isValid =
    !barcodeError.value &&
    !priceError.value &&
    name.value.trim() &&
    parseFloat(price_1.value) > 0 &&
    parseFloat(costPerUnit.value) > 0 &&
    parseInt(initialStock.value) > 0

  if (!isValid) return

  const productData = {
    name: name.value.trim(),
    barcodes: [barcode_1.value.trim()],
    price: parseFloat(price_1.value),
    cost_per_unit: parseFloat(costPerUnit.value),
    quantity_in_stock: parseInt(initialStock.value),
    category: category.value || null
  }

  try {
    await api.post('/save-item', productData)

    // Reset fields
    barcode_1.value = ''
    barcode_2.value = ''
    name.value = ''
    price_1.value = ''
    price_2.value = ''
    costPerUnit.value = ''
    initialStock.value = ''
    category.value = ''
    serverError.value = ''
  } catch (err) {
    if (err.response?.status === 400 && err.response.data?.error) {
      serverError.value = err.response.data.error
    } else {
      serverError.value = 'Error saving item.'
    }
  }
}
</script>
