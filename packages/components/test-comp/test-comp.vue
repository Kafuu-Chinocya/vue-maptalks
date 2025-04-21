<template>
  <div>test</div>
</template>

<script lang="ts" setup>
import { watch } from 'vue'

import { testCompProps } from './test-comp'

const props = defineProps(testCompProps())

watch(
  () => props.a,
  () => {
    console.log('a changed')
  },
  { immediate: true }
)
</script>
