import { defineStore } from 'pinia'

export const useCartStore = defineStore('cart', {
  state: () => ({
    items: []
  }),

  getters: {
    total(state) {
      return state.items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0)
    }
  },

  actions: {
    addItem(newItem) {
      const existingItem = this.items.find(i => i.barcode === newItem.barcode)
      if (existingItem) {
        existingItem.quantity += 1
      } else {
        this.items.push({
          barcode: newItem.barcode,
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
