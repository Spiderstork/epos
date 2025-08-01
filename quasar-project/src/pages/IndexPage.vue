<template>
  <q-drawer
    v-model="drawerstarter"
    bordered
    side="right"
  >
    <q-list>
      <EssentialLink
        v-for="link in rightlinksList"
        :key="link.title"
        v-bind="link"
        @click="openSubDrawer(link)"
      />
    </q-list>
  </q-drawer>

  <!-- Sub Drawer for Category Content -->
  <q-drawer
    v-model="isSubDrawerOpen"
    side="right"
    overlay
    bordered
  >
  <q-toolbar>
  <q-btn flat icon="arrow_back" @click="isSubDrawerOpen = false" />
  <q-toolbar-title>{{ selectedCategory?.title }}</q-toolbar-title>
</q-toolbar>
    <q-list>
      <q-item
        v-for="item in categoryItems"
        :key="item.barcode"
        clickable
        @click="addItemFromCategory(item)"
      >
        <q-item-section>{{ item.name }}</q-item-section>
        <q-item-section side>£{{ item.price }}</q-item-section>
      </q-item>
    </q-list>
  </q-drawer>

  <div class="q-pa-md q-gutter-sm" style="padding-bottom: 60px;">
    <!-- barcode input -->
    <input
      ref="barcodeInputRef"
      v-model="barcodeInput"
      @keyup.enter="addItemByBarcode"
      style="opacity: 0; width: 1px; height: 1px; position: absolute;"
      autocomplete="off"
      autocorrect="off"
      autocapitalize="off"
      spellcheck="false"
    />

    <!-- List of Items -->
    <q-bar v-for="(item, index) in items_selling" :key="index">
      <div>£{{ item.price }}</div>
      <q-space />
      <div>{{ item.name }}</div>
      <q-btn
        dense
        flat
        color="negative"
        icon="delete"
        @click="removeItem(index)"
        style="margin-left: 10px;"
        aria-label="Delete item"
      />
    </q-bar>

    <!-- Sticky Total Bar -->
    <q-bar class="bg-grey-3 text-weight-bold">
      <div>£{{ total }}</div>
      <q-space />
      <div>Total</div>
      <q-btn 
        dense
        flat
        color="negative"
        icon="delete"
        @click="clearItems()"
        style="margin-left: 10px;"
        aria-label="Delete item">
      </q-btn>
    </q-bar>
  </div>
</template>


<script setup>
import { ref, computed, onMounted } from 'vue'
import EssentialLink from 'components/EssentialLink.vue'
import axios from 'axios'

const items = ref([])

onMounted(async () => {
  const response = await axios.get('http://localhost:3000/api/items')
  items.value = response.data
})

/* -----------------------------
   State: Refs and Reactive Data
----------------------------- */
const barcodeInput = ref('')
const barcodeInputRef = ref(null)
const items_selling = ref([])
const selectedCategory = ref(null)
const isSubDrawerOpen = ref(false)
const drawerstarter = ref(false)

/* -----------------------------
   Computed Properties
----------------------------- */
const total = computed(() =>
  items_selling.value.reduce((sum, item) => sum + item.price, 0)
)

const categoryItems = computed(() => {
  if (!selectedCategory.value) return []
  return items.value.filter(i => i.category === selectedCategory.value.title)
})

/* -----------------------------
   Methods: Item Handling
----------------------------- */
function addItemByBarcode() {
  const code = barcodeInput.value.trim()
  if (!code) return

  const found = items.value.find(i => i.barcode === code)
  if (found) {
    items_selling.value.push({ ...found })
  } else {
    alert('Item not found for barcode: ' + code)
  }

  barcodeInput.value = ''
  barcodeInputRef.value.focus()
}

function addItemFromCategory(item) {
  items_selling.value.push({ ...item })
}

function removeItem(index) {
  items_selling.value.splice(index, 1)
}

function clearItems() {
  items_selling.value = []
  barcodeInputRef.value.focus()
}

/* -----------------------------
   Drawer and Category Handling
----------------------------- */
function openSubDrawer(link) {
  selectedCategory.value = link
  isSubDrawerOpen.value = true
}

const rightlinksList = [
  { title: 'Alcohol', icon: 'local_bar', link: '/' },
  { title: 'Cafe', icon: 'local_cafe', link: '/' },
  { title: 'Food', icon: 'restaurant', link: '/' },
  { title: 'Camp', icon: 'park', link: '/' } 
]

/* -----------------------------
   Lifecycle Hooks
----------------------------- */
onMounted(() => {
  const focusInput = () => barcodeInputRef.value?.focus()

  focusInput()
  barcodeInputRef.value?.addEventListener('blur', () => {
    setTimeout(focusInput, 0)
  })

  // Open drawer shortly after mount
  setTimeout(() => {
    drawerstarter.value = true
  }, 1)
})
</script>
