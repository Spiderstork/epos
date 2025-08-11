<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-btn flat @click="leftDrawerOpen = !leftDrawerOpen" round dense icon="menu" />

        <q-toolbar-title>
          Primrose Farm Holidays
        </q-toolbar-title>

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

const leftDrawerOpen = ref(false)

const leftlinksList = [
  { title: 'epos', icon: 'shopping_basket', link: '/' },
  { title: 'Add Item', icon: 'playlist_add', link: '/add_item' },
  { title: 'Add stock', icon: 'inventory', link: '/add_stock' },
  { title: 'change data', icon: 'edit', link: '/update_item' },
  { title: 'Dashboard', icon: 'dashboard', link: '/dashboard' }
]
</script>
