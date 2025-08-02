import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useCartStore = defineStore('cart', () => {
  const items = ref([])

  const total = computed(() => items.value.reduce((sum, item) => sum + item.price, 0))

  function addItem(item) {
    items.value.push(item)
  }

  function clear() {
    items.value = []
  }

  return { items, total, addItem, clear }
})
