<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-btn flat @click="leftDrawerOpen = !leftDrawerOpen" round dense icon="menu" />

        <q-toolbar-title>
          Primrose Farm Holidays
        </q-toolbar-title>

        <!-- Password Dropdown Button -->
       <q-btn-dropdown
        outline
        icon="lock"
        label="Login"
        class="q-ml-auto"
      >
        <div class="q-pa-md" style="min-width: 200px">
          <q-input
            v-model="tempPassword"
            type="password"
            label="Enter Password"
            dense
            outlined
            @keyup.enter="submitPassword"
          />
          <q-btn
            label="Submit"
            color="primary"
            class="q-mt-sm full-width"
            @click="submitPassword"
          />
        </div>
      </q-btn-dropdown>
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="leftDrawerOpen"
      show-if-above
      bordered
    >
      <q-toolbar>
        <q-btn flat @click="leftDrawerOpen = !leftDrawerOpen" round dense icon="menu" />
        <div class="q-ml-sm">Menu</div>
      </q-toolbar>

      <q-list>
        <EssentialLink
          v-for="link in leftlinksList"
          :key="link.title"
          v-bind="link"
        />
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref } from 'vue'
import EssentialLink from 'components/EssentialLink.vue'
import { useAuthStore } from 'src/stores/auth'

const authStore = useAuthStore()
const leftDrawerOpen = ref(false)
const tempPassword = ref()

// menu links
const leftlinksList = [
  { title: 'epos', icon: 'shopping_basket', link: '/' },
  { title: 'Add Item', icon: 'playlist_add', link: '/add_item' },
  { title: 'Add stock', icon: 'inventory', link: '/add_stock' },
  { title: 'change data', icon: 'edit', link: '/update_item' },
  { title: 'Dashboard', icon: 'dashboard', link: '/dashboard' }
]

// saves the password to Pinia store
function submitPassword() {
  authStore.setPassword(tempPassword.value)
}
</script>