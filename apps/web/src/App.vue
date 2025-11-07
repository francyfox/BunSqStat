<script setup lang="ts">
import {
	darkTheme,
	NConfigProvider,
	NLoadingBarProvider,
	NMessageProvider,
	NModalProvider,
	NNotificationProvider,
} from "naive-ui";
import { storeToRefs } from "pinia";
import { onMounted } from "vue";
import { useI18n } from "vue-i18n";
import BBarProvider from "@/components/BBarProvider.vue";
import BBusProvider from "@/components/BBusProvider.vue";
import { useSettingsStore } from "@/stores/settings.ts";
import BHeader from "./components/BHeader.vue";
import BMenu from "./components/BMenu.vue";
import Rainbow from "./components/rainbow.vue";

const { locale } = useI18n();
const store = useSettingsStore();
const { language } = storeToRefs(store);

onMounted(() => {
	if (!language.value) {
		language.value = locale.value;
	} else {
		store.setLocale(language.value);
	}
});
</script>

<template>
  <NConfigProvider
      :theme-overrides="{ common: { fontWeightStrong: '600' } }"
      :theme="darkTheme"
      preflight-style-disabled
  >
    <NLoadingBarProvider
        :loading-bar-style="{ loading: { opacity: 0.5 }}"
    >
      <NModalProvider>
        <NMessageProvider>
          <NNotificationProvider :max="3">
            <BBarProvider />
            <BBusProvider />
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
    </NLoadingBarProvider>
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
