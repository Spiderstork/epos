<template>
  <q-page class="q-pa-md">
    <q-toolbar class="bg-primary text-white q-mb-md">
      <q-toolbar-title>Dashboard</q-toolbar-title>
    </q-toolbar>

    <q-inner-loading :showing="loading" color="primary" />

    <div v-if="error" class="q-mb-md text-negative">
      <q-icon name="error" /> {{ error }}
    </div>

    <div v-if="!loading && !error">
      <div class="row q-col-gutter-md">
        <!-- Inventory Overview -->
        <q-card class="col-12 col-md-4 q-mb-md">
          <q-card-section>
            <div class="text-h6">Inventory Overview</div>
            <q-list dense>
              <q-item>
                <q-item-section>Total unique items</q-item-section>
                <q-item-section side>{{ inventoryStats.totalItems }}</q-item-section>
              </q-item>
              <q-item>
                <q-item-section>Total stock quantity</q-item-section>
                <q-item-section side>{{ inventoryStats.totalStock }}</q-item-section>
              </q-item>
              <q-item>
                <q-item-section>Stock value (sale price)</q-item-section>
                <q-item-section side>£{{ inventoryStats.stockValueSale.toFixed(2) }}</q-item-section>
              </q-item>
              <q-item>
                <q-item-section>Stock value (cost price)</q-item-section>
                <q-item-section side>£{{ inventoryStats.stockValueCost.toFixed(2) }}</q-item-section>
              </q-item>
              <q-item>
                <q-item-section>Low stock items (&lt; {{ lowStockThreshold }})</q-item-section>
                <q-item-section side>{{ inventoryStats.lowStock.length }}</q-item-section>
              </q-item>
              <q-item>
                <q-item-section>Out of stock items</q-item-section>
                <q-item-section side>{{ inventoryStats.outOfStock.length }}</q-item-section>
              </q-item>
            </q-list>
          </q-card-section>
        </q-card>

        <!-- Recently Added Items -->
        <q-card class="col-12 col-md-4 q-mb-md">
          <q-card-section>
            <div class="text-h6">Recently Added Items</div>
            <q-list dense>
              <q-item v-for="item in inventoryStats.recentItems" :key="item.id">
                <q-item-section>{{ item.name }}</q-item-section>
                <q-item-section side>{{ formatDate(item.createdAt) }}</q-item-section>
              </q-item>
              <q-item v-if="inventoryStats.recentItems.length === 0">
                <q-item-section>No recent items</q-item-section>
              </q-item>
            </q-list>
          </q-card-section>
        </q-card>

        <!-- Inventory by Category Pie Chart -->
        <q-card class="col-12 col-md-4 q-mb-md">
          <q-card-section>
            <div class="text-h6">Inventory by Category</div>
            <canvas ref="categoryPie"></canvas>
          </q-card-section>
        </q-card>
      </div>

      <!-- Payment Type Pie Chart -->
      <div class="row q-col-gutter-md">
        <q-card class="col-12 col-md-4 q-mb-md">
          <q-card-section>
            <div class="text-h6">Sales by Payment Type</div>
            <canvas ref="paymentPie"></canvas>
          </q-card-section>
        </q-card>
      </div>

      <!-- Per-Item Financials -->
      <q-card class="q-mb-md">
        <q-card-section>
          <div class="text-h6">Per-Item Financials</div>
          <q-table
            :rows="itemFinancials"
            :columns="itemFinancialColumns"
            row-key="id"
            dense
            flat
            :pagination="{rowsPerPage: 5}"
          />
        </q-card-section>
      </q-card>

      <div class="row q-col-gutter-md">
        <!-- Sales Summary -->
        <q-card class="col-12 col-md-6 q-mb-md">
          <q-card-section>
            <div class="text-h6">Sales Summary</div>
            <q-list dense>
              <q-item>
                <q-item-section>Total revenue</q-item-section>
                <q-item-section side>£{{ salesStats.totalRevenue.toFixed(2) }}</q-item-section>
              </q-item>
              <q-item>
                <q-item-section>Number of sales</q-item-section>
                <q-item-section side>{{ salesStats.numSales }}</q-item-section>
              </q-item>
              <q-item>
                <q-item-section>Average sale value</q-item-section>
                <q-item-section side>£{{ salesStats.avgSaleValue.toFixed(2) }}</q-item-section>
              </q-item>
              <q-item>
                <q-item-section>Top-selling item (units)</q-item-section>
                <q-item-section side>{{ salesStats.topSellingUnits?.name || '-' }}</q-item-section>
              </q-item>
              <q-item>
                <q-item-section>Top-selling item (revenue)</q-item-section>
                <q-item-section side>{{ salesStats.topSellingRevenue?.name || '-' }}</q-item-section>
              </q-item>
            </q-list>
          </q-card-section>
        </q-card>

        <!-- Purchase Summary -->
        <q-card class="col-12 col-md-6 q-mb-md">
          <q-card-section>
            <div class="text-h6">Purchase Summary</div>
            <q-list dense>
              <q-item>
                <q-item-section>Total spent on stock</q-item-section>
                <q-item-section side>£{{ purchaseStats.totalSpent.toFixed(2) }}</q-item-section>
              </q-item>
              <q-item>
                <q-item-section>Number of purchase events</q-item-section>
                <q-item-section side>{{ purchaseStats.numPurchases }}</q-item-section>
              </q-item>
              <q-item>
                <q-item-section>Recent purchases</q-item-section>
                <q-item-section side>
                  <q-btn flat dense icon="list" @click="showRecentPurchases = true" />
                </q-item-section>
              </q-item>
            </q-list>
          </q-card-section>
        </q-card>
      </div>

      <!-- Alerts & Notifications -->
      <q-card class="q-mb-md">
        <q-card-section>
          <div class="text-h6">Alerts & Notifications</div>
          <q-list dense>
            <q-item v-for="alert in alerts" :key="alert" class="text-negative">
              <q-item-section>{{ alert }}</q-item-section>
            </q-item>
            <q-item v-if="alerts.length === 0">
              <q-item-section>No alerts</q-item-section>
            </q-item>
          </q-list>
        </q-card-section>
      </q-card>

      <!-- Recent Purchases Dialog -->
      <q-dialog v-model="showRecentPurchases">
        <q-card>
          <q-card-section>
            <div class="text-h6">Recent Purchases</div>
            <q-list dense>
              <q-item v-for="p in purchaseStats.recentPurchases" :key="p.purchaseDate + p.name">
                <q-item-section>{{ p.name }}</q-item-section>
                <q-item-section side>{{ p.quantity }} @ £{{ p.unit_price }}</q-item-section>
                <q-item-section side>{{ formatDate(p.purchaseDate) }}</q-item-section>
              </q-item>
              <q-item v-if="purchaseStats.recentPurchases.length === 0">
                <q-item-section>No recent purchases</q-item-section>
              </q-item>
            </q-list>
          </q-card-section>
          <q-card-actions align="right">
            <q-btn flat label="Close" v-close-popup />
          </q-card-actions>
        </q-card>
      </q-dialog>
    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import Chart from 'chart.js/auto'

const lowStockThreshold = 5

const loading = ref(true)
const error = ref(null)

const items = ref([])
const purchases = ref([])
const sales = ref([])

const inventoryStats = ref({
  totalItems: 0,
  totalStock: 0,
  stockValueSale: 0,
  stockValueCost: 0,
  lowStock: [],
  outOfStock: [],
  recentItems: [],
  categoryData: {}
})
const itemFinancials = ref([])
const itemFinancialColumns = [
  { name: 'name', label: 'Item', field: 'name', align: 'left' },
  { name: 'unitsPurchased', label: 'Units Purchased', field: 'unitsPurchased', align: 'right' },
  { name: 'totalPurchaseCost', label: 'Total Purchase Cost', field: 'totalPurchaseCost', align: 'right', format: val => `£${val.toFixed(2)}` },
  { name: 'unitsSold', label: 'Units Sold', field: 'unitsSold', align: 'right' },
  { name: 'totalSalesRevenue', label: 'Total Sales Revenue', field: 'totalSalesRevenue', align: 'right', format: val => `£${val.toFixed(2)}` },
  { name: 'grossProfit', label: 'Gross Profit', field: 'grossProfit', align: 'right', format: val => `£${val.toFixed(2)}` },
  { name: 'profitMargin', label: 'Profit Margin (%)', field: 'profitMargin', align: 'right', format: val => `${val.toFixed(1)}%` },
  { name: 'quantity_in_stock', label: 'Current Stock', field: 'quantity_in_stock', align: 'right' },
  { name: 'avgPurchaseCost', label: 'Avg Purchase Cost', field: 'avgPurchaseCost', align: 'right', format: val => `£${val.toFixed(2)}` },
  { name: 'potentialRevenue', label: 'Potential Revenue', field: 'potentialRevenue', align: 'right', format: val => `£${val.toFixed(2)}` }
]

const salesStats = ref({
  totalRevenue: 0,
  numSales: 0,
  avgSaleValue: 0,
  topSellingUnits: null,
  topSellingRevenue: null
})
const purchaseStats = ref({
  totalSpent: 0,
  numPurchases: 0,
  recentPurchases: []
})
const alerts = ref([])
const showRecentPurchases = ref(false)
const categoryPie = ref(null)
const paymentPie = ref(null)
let chartInstance = null
let paymentChartInstance = null

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString() + ' ' + d.toLocaleTimeString()
}

async function fetchAllData() {
  loading.value = true
  error.value = null
  try {
    const [itemsRes, purchasesRes, salesRes] = await Promise.all([
      fetch('http://localhost:3000/api/items'),
      fetch('http://localhost:3000/data/purchases.json'),
      fetch('http://localhost:3000/data/sales.json')
    ])
    if (!itemsRes.ok) throw new Error('Failed to fetch items')
    if (!purchasesRes.ok) throw new Error('Failed to fetch purchases')
    if (!salesRes.ok) throw new Error('Failed to fetch sales')
    items.value = await itemsRes.json()
    purchases.value = await purchasesRes.json()
    sales.value = await salesRes.json()
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

function computeInventoryStats() {
  const totalItems = items.value.length
  const totalStock = items.value.reduce((sum, i) => sum + (i.quantity_in_stock || 0), 0)
  const stockValueSale = items.value.reduce((sum, i) => sum + (i.price * (i.quantity_in_stock || 0)), 0)
  // Compute avg purchase cost per item
  const avgCostMap = {}
  purchases.value.forEach(p => {
    if (!avgCostMap[p.id]) avgCostMap[p.id] = { total: 0, qty: 0 }
    avgCostMap[p.id].total += p.unit_price * p.quantity
    avgCostMap[p.id].qty += p.quantity
  })
  const stockValueCost = items.value.reduce((sum, i) => {
    const avgCost = avgCostMap[i.id]?.qty ? avgCostMap[i.id].total / avgCostMap[i.id].qty : 0
    return sum + avgCost * (i.quantity_in_stock || 0)
  }, 0)
  const lowStock = items.value.filter(i => (i.quantity_in_stock || 0) < lowStockThreshold && (i.quantity_in_stock || 0) > 0)
  const outOfStock = items.value.filter(i => (i.quantity_in_stock || 0) === 0)
  // Recently added: get from purchases, sort by purchaseDate desc, unique by id
  const recentMap = {}
  purchases.value
    .filter(p => p.purchaseDate)
    .sort((a, b) => new Date(b.purchaseDate) - new Date(a.purchaseDate))
    .forEach(p => {
      if (!recentMap[p.id]) {
        const item = items.value.find(i => i.id === p.id)
        if (item) recentMap[p.id] = { ...item, createdAt: p.purchaseDate }
      }
    })
  const recentItems = Object.values(recentMap).slice(0, 5)
  // Category data for pie chart
  const categoryData = {}
  items.value.forEach(i => {
    const cat = i.category || 'Uncategorized'
    if (!categoryData[cat]) categoryData[cat] = 0
    categoryData[cat] += 1
  })
  inventoryStats.value = {
    totalItems,
    totalStock,
    stockValueSale,
    stockValueCost,
    lowStock,
    outOfStock,
    recentItems,
    categoryData
  }
}

function computeItemFinancials() {
  itemFinancials.value = items.value.map(i => {
    // Purchases
    const itemPurchases = purchases.value.filter(p => p.id === i.id)
    const unitsPurchased = itemPurchases.reduce((sum, p) => sum + p.quantity, 0)
    const totalPurchaseCost = itemPurchases.reduce((sum, p) => sum + p.quantity * p.unit_price, 0)
    // Sales
    const itemSales = sales.value.flatMap(sale =>
      (sale.items || []).filter(si => si.id === i.id)
    )
    const unitsSold = itemSales.reduce((sum, s) => sum + s.quantity, 0)
    const totalSalesRevenue = itemSales.reduce((sum, s) => sum + s.quantity * (s.unit_price || i.price), 0)
    const grossProfit = totalSalesRevenue - totalPurchaseCost
    const profitMargin = totalSalesRevenue > 0 ? (grossProfit / totalSalesRevenue) * 100 : 0
    const avgPurchaseCost = unitsPurchased > 0 ? totalPurchaseCost / unitsPurchased : 0
    const potentialRevenue = i.price * (i.quantity_in_stock || 0)
    return {
      id: i.id,
      name: i.name,
      unitsPurchased,
      totalPurchaseCost,
      unitsSold,
      totalSalesRevenue,
      grossProfit,
      profitMargin,
      quantity_in_stock: i.quantity_in_stock,
      avgPurchaseCost,
      potentialRevenue
    }
  })
}

function computeSalesStats() {
  const totalRevenue = sales.value.reduce((sum, s) => sum + (s.total || 0), 0)
  const numSales = sales.value.length
  const avgSaleValue = numSales > 0 ? totalRevenue / numSales : 0
  // Top-selling items
  const unitMap = {}, revenueMap = {}
  sales.value.forEach(sale => {
    (sale.items || []).forEach(si => {
      unitMap[si.id] = (unitMap[si.id] || 0) + si.quantity
      revenueMap[si.id] = (revenueMap[si.id] || 0) + si.quantity * (si.unit_price || 0)
    })
  })
  let topSellingUnits = null, topSellingRevenue = null
  if (Object.keys(unitMap).length) {
    const topUnitId = Object.entries(unitMap).sort((a, b) => b[1] - a[1])[0][0]
    topSellingUnits = items.value.find(i => i.id === topUnitId)
  }
  if (Object.keys(revenueMap).length) {
    const topRevId = Object.entries(revenueMap).sort((a, b) => b[1] - a[1])[0][0]
    topSellingRevenue = items.value.find(i => i.id === topRevId)
  }
  salesStats.value = {
    totalRevenue,
    numSales,
    avgSaleValue,
    topSellingUnits,
    topSellingRevenue
  }
}

function computePurchaseStats() {
  const totalSpent = purchases.value.reduce((sum, p) => sum + p.quantity * p.unit_price, 0)
  const numPurchases = purchases.value.length
  const recentPurchases = purchases.value
    .filter(p => p.purchaseDate)
    .sort((a, b) => new Date(b.purchaseDate) - new Date(a.purchaseDate))
    .slice(0, 5)
  purchaseStats.value = {
    totalSpent,
    numPurchases,
    recentPurchases
  }
}

function computeAlerts() {
  const alertList = []
  // Show all items with stock < 3 (including 0)
  inventoryStats.value.lowStock.forEach(i => {
    if ((i.quantity_in_stock) < 3) {
      alertList.push(`Low stock: ${i.name} (${i.quantity_in_stock} left)`)
    }
  })
  // Also show all out of stock items (quantity_in_stock === 0)
  inventoryStats.value.outOfStock.forEach(i => {
    alertList.push(`Out of stock: ${i.name}`)
  })
  alerts.value = alertList
}

function renderCategoryPie() {
  if (!categoryPie.value) return
  if (chartInstance) chartInstance.destroy()
  const data = {
    labels: Object.keys(inventoryStats.value.categoryData),
    datasets: [{
      data: Object.values(inventoryStats.value.categoryData),
      backgroundColor: [
        '#42A5F5', '#66BB6A', '#FFA726', '#AB47BC', '#EC407A', '#FF7043', '#26A69A'
      ]
    }]
  }
  chartInstance = new Chart(categoryPie.value, {
    type: 'pie',
    data,
    options: {
      responsive: true,
      plugins: { legend: { position: 'bottom' } }
    }
  })
}

function renderPaymentPie() {
  if (!paymentPie.value) return
  if (paymentChartInstance) paymentChartInstance.destroy()
  // Count payment types
  const paymentCounts = {}
  sales.value.forEach(sale => {
    let type = sale.payment_type || 'unknown'
    // Normalize mixed types
    if (type.includes('card') && type.includes('cash')) type = 'cash+card'
    paymentCounts[type] = (paymentCounts[type] || 0) + 1
  })
  const labels = Object.keys(paymentCounts)
  const data = Object.values(paymentCounts)
  paymentChartInstance = new Chart(paymentPie.value, {
    type: 'pie',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: [
          '#42A5F5', '#FFA726', '#66BB6A', '#AB47BC', '#EC407A', '#FF7043', '#26A69A'
        ]
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { position: 'bottom' } }
    }
  })
}

onMounted(async () => {
  await fetchAllData()
  if (!error.value) {
    computeInventoryStats()
    computeItemFinancials()
    computeSalesStats()
    computePurchaseStats()
    computeAlerts()
    await nextTick()
    renderCategoryPie()
    renderPaymentPie()
  }
})
</script>