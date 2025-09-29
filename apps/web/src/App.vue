<script setup lang="ts">
import { darkTheme, NConfigProvider, NNotificationProvider } from "naive-ui";
import BHeader from "./components/BHeader.vue";
import BMenu from "./components/BMenu.vue";
import Rainbow from "./components/rainbow.vue";
</script>

<template>
  <NConfigProvider
      :theme-overrides="{ common: { fontWeightStrong: '600' } }"
      :theme="darkTheme"
      preflight-style-disabled
  >
    <NNotificationProvider :max="3">
      <div class="fixed">
        <Rainbow />
      </div>

      <BMenu>
        <div class="app pb-10 xl:pb-0">
          <BHeader />

          <RouterView />
        </div>
      </BMenu>

    </NNotificationProvider>
  </NConfigProvider>
</template>

<style scoped>
</style>
