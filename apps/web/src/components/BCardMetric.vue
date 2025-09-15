<script setup lang="ts">
import { NCard } from "naive-ui";
</script>

<template>
  <NCard class="rounded-md">
    <div class="h-full flex flex-col gap-5 justify-center text-center font-900 text-4xl">
      <div class="h-full flex flex-col justify-center">
        <slot />
      </div>

      <div class="text-center font-500 text-xl">
        <slot name="name" />
      </div>
    </div>
  </NCard>
</template>

<style scoped>

</style>