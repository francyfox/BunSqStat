<script setup lang="ts">
import {
	darkTheme,
	NConfigProvider,
	NMessageProvider,
	NModalProvider,
	NNotificationProvider,
} from "naive-ui";
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
    <NModalProvider>
      <NMessageProvider>
        <NNotificationProvider :max="3">
          <div class="fixed">
            <Rainbow />
          </div>

          <BMenu>
            <div class="app pb-10 xl:pb-0">
              <BHeader />

              <RouterView v-slot="{ Component }">
                <template v-if="Component">
                  <Transition mode="out-in">
                    <KeepAlive>
                      <Suspense>
                        <component :is="Component"></component>

                        <template #fallback>
                          Loading...
                        </template>
                      </Suspense>
                    </KeepAlive>
                  </Transition>
                </template>
              </RouterView>
            </div>
          </BMenu>
        </NNotificationProvider>
      </NMessageProvider>
    </NModalProvider>
  </NConfigProvider>
</template>

<style>
.v-enter-active,
.v-leave-active {
  transition: opacity 150ms ease;
}

.v-enter-from,
.v-leave-to {
  opacity: 0;
}
</style>
