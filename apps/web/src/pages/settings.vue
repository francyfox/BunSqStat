<script setup lang="ts">
import { NButton, NInputNumber, useMessage } from "naive-ui";
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
        <NInputNumber
          v-model:value="store.settings.maxMemory"
          placeholder="e.g., 1gb, 512mb"
          style="width: 200px"
        >
          <template #suffix>
            bytes
          </template>
        </NInputNumber>
        <NButton type="primary" @click="handleSave" :loading="store.loading">
          Save
        </NButton>
      </div>
    </div>
  </section>
</template>

<style scoped>
label {
  font-weight: bold;
}
</style>