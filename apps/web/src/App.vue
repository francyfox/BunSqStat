<script setup lang="ts">
import { darkTheme, NConfigProvider } from "naive-ui";
import BHeader from "./components/BHeader.vue";
import BMenu from "./components/BMenu.vue";
import Rainbow from "./components/rainbow.vue";
</script>

<template>
  <n-config-provider
      :theme-overrides="{ common: { fontWeightStrong: '600' } }"
      :theme="darkTheme"
      preflight-style-disabled
  >
    <div class="fixed">
      <Rainbow />
    </div>

    <BMenu>
      <div class="app">
        <BHeader />

        <RouterView />
      </div>
    </BMenu>

  </n-config-provider>
</template>

<style scoped>
</style>
