<script setup lang="ts">
import { NButton, NResult } from "naive-ui";
</script>

<template>
  <section class="pt-5">
    <div class="container">
      <NResult
          status="404"
          title="404 Not Found"
          description="You know life is always ridiculous."
      >
        <template #footer>
          <RouterLink to="/">
            <NButton>Go to main</NButton>
          </RouterLink>
        </template>
      </NResult>
    </div>
  </section>

</template>

<style scoped>

</style>