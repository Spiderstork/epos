<template>
  <component
    :is="isInternal ? 'router-link' : 'a'"
    :to="isInternal ? props.link : undefined"
    :href="!isInternal ? props.link : undefined"
    :target="!isInternal ? '_blank' : undefined"
  >
    <q-item clickable>
      <q-item-section v-if="props.icon" avatar>
        <q-icon :name="props.icon" />
      </q-item-section>

      <q-item-section>
        <q-item-label>{{ props.title }}</q-item-label>
        <q-item-label caption>{{ props.caption }}</q-item-label>
      </q-item-section>
    </q-item>
  </component>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  title: {
    type: String,
    required: true
  },

  caption: {
    type: String,
    default: ''
  },

  link: {
    type: String,
    default: '#'
  },

  icon: {
    type: String,
    default: ''
  }
})

// Check if the link is internal (starts with '/')
const isInternal = computed(() => props.link.startsWith('/'))
</script>
