<template>
  <q-page class="q-pa-md">
    <q-card flat bordered>

      <!-- Top Toolbar with Back Button -->
      <q-toolbar>
        <q-toolbar-title>Payment</q-toolbar-title>
        <q-space />
        <q-btn dense flat icon="arrow_back" @click="router.back()" aria-label="Go back" />
      </q-toolbar>

      <!-- Entire content inside dynamic container -->
      <q-card-section class="dynamic-container">
        
        <!-- Order Summary Header -->
        <div class="text-h6 q-mb-sm">Order Summary</div>

        <!-- Scrollable order list -->
        <div class="scroll-area">
          <q-list>
            <q-item v-for="(item, index) in items" :key="index">
              <q-item-section>
                {{ item.name }} <small>(x{{ item.quantity }})</small>
              </q-item-section>
              <q-item-section side>
                £{{ (item.quantity * item.unit_price).toFixed(2) }}
              </q-item-section>
            </q-item>
          </q-list>
        </div>

        <!-- Total amount fixed below scroll -->
        <div class="text-right q-mt-md text-weight-bold">
          Total: £{{ total }}
        </div>

        <!-- Payment methods pinned at bottom -->
        <div class="q-mt-md">
          <div class="text-h6 q-mb-sm">Choose Payment Method</div>
          <q-btn-group spread>
            <q-btn label="Cash" color="primary" @click="submitPayment('cash')" />
            <q-btn size="lg" label="Card" color="secondary" @click="submitPayment('card')" />
          </q-btn-group>
        </div>

      </q-card-section>

    </q-card>
  </q-page>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from 'stores/cart'
import axios from 'axios'
import { useQuasar } from 'quasar'

const $q = useQuasar()
const router = useRouter()
const cart = useCartStore()

const items = computed(() => cart.items)
const total = computed(() => cart.total)

async function saveSale(sale) {
  try {
    await axios.post('http://localhost:3000/api/sales', sale)
    $q.notify({ type: 'positive', message: 'Sale saved successfully.' })
  } catch (error) {
    $q.notify({ type: 'negative', message: 'Failed to save sale.' })
    throw error
  }
}

function submitPayment(method) {
  if (method === 'cash') {
    $q.dialog({
      title: 'Cash Payment',
      message: `Total is £${total.value.toFixed(2)}. Enter amount received:`,
      prompt: {
        model: '',
        type: 'number',
        isValid: val => {
          const n = parseFloat(val)
          return !isNaN(n) && n >= total.value
        },
        attrs: {
          min: total.value,
          step: '0.01',
          inputmode: 'decimal',
        }
      },
      cancel: true,
      persistent: true
    })
    .onOk(async cashGivenStr => {
      const cashGiven = parseFloat(cashGivenStr)
      if (isNaN(cashGiven) || cashGiven < total.value) {
        $q.notify({ type: 'negative', message: 'Invalid amount entered.' })
        return
      }
      const change = cashGiven - total.value

      // Prepare sale data
      const sale = {
        timestamp: new Date().toISOString(),
        items: items.value.map(i => ({
          barcode: i.barcode,
          name: i.name,
          quantity: i.quantity,
          unit_price: i.unit_price
        })),
        total: total.value,
        payment_received: cashGiven,
        payment_type: 'cash'
      }

      try {
        await saveSale(sale)

        // Show change dialog
        $q.dialog({
          title: 'Change Due',
          message: `Payment of £${cashGiven.toFixed(2)} accepted.<br><br><strong>Change to return: £${change.toFixed(2)}</strong>`,
          html: true,
          ok: true,
          persistent: true
        }).onOk(() => {
          cart.clear()
          router.push('/')
        })

      } catch {
        console.log("failed to save log") // fail;ed top save the transaction// Sale save failed, do not clear cart or proceed
      }
    })
    .onCancel(() => {
      $q.notify({ type: 'info', message: 'Cash payment cancelled.' })
    })
  } 
  
  
  else if (method === 'card') {
    // For card payment, we assume full payment so payment_received = total.value
    const sale = {
      timestamp: new Date().toISOString(),
      items: items.value.map(i => ({
        barcode: i.barcode,
        name: i.name,
        quantity: i.quantity,
        unit_price: i.unit_price
      })),
      total: total.value,
      payment_received: total.value,
      payment_type: 'card'
    }

    saveSale(sale)
      .then(() => {
        $q.notify({ message: 'Redirecting to card payment...', type: 'info' })
        cart.clear()
        router.push('/')
      })
      .catch(() => {
        console.log("failed to save log") // fail;ed top save the transaction
      })
  }
}




</script>

