<template>
    <div class="q-pa-md">
      <div style="max-width: 500px;">
        <!-- Barcode Row -->
        <q-row class="q-gutter-md">
          <q-col>
            <q-input
              outlined
              v-model="barcode_1"
              label="Barcode"
              :error="barcodeError"
              :rules="[val => !!val || 'Required']"
            />
          </q-col>
          <q-col>
            <q-input
              outlined
              v-model="barcode_2"
              label="Check Barcode"
              :error="barcodeError"
              :rules="[val => !!val || 'Required']"
            />
          </q-col>
        </q-row>
  
        <!-- Item Name -->
        <q-row class="q-gutter-md">
          <q-col>
            <q-input
              outlined
              v-model="name"
              label="Item Name"
              :rules="[val => !!val || 'Required']"
            />
          </q-col>
        </q-row>
  
        <!-- Price Row -->
        <q-row class="q-gutter-md q-mt-md">
          <q-col>
            <q-input
              outlined
              v-model="price_1"
              label="Price"
              type="number"
              :error="priceError"
              :rules="[val => !!val || 'Required']"
            />
          </q-col>
          <q-col>
            <q-input
              outlined
              v-model="price_2"
              label="Check Price"
              type="number"
              :error="priceError"
              :rules="[val => !!val || 'Required']"
            />
          </q-col>

          <!-- Cost Per Unit -->
          <q-col>
            <q-input
              outlined
              v-model="costPerUnit"
              label="Cost per Unit"
              type="number"
              :rules="[val => !!val || 'Required']"
            />
          </q-col>
          <!-- stock -->
           <q-col>
            <q-input
              outlined
              v-model.number="initialStock"
              label="Initial Stock Quantity"
              type="number"
              :rules="[val => val > 0 || 'Stock cannot be less then 1']"
            />
          </q-col>
        </q-row>

        

        <!-- Category -->
        <q-row class="q-gutter-md q-mt-md">
          <q-col>
            <q-select
              outlined
              v-model="category"
              :options="categoryOptions"
              label="Category"
              emit-value
              map-options
            />
          </q-col>
        </q-row>
        
        <div v-if="serverError" class="text-negative q-mt-sm">
          {{ serverError }}
        </div>
        <!-- Validate & Save Button -->
        <q-btn
          label="Validate"
          color="primary"
          class="q-mt-md"
          @click="validateForm"
        />
      </div>
    </div>
  </template>
  
<script>
import { ref } from 'vue'
import axios from 'axios'

export default {
  setup() {
    /* -----------------------------
       Form State
    ----------------------------- */
    const barcode_1     = ref('')
    const barcode_2     = ref('')
    const name          = ref('')
    const price_1       = ref('')
    const price_2       = ref('')
    const costPerUnit   = ref('')
    const initialStock  = ref('')
    const category      = ref('')

    /* -----------------------------
       Validation State
    ----------------------------- */
    const barcodeError  = ref(false)
    const priceError    = ref(false)
    const serverError   = ref('')

    /* -----------------------------
       Category Options
    ----------------------------- */
    const categoryOptions = [
      { label: 'Alcohol', value: 'Alcohol' },
      { label: 'Cafe',    value: 'Cafe' },
      { label: 'Camp',    value: 'Camp' },
      { label: 'Food',    value: 'Food' }
    ]

    /* -----------------------------
       Form Submission
    ----------------------------- */
    async function validateForm() {
  // Check if barcode and price match
  barcodeError.value = barcode_1.value !== barcode_2.value
  priceError.value = price_1.value !== price_2.value

  const isValid =
    !barcodeError.value &&
    !priceError.value &&
    name.value.trim() &&
    !isNaN(parseFloat(price_1.value)) &&
    !isNaN(parseFloat(costPerUnit.value)) &&
    parseFloat(costPerUnit.value) > 0 &&
    parseInt(initialStock.value) > 0

  if (!isValid) return

  const itemData = {
    barcode: barcode_1.value.trim(),
    name: name.value.trim(),
    price: parseFloat(price_1.value),
    quantity_in_stock: parseInt(initialStock.value),
    cost_per_unit: parseFloat(costPerUnit.value),
    category: category.value || null
  }

  try {
    await axios.post('http://localhost:3000/save-item', itemData)
    console.log('Item saved successfully.')

    // Clear form and error message
    barcode_1.value = ''
    barcode_2.value = ''
    name.value = ''
    price_1.value = ''
    price_2.value = ''
    initialStock.value = ''
    costPerUnit.value = ''
    category.value = ''
    serverError.value = ''
  } catch (err) {
    if (err.response && err.response.status === 400 && err.response.data.error) {
      serverError.value = `${err.response.data.error}`
    } else {
      serverError.value = 'Error saving item.'
    }
  }
}


    /* -----------------------------
       Return to Template
    ----------------------------- */
    return {
      barcode_1,
      barcode_2,
      name,
      price_1,
      price_2,
      initialStock,
      costPerUnit,
      category,
      categoryOptions,
      barcodeError,
      priceError,
      serverError,
      validateForm
    }
  }
}
</script>

  