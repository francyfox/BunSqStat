<script setup lang="ts">
import { InformationCircle } from "@vicons/ionicons5";
import { Icon } from "@vicons/utils";
import { NButton, NModal, NTooltip, useMessage } from "naive-ui";
import { storeToRefs } from "pinia";
import { ref } from "vue";
import { useSettingsStore } from "@/stores/settings.ts";

const store = useSettingsStore();
const { loading, error } = storeToRefs(store);
const message = useMessage();
const currentAction = ref();

const showModal = ref(false);

type TAction = "Drop access logs" | "Drop aliases" | "Parse logs";
async function openModal(action: TAction) {
	showModal.value = true;
	currentAction.value = action;
}

async function handlePositive() {
	try {
		if (currentAction.value === "Drop access logs") {
			await store.dropLogAccess();
		} else if (currentAction.value === "Drop aliases") {
			await store.dropAliases();
		} else if (currentAction.value === "Parse logs") {
			await store.parseLogs();
		}
	} finally {
		if (error.value) {
			message.error(error.value);
		} else {
			message.success(`${currentAction.value} - action confirmed`);
		}
	}
}
</script>

<template>
  <div class="flex flex-col max-w-lg bg-red-900/20 border-red-500 border-1 p-3 gap-2">
    <div class="flex items-center gap-1">
      <span class="text-red text-sm font-500 pt-1">DANGER ZONE</span>

      <NTooltip placement="bottom" trigger="click">
        <template #trigger>
          <Icon size="20" class="cursor-pointer">
            <InformationCircle />
          </Icon>
        </template>
        PARSE LOGS - parse all logs.
      </NTooltip>
    </div>

    <div class="flex flex-wrap gap-2">
      <NButton
          :loading="loading"
          tertiary
          @click="openModal('Drop access logs')"
      >
        DROP ACCESS LOGS
      </NButton>
      <NButton
          :loading="loading"
          tertiary
          @click="openModal('Drop aliases')"
      >
        DROP ALIASES
      </NButton>
      <NButton
          :loading="loading"
          type="warning"
          @click="openModal('Rerun parser')"
        >
        PARSE LOGS
      </NButton>
    </div>

    <NModal
        v-model:show="showModal"
        :mask-closable="true"
        preset="dialog"
        :title="currentAction"
        content="Are you sure?"
        positive-text="Confirm"
        negative-text="Cancel"
        @positive-click="handlePositive"
        @negative-click="showModal = false"
    />
  </div>
</template>

<style scoped>

</style>