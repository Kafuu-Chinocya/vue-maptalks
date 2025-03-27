<template>
  <div>test</div>
</template>

<script lang="ts" setup>
import { watch } from 'vue'

const props = defineProps({
  a: {
    type: Number
  }
})

watch(
  () => props.a,
  () => {
    console.log('a changed')
  },
  { immediate: true }
)
</script>
