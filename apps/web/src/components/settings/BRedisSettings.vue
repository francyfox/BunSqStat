<script setup lang="ts">
import { InformationCircle } from "@vicons/ionicons5";
import { Icon } from "@vicons/utils";
import {
	NButton,
	NFormItem,
	NInputNumber,
	NTooltip,
	useMessage,
} from "naive-ui";
import { storeToRefs } from "pinia";
import { onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { useSettingsStore } from "@/stores/settings.ts";
import { formatBytes } from "@/utils/string.ts";

const { t } = useI18n();
const store = useSettingsStore();
const { loading, error } = storeToRefs(store);
const message = useMessage();

async function handleUpdateMaxMemory() {
	try {
		await store.setMaxMemory(store.settings.maxMemory);
	} finally {
		if (error.value) {
			message.error(error.value);
		} else {
			message.success(t("maxMemoryUpdated"));
		}
	}
}

onMounted(async () => {
	try {
		await store.getMaxMemory();
	} catch (_) {
		message.error(error.value);
	}
});
</script>

<template>
  <div class="flex flex-col gap-2">
    <div class="text-lg font-500">{{ $t('redisSettingsTitle') }}</div>
    <div class="flex flex-col md:flex-row items-start md:items-center gap-1">
      <div class="w-full max-w-sm relative flex flex-col gap-1">
        <NFormItem
            :label="$t('maxMemoryLabel')"
        >
          <NInputNumber
              v-model:value="store.settings.maxMemory"
              class="w-full"
          >
            <template #prefix>
              {{ $t('bytePrefix') }}
            </template>
            <template #suffix>
              = {{ formatBytes(store.settings.maxMemory) }}
            </template>
          </NInputNumber>
        </NFormItem>
      </div>

      <div class="flex gap-1">
        <NButton
            type="primary"
            @click="handleUpdateMaxMemory"
            :loading="loading"
            :disabled="loading"
            class="min-w-[120px]"
        >
          {{ $t('set') }}
        </NButton>
        <NTooltip placement="bottom" trigger="click">
          <template #trigger>
            <Icon size="32" class="cursor-pointer">
              <InformationCircle />
            </Icon>
          </template>
          {{ $t('maxMemoryTooltip') }}
        </NTooltip>
      </div>
    </div>
  </div>
</template>

<style scoped>

</style>