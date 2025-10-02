<script setup lang="ts">
import { InformationCircle } from "@vicons/ionicons5";
import { Icon } from "@vicons/utils";
import { NButton, NInputNumber, NTooltip, useMessage } from "naive-ui";
import { storeToRefs } from "pinia";
import { onMounted } from "vue";
import { useSettingsStore } from "@/stores/settings.ts";

const store = useSettingsStore();
const { loading, error } = storeToRefs(store);
const message = useMessage();

onMounted(async () => {
	await store.getMaxMemory();
});

const handleSave = async () => {
	await store.setMaxMemory(store.settings.maxMemory);

	if (error.value) {
		message.error("Failed to update max memory");
	} else {
		message.success("Max memory updated successfully");
	}
};
</script>

<template>
  <section>
    <div class="mx-a container">
      <div class="text-lg font-500 mb-3">Redis Settings</div>
      <div class="flex items-center gap-2">
        <label>Max Memory:</label>
        <div class="w-full max-w-sm relative flex flex-col gap-1">
          <NInputNumber
              v-model:value="store.settings.maxMemory"
          >
            <template #suffix>
              bytes
            </template>
          </NInputNumber>
        </div>

        <NButton type="primary" @click="handleSave" :loading="store.loading">
          Save
        </NButton>
        <NTooltip placement="bottom" trigger="hover">
          <template #trigger>
            <Icon size="32" class="cursor-pointer">
              <InformationCircle />
            </Icon>
          </template>
          This app watch logs 1 hour. Set optimal size for your company
        </NTooltip>
      </div>
    </div>
  </section>
</template>

<style scoped>
label {
  font-weight: bold;
}
</style>