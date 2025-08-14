import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    password: ''
  }),
  actions: {
    setPassword(pw) {
      this.password = pw
    },
    clearPassword() {
      this.password = ''
    }
  }
})
