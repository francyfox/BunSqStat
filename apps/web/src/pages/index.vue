<script setup lang="ts">
import BAccessData from "@/components/BAccessData.vue";
</script>

<template>
  <section>
    <div class="mx-a container">
      <Suspense>
        <BAccessData />

        <template #fallback>
          Loading...
        </template>
      </Suspense>
    </div>
  </section>
</template>

<style scoped>

</style>