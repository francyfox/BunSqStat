<script setup lang="ts">
import { NButton, NResult } from "naive-ui";
</script>

<template>
  <section class="pt-5">
    <div class="container">
      <NResult
          status="404"
          :title="$t('notFoundStatus')"
          :description="$t('notFoundDescription')"
      >
        <template #footer>
          <RouterLink to="/">
            <NButton>{{ $t('goToMain') }}</NButton>
          </RouterLink>
        </template>
      </NResult>
    </div>
  </section>

</template>

<style scoped>

</style>