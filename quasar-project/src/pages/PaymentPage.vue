<template>
  <q-page class="q-pa-md">
    <q-card flat bordered>

      <!-- Top Toolbar with Back Button -->
      <q-toolbar>
        <q-toolbar-title>Payment</q-toolbar-title>
        <q-space />
        <q-btn dense flat icon="arrow_back" @click="router.back()" aria-label="Go back" />
      </q-toolbar>

      <q-card-section>
        <div class="text-h6">Order Summary</div>

        <!-- Scrollable container -->
        <div style="max-height: 500px; overflow-y: auto;">
          <q-list>
            <q-item v-for="(item, index) in items" :key="index">
              <q-item-section>{{ item.name }}</q-item-section>
              <q-item-section side>£{{ item.price }}</q-item-section>
            </q-item>
          </q-list>
        </div>

        <div class="text-right q-mt-md text-weight-bold">
          Total: £{{ total }}
        </div>
      </q-card-section>
      <q-separator />

      <q-card-section>
        <div class="text-h6 q-mb-sm">Choose Payment Method</div>
        <q-btn-group spread>
          <q-btn label="Cash" color="primary" @click="submitPayment('cash')" />
          <q-btn size="lg"  label="Card" color="secondary" @click="submitPayment('card')" />
        </q-btn-group>
      </q-card-section>
      
    </q-card>
  </q-page>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from 'stores/cart'
import { useQuasar } from 'quasar'

const $q = useQuasar()
const router = useRouter()
const cart = useCartStore()

const items = computed(() => cart.items)

// Assuming your cart store has a getter or computed `total` property.
// If not, you can compute total here as:
// const total = computed(() => cart.items.reduce((sum, i) => sum + i.price, 0))
const total = computed(() => cart.total)

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
    .onOk(cashGivenStr => {
      const cashGiven = parseFloat(cashGivenStr)
      if (isNaN(cashGiven) || cashGiven < total.value) {
        $q.notify({ type: 'negative', message: 'Invalid amount entered.' })
        return
      }
      const change = cashGiven - total.value

      // Show change in a persistent modal dialog (blocks other actions)
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
    })
    .onCancel(() => {
      $q.notify({ type: 'info', message: 'Cash payment cancelled.' })
    })
  } else if (method === 'card') {
    $q.notify({ message: 'Redirecting to card payment...', type: 'info' })
  }
}





</script>

