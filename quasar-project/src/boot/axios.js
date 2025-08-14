import { boot } from 'quasar/wrappers'
import axios from 'axios'
import { useAuthStore } from 'src/stores/auth'

const api = axios.create({ baseURL: 'http://localhost:3000' })

// Attach password to every request
api.interceptors.request.use(config => {
  const auth = useAuthStore()
  if (auth.password) {
    console.log(auth.password)
    config.headers['x-app-password'] = auth.password
  }
  return config
})

export default boot(({ app }) => {
  app.config.globalProperties.$axios = axios
  app.config.globalProperties.$api = api
})

export { api }
