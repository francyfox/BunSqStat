<script setup lang="ts">
import BAccessMetrics from "@/components/BAccessMetrics.vue";
</script>

<template>
  <div class="mx-a container">
    <Suspense>
      <BAccessMetrics />

      <template #fallback>
        Loading...
      </template>
    </Suspense>
  </div>
</template>

<style scoped>

</style>