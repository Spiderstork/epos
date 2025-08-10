<template>
  <div class="q-pa-md" style="max-width: 600px; margin: auto;">
    <q-card class="q-pa-md">
      <q-card-section>
        <div class="text-h6">Add Stock</div>
      </q-card-section>

      <!-- Search or scan -->
      <q-select
        v-model="selectedSearch"
        use-input
        input-debounce="300"
        label="Scan barcode or search item name"
        outlined
        dense
        :options="searchOptions"
        @filter="filterFn"
        @update:model-value="handleSelection"
        emit-value
        map-options
        option-label="label"
        option-value="value"
        clearable
        class="q-mb-md"
      >
        <template v-slot:no-option>
          <q-item>
            <q-item-section>
              <q-item-label>No matching items</q-item-label>
            </q-item-section>
          </q-item>
        </template>
      </q-select>

      <!-- Item info -->
      <div v-if="selectedItem">
        <q-banner class="bg-grey-2 text-black q-mb-md">
          <div><strong>Item:</strong> {{ selectedItem.name }}</div>
          <div><strong>Product ID:</strong> {{ selectedItem.id }}</div>
          <div><strong>Scanned Barcode:</strong> {{ selectedBarcode }}</div>
          <div><strong>Current Stock:</strong> {{ selectedItem.quantity_in_stock }}</div>
        </q-banner>

        <!-- Stock quantity -->
        <q-input
          v-model.number="quantityToAdd"
          label="Stock to Add"
          type="number"
          outlined
          dense
          :rules="[val => val > 0 || 'Must be greater than 0']"
          class="q-mb-md"
        />

        <!-- Price -->
        <q-input
          v-model="pricePerUnit"
          label="Price per Unit"
          type="number"
          outlined
          dense
          :rules="[val => !!val || 'Required']"
          class="q-mb-md"
        />

        <q-btn label="Add Stock" color="primary" @click="submitStockUpdate" />
      </div>

      <!-- Feedback -->
      <q-banner
        v-if="feedback"
        :class="feedbackType === 'error' ? 'bg-red text-white' : 'bg-green text-white'"
        class="q-mt-md"
      >
        {{ feedback }}
      </q-banner>
    </q-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import axios from 'axios'

const allItems = ref([])
const searchOptions = ref([])
const selectedSearch = ref(null)
const selectedItem = ref(null)
const selectedBarcode = ref(null)
const quantityToAdd = ref(0)
const pricePerUnit = ref('')

const feedback = ref('')
const feedbackType = ref('')

async function loadItems() {
  try {
    const res = await axios.get('http://localhost:3000/api/items')
    allItems.value = res.data
  } catch {
    feedback.value = 'Failed to load item data.'
    feedbackType.value = 'error'
  }
}
loadItems()

function filterFn(val, update) {
  update(() => {
    const term = val.toLowerCase().trim()
    if (!term) {
      searchOptions.value = []
      return
    }

    // Find all matching items
    const matches = allItems.value.filter(item =>
      item.name.toLowerCase().includes(term) ||
      (item.barcodes || []).some(b => b.includes(term))
    )

    // Deduplicate by unique ID
    const uniqueMatches = []
    const seenIds = new Set()

    for (const item of matches) {
      if (!seenIds.has(item.id)) {
        seenIds.add(item.id)
        uniqueMatches.push(item)
      }
    }

    // Build dropdown options with *all* barcodes in value
    searchOptions.value = uniqueMatches.map(item => ({
      label: `${item.name}${item.barcodes?.length ? ` (${item.barcodes.join(', ')})` : ''}`,
      value: { product_id: item.id, barcode: item.barcodes || [] }
    }))
  })
}


function handleSelection({ product_id, barcode }) {
  const item = allItems.value.find(i => i.id === product_id)
  selectedItem.value = item || null
  selectedBarcode.value = barcode
}

async function submitStockUpdate() {
  const unitPrice = parseFloat(pricePerUnit.value)
  const quantity = quantityToAdd.value

  if (!selectedItem.value || quantity <= 0 || !Number.isInteger(quantity)) {
    feedback.value = 'Quantity must be a positive integer.'
    feedbackType.value = 'error'
    return
  }

  if (isNaN(unitPrice) || unitPrice <= 0 || !/^\d+(\.\d{1,2})?$/.test(pricePerUnit.value)) {
    feedback.value = 'Price per unit must be positive and have up to 2 decimal places.'
    feedbackType.value = 'error'
    return
  }

  try {
    await axios.post('http://localhost:3000/add_stock', {
      id: selectedItem.value.id,
      quantity_added: quantity,
      unit_price: unitPrice
    });

    feedback.value = `Successfully added ${quantity} to "${selectedItem.value.name}".`
    feedbackType.value = 'success'

    // Reset
    selectedSearch.value = null
    selectedItem.value = null
    selectedBarcode.value = null
    quantityToAdd.value = 0
    pricePerUnit.value = ''
    loadItems()
  } catch {
    feedback.value = 'Failed to update stock.'
    feedbackType.value = 'error'
  }
}
</script>
