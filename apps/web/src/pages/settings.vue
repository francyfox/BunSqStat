<script setup lang="ts">
import BAppSettings from "@/components/settings/BAppSettings.vue";
import BDangerZone from "@/components/settings/BDangerZone.vue";
import BRedisSettings from "@/components/settings/BRedisSettings.vue";
</script>

<template>
  <section>
    <div class="mx-a container">
      <div class="flex flex-col gap-5">
        <BRedisSettings />
        <BAppSettings />
      </div>
      <BDangerZone />
    </div>
  </section>
</template>

<style scoped>
label {
  font-weight: bold;
}
</style>