<template>
  <!-- Main Category Drawer -->
  <q-drawer v-model="drawerstarter" bordered side="right">
    <q-list>
      <EssentialLink
        v-for="link in rightlinksList"
        :key="link.title"
        v-bind="link"
        @click="openSubDrawer(link)"
      />
    </q-list>
  </q-drawer>

  <!-- Sub Drawer for Category Items -->
  <q-drawer v-model="isSubDrawerOpen" side="right" overlay bordered>
    <q-toolbar>
      <q-btn flat icon="arrow_back" @click="isSubDrawerOpen = false" />
      <q-toolbar-title>{{ selectedCategory?.title }}</q-toolbar-title>
    </q-toolbar>
    <q-list>
      <q-item
        v-for="item in categoryItems"
        :key="item.id"
        clickable
        @click="addItemFromCategory(item)"
      >
        <q-item-section>{{ item.name }}</q-item-section>
        <q-item-section side>£{{ item.price }}</q-item-section>
      </q-item>
    </q-list>
  </q-drawer>

  <!-- Main Content -->
  <div class="q-pa-md q-gutter-sm" style="padding-bottom: 60px;">
    <!-- Hidden Barcode Input -->
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

    <!-- Cart Items List -->
    <div class="dynamic-container q-pa-md q-gutter-sm">
      <div class="scroll-area">
        <q-bar v-for="(item, index) in items_selling" :key="item.id">
          <div>{{ item.name }} <small>(x{{ item.quantity }})</small></div>
          <q-space />
          <div>£{{ (item.quantity * item.unit_price).toFixed(2) }}</div>
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
      </div>

      <!-- Total Bar -->
      <q-bar class="bg-grey-3 text-weight-bold q-mt-md">
        <div>£{{ total }}</div>
        <q-space />
        <div>Total</div>
        <q-btn
          dense
          flat
          color="negative"
          icon="delete"
          @click="clearItems"
          style="margin-left: 10px;"
          aria-label="Clear cart"
        />
        <q-btn
          dense
          size="md"
          color="primary"
          label="Pay"
          @click="goToPaymentPage"
          style="margin-left: 10px;"
        />
      </q-bar>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useCartStore } from 'stores/cart'
import EssentialLink from 'components/EssentialLink.vue'
import axios from 'axios'
import { useRouter } from 'vue-router'

const router = useRouter()
const cart = useCartStore()
const items = ref([])

onMounted(async () => {
  const response = await axios.get('http://localhost:3000/api/items')
  items.value = response.data
})

/* -----------------------------
   State
----------------------------- */
const barcodeInput = ref('')
const barcodeInputRef = ref(null)
const selectedCategory = ref(null)
const isSubDrawerOpen = ref(false)
const drawerstarter = ref(false)

/* -----------------------------
   Computed
----------------------------- */
const items_selling = computed(() => cart.items)
const total = computed(() => cart.total)

const categoryItems = computed(() => {
  if (!selectedCategory.value) return []
  return items.value.filter(item => item.category === selectedCategory.value.title)
})

const uniqueCategories = computed(() => {
  const cats = items.value
    .map(item => item.category)
    .filter(cat => cat && typeof cat === 'string' && cat.trim() !== '')
  return [...new Set(cats)]
})

const categoryIconMap = {
  Bar: 'local_bar',
  Cafe: 'local_cafe',
  Food: 'restaurant',
  Camp: 'park'
}

const rightlinksList = computed(() =>
  uniqueCategories.value.map(cat => ({
    title: cat,
    icon: categoryIconMap[cat] || 'label',
    link: '/'
  }))
)

/* -----------------------------
   Methods
----------------------------- */
function addItemByBarcode() {
  const code = barcodeInput.value.trim()
  if (!code) return

  const found = items.value.find(item =>
    Array.isArray(item.barcodes) && item.barcodes.includes(code)
  )
  if (found) {
    cart.addItem(found, code) // pass scanned barcode to cart
  } else {
    alert('Item not found for barcode: ' + code)
  }

  barcodeInput.value = ''
  barcodeInputRef.value.focus()
}

function addItemFromCategory(item) {
  cart.addItem(item, item.barcodes?.[0] ?? null)
}

function removeItem(index) {
  cart.removeItem(index)
}

function clearItems() {
  cart.clear()
  barcodeInputRef.value.focus()
}

function openSubDrawer(link) {
  selectedCategory.value = link
  isSubDrawerOpen.value = true
}

function goToPaymentPage() {
  router.push({ path: '/payment' })
}

/* -----------------------------
   Lifecycle
----------------------------- */
onMounted(() => {
  const focusInput = () => barcodeInputRef.value?.focus()

  focusInput()
  barcodeInputRef.value?.addEventListener('blur', () => {
    setTimeout(focusInput, 0)
  })

  setTimeout(() => {
    drawerstarter.value = true
  }, 1)
})
</script>
