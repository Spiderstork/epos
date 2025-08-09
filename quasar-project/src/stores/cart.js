// stores/cart.js
import { defineStore } from 'pinia'

export const useCartStore = defineStore('cart', {
  state: () => ({
    items: [] // each item: { id, barcode, name, quantity, unit_price }
  }),

  getters: {
    total(state) {
      return state.items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0)
    }
  },

  actions: {
    addItem(newItem, scannedBarcode = null) {
      const existingItem = this.items.find(i => i.id === newItem.id)
      if (existingItem) {
        existingItem.quantity += 1
      } else {
        this.items.push({
          id: newItem.id,
          barcode: scannedBarcode || (newItem.barcodes?.[0] ?? ''), // keep the scanned one
          name: newItem.name,
          quantity: 1,
          unit_price: newItem.price
        })
      }
    },

    removeItem(index) {
      this.items.splice(index, 1)
    },

    clear() {
      this.items = []
    }
  }
})
