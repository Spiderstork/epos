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
      <q-input
        outlined
        v-model="name"
        label="Item Name"
        class="q-mt-md"
        :rules="[val => !!val || 'Required']"
      />

      <!-- Price / Cost / Stock -->
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
        <q-col>
          <q-input
            outlined
            v-model="costPerUnit"
            label="Cost per Unit"
            type="number"
            :rules="[val => !!val || 'Required']"
          />
        </q-col>
        <q-col>
          <q-input
            outlined
            v-model.number="initialStock"
            label="Initial Stock Quantity"
            type="number"
            :rules="[val => val > 0 || 'Must be greater than 0']"
          />
        </q-col>
      </q-row>

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
        class="q-mt-md"
      />

      <!-- Error -->
      <div v-if="serverError" class="text-negative q-mt-sm">
        {{ serverError }}
      </div>

      <!-- Save -->
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
import { ref, onMounted } from 'vue'
import axios from 'axios'

export default {
  setup() {
    const barcode_1     = ref('')
    const barcode_2     = ref('')
    const name          = ref('')
    const price_1       = ref('')
    const price_2       = ref('')
    const costPerUnit   = ref('')
    const initialStock  = ref('')
    const category      = ref('')

    const barcodeError  = ref(false)
    const priceError    = ref(false)
    const serverError   = ref('')
    const categoryOptions = ref([])

    onMounted(async () => {
      try {
        const res = await axios.get('http://localhost:3000/api/items')
        const items = res.data
        const uniqueCategories = [...new Set(
          items
            .map(i => i.category)
            .filter(cat => !!cat && cat.trim() !== '')
        )]
        categoryOptions.value = uniqueCategories.map(cat => ({
          label: cat,
          value: cat
        }))
      } catch (err) {
        console.error('Failed to load categories:', err)
      }
    })

    function addCategory(newCat) {
      const trimmed = newCat.trim()
      if (!trimmed) return
      if (!categoryOptions.value.find(c => c.value === trimmed)) {
        categoryOptions.value.push({ label: trimmed, value: trimmed })
      }
      category.value = trimmed
    }

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
        barcodes: [barcode_1.value.trim()], // array now
        price: parseFloat(price_1.value),
        cost_per_unit: parseFloat(costPerUnit.value),
        quantity_in_stock: parseInt(initialStock.value),
        category: category.value || null
      }

      try {
        await axios.post('http://localhost:3000/save-item', productData)
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
        if (err.response?.status === 400 && err.response.data?.error) {
          serverError.value = err.response.data.error
        } else {
          serverError.value = 'Error saving item.'
        }
      }
    }

    return {
      barcode_1,
      barcode_2,
      name,
      price_1,
      price_2,
      costPerUnit,
      initialStock,
      category,
      categoryOptions,
      barcodeError,
      priceError,
      serverError,
      validateForm,
      addCategory
    }
  }
}
</script>
