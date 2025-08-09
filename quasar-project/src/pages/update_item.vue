<template>
  <div class="q-pa-md" style="max-width: 700px; margin: auto;">
    <q-card class="q-pa-md">
      <q-card-section>
        <div class="text-h6">Edit Item</div>
      </q-card-section>

      <!-- Search or scan -->
      <q-select
        v-model="selectedSearch"
        use-input
        input-debounce="300"
        label="Search item name or barcode"
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

      <div v-if="selectedItem">
        <q-banner class="bg-grey-2 text-black q-mb-md">
          <div><strong>Selected Item:</strong> {{ selectedItem.name }}</div>
          <div><strong>Barcodes:</strong> {{ selectedItem.barcodes.join(', ') }}</div>
          <div><strong>Price:</strong> {{ selectedItem.price }}</div>
          <div><strong>Quantity in Stock:</strong> {{ selectedItem.quantity_in_stock }}</div>
          <div><strong>Category:</strong> {{ selectedItem.category || '(none)' }}</div>
        </q-banner>

        <!-- Editable Fields -->

        <!-- Name -->
        <q-input
          v-model="newName"
          label="New Name"
          outlined
          dense
          class="q-mb-md"
          clearable
        />
        <q-input
          v-if="newName && newName !== selectedItem.name"
          v-model="confirmName"
          label="Confirm Current Name"
          outlined
          dense
          :rules="[val => val === selectedItem.name || 'Must match current name']"
          class="q-mb-md"
          clearable
        />

        <!-- Price -->
        <q-input
          v-model="newPrice"
          label="New Price"
          type="number"
          outlined
          dense
          class="q-mb-md"
          clearable
        />
        <q-input
          v-if="newPrice && parseFloat(newPrice) !== selectedItem.price"
          v-model="confirmPrice"
          label="Confirm Current Price"
          outlined
          dense
          :rules="[val => parseFloat(val) === selectedItem.price || 'Must match current price']"
          class="q-mb-md"
          clearable
        />

        <!-- Quantity -->
        <q-input
          v-model="newQuantity"
          label="New Quantity"
          type="number"
          outlined
          dense
          class="q-mb-md"
          clearable
        />
        <q-input
          v-if="newQuantity && parseInt(newQuantity) !== selectedItem.quantity_in_stock"
          v-model="confirmQuantity"
          label="Confirm Current Quantity"
          outlined
          dense
          :rules="[val => parseInt(val) === selectedItem.quantity_in_stock || 'Must match current quantity']"
          class="q-mb-md"
          clearable
        />

        <!-- Category -->
        <q-input
          v-model="newCategory"
          label="New Category"
          outlined
          dense
          class="q-mb-md"
          clearable
        />
        <q-input
          v-if="newCategory && newCategory !== (selectedItem.category || '')"
          v-model="confirmCategory"
          label="Confirm Current Category"
          outlined
          dense
          :rules="[val => val === (selectedItem.category || '') || 'Must match current category']"
          class="q-mb-md"
          clearable
        />

        <!-- Barcodes -->
        <q-input
          v-model="barcodeToAdd"
          label="Add Barcode"
          outlined
          dense
          class="q-mb-md"
          clearable
        />
        <q-input
          v-if="barcodeToAdd"
          v-model="confirmBarcodesForAdd"
          label="Confirm Current Barcodes (comma-separated)"
          outlined
          dense
          :rules="[val => val.trim() === selectedItem.barcodes.join(', ') || 'Must match current barcodes']"
          class="q-mb-md"
          clearable
        />

        <q-input
          v-model="barcodeToRemove"
          label="Remove Barcode"
          outlined
          dense
          class="q-mb-md"
          clearable
        />
        <q-input
          v-if="barcodeToRemove"
          v-model="confirmBarcodesForRemove"
          label="Confirm Current Barcodes (comma-separated)"
          outlined
          dense
          :rules="[val => val.trim() === selectedItem.barcodes.join(', ') || 'Must match current barcodes']"
          class="q-mb-md"
          clearable
        />

        <q-btn
          label="Update Item"
          color="primary"
          :disable="!isConfirmed || !hasChanges"
          @click="submitUpdate"
          class="q-mt-md"
        />

        <q-banner
          v-if="feedback"
          :class="feedbackType === 'error' ? 'bg-red text-white' : 'bg-green text-white'"
          class="q-mt-md"
        >
          {{ feedback }}
        </q-banner>
      </div>
    </q-card>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import axios from 'axios'

const allItems = ref([])
const searchOptions = ref([])
const selectedSearch = ref(null)
const selectedItem = ref(null)

// Editable fields
const newName = ref('')
const confirmName = ref('')

const newPrice = ref('')
const confirmPrice = ref('')

const newQuantity = ref('')
const confirmQuantity = ref('')

const newCategory = ref('')
const confirmCategory = ref('')

// Barcodes add/remove
const barcodeToAdd = ref('')
const confirmBarcodesForAdd = ref('')

const barcodeToRemove = ref('')
const confirmBarcodesForRemove = ref('')

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

    // Find matches by name or barcode
    const matches = allItems.value.filter(item =>
      item.name.toLowerCase().includes(term) ||
      (item.barcodes || []).some(b => b.includes(term))
    )

    // Deduplicate by id
    const uniqueMatches = []
    const seen = new Set()
    for (const item of matches) {
      if (!seen.has(item.id)) {
        seen.add(item.id)
        uniqueMatches.push(item)
      }
    }

    searchOptions.value = uniqueMatches.map(item => ({
      label: `${item.name}${item.barcodes?.length ? ` (${item.barcodes.join(', ')})` : ''}`,
      value: { product_id: item.id, barcode: item.barcodes || [] }
    }))
  })
}

function handleSelection(val) {
  if (!val) {
    selectedItem.value = null
    resetForm()
    return
  }
  const item = allItems.value.find(i => i.id === val.product_id)
  selectedItem.value = item || null
  resetForm()
}

function resetForm() {
  newName.value = ''
  confirmName.value = ''
  newPrice.value = ''
  confirmPrice.value = ''
  newQuantity.value = ''
  confirmQuantity.value = ''
  newCategory.value = ''
  confirmCategory.value = ''
  barcodeToAdd.value = ''
  confirmBarcodesForAdd.value = ''
  barcodeToRemove.value = ''
  confirmBarcodesForRemove.value = ''
}

const hasChanges = computed(() => {
  if (!selectedItem.value) return false
  return (
    (newName.value && newName.value !== selectedItem.value.name) ||
    (newPrice.value && parseFloat(newPrice.value) !== selectedItem.value.price) ||
    (newQuantity.value && parseInt(newQuantity.value) !== selectedItem.value.quantity_in_stock) ||
    (newCategory.value && newCategory.value !== (selectedItem.value.category || '')) ||
    (barcodeToAdd.value && barcodeToAdd.value.trim() !== '') ||
    (barcodeToRemove.value && barcodeToRemove.value.trim() !== '')
  )
})

const isConfirmed = computed(() => {
  if (!selectedItem.value) return false
  if (newName.value && newName.value !== selectedItem.value.name) {
    if (confirmName.value !== selectedItem.value.name) return false
  }
  if (newPrice.value && parseFloat(newPrice.value) !== selectedItem.value.price) {
    if (parseFloat(confirmPrice.value) !== selectedItem.value.price) return false
  }
  if (newQuantity.value && parseInt(newQuantity.value) !== selectedItem.value.quantity_in_stock) {
    if (parseInt(confirmQuantity.value) !== selectedItem.value.quantity_in_stock) return false
  }
  if (newCategory.value && newCategory.value !== (selectedItem.value.category || '')) {
    if (confirmCategory.value !== (selectedItem.value.category || '')) return false
  }
  if (barcodeToAdd.value && barcodeToAdd.value.trim() !== '') {
    if (confirmBarcodesForAdd.value.trim() !== selectedItem.value.barcodes.join(', ')) return false
  }
  if (barcodeToRemove.value && barcodeToRemove.value.trim() !== '') {
    if (confirmBarcodesForRemove.value.trim() !== selectedItem.value.barcodes.join(', ')) return false
  }
  return true
})

async function submitUpdate() {
  if (!selectedItem.value) return

  // Validate add/remove barcodes more carefully here:
  // - Only allow adding one barcode at a time
  // - Only allow removing one barcode at a time and that barcode exists in current barcodes

  const payload = { id: selectedItem.value.id }

  if (newName.value && newName.value !== selectedItem.value.name) {
    payload.name = newName.value
  }
  if (newPrice.value && parseFloat(newPrice.value) !== selectedItem.value.price) {
    payload.price = parseFloat(newPrice.value)
  }
  if (newQuantity.value && parseInt(newQuantity.value) !== selectedItem.value.quantity_in_stock) {
    payload.quantity_in_stock = parseInt(newQuantity.value)
  }
  if (newCategory.value && newCategory.value !== (selectedItem.value.category || '')) {
    payload.category = newCategory.value
  }

  if (barcodeToAdd.value && barcodeToAdd.value.trim() !== '') {
    const barcodeToAddTrimmed = barcodeToAdd.value.trim()
    if (selectedItem.value.barcodes.includes(barcodeToAddTrimmed)) {
      feedback.value = 'Barcode to add already exists.'
      feedbackType.value = 'error'
      return
    }
    payload.barcodes = [...selectedItem.value.barcodes, barcodeToAddTrimmed]
  }

  if (barcodeToRemove.value && barcodeToRemove.value.trim() !== '') {
    const barcodeToRemoveTrimmed = barcodeToRemove.value.trim()
    if (!selectedItem.value.barcodes.includes(barcodeToRemoveTrimmed)) {
      feedback.value = 'Barcode to remove does not exist.'
      feedbackType.value = 'error'
      return
    }
    payload.barcodes = selectedItem.value.barcodes.filter(b => b !== barcodeToRemoveTrimmed)
  }

  try {
    await axios.post('http://localhost:3000/update_item', payload)
    feedback.value = 'Item updated successfully.'
    feedbackType.value = 'success'
    // Reset form after success
    resetForm()
    selectedSearch.value = null
    selectedItem.value = null
    loadItems()
  } catch {
    feedback.value = 'Failed to update item.'
    feedbackType.value = 'error'
  }
}
</script>
