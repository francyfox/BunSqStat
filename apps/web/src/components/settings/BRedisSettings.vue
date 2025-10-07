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
import { useSettingsStore } from "@/stores/settings.ts";
import { formatBytes } from "@/utils/string.ts";

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
			message.success("Max Memory updated");
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
    <div class="text-lg font-500">Redis Settings</div>
    <div class="flex flex-col md:flex-row items-start md:items-center gap-1">
      <div class="w-full max-w-sm relative flex flex-col gap-1">
        <NFormItem
            label="Max Memory:"
        >
          <NInputNumber
              v-model:value="store.settings.maxMemory"
              class="w-full"
          >
            <template #prefix>
              byte
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
            class="min-w-[120px]"
        >
          SET
        </NButton>
        <NTooltip placement="bottom" trigger="click">
          <template #trigger>
            <Icon size="32" class="cursor-pointer">
              <InformationCircle />
            </Icon>
          </template>
          This app watch logs 1 hour. Set optimal size for your company
        </NTooltip>
      </div>
    </div>
  </div>
</template>

<style scoped>

</style>