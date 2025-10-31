<script setup lang="ts">
import { InformationCircle } from "@vicons/ionicons5";
import { Icon } from "@vicons/utils";
import { NButton, NModal, NTooltip, useMessage } from "naive-ui";
import { storeToRefs } from "pinia";
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import { useSettingsStore } from "@/stores/settings.ts";

const { t } = useI18n();
const store = useSettingsStore();
const { loading, error } = storeToRefs(store);
const message = useMessage();
const currentAction = ref();

const showModal = ref(false);

type TAction = "Drop access logs" | "Drop aliases";
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
		}
	} finally {
		if (error.value) {
			message.error(error.value);
		} else {
			message.success(t("actionConfirmed", { action: currentAction.value }));
		}
	}
}
</script>

<template>
  <div class="flex flex-col max-w-lg bg-red-900/20 border-red-500 border-1 p-3 gap-2">
    <div class="flex items-center gap-1">
      <span class="text-red text-sm font-500 pt-1">{{ $t('dangerZoneTitle') }}</span>

      <NTooltip placement="bottom" trigger="click">
        <template #trigger>
          <Icon size="20" class="cursor-pointer">
            <InformationCircle />
          </Icon>
        </template>
        {{ $t('parseLogsTooltip') }}
      </NTooltip>
    </div>

    <div class="flex flex-wrap gap-2">
      <NButton
          :loading="loading"
          tertiary
          @click="openModal('Drop access logs')"
      >
        {{ $t('dropAccessLogs') }}
      </NButton>
      <NButton
          :loading="loading"
          tertiary
          @click="openModal('Drop aliases')"
      >
        {{ $t('dropAliases') }}
      </NButton>
    </div>

    <NModal
        v-model:show="showModal"
        :mask-closable="true"
        preset="dialog"
        :title="currentAction"
        :content="$t('confirmModalContent')"
        :positive-text="$t('confirmModalPositive')"
        :negative-text="$t('confirmModalNegative')"
        @positive-click="handlePositive"
        @negative-click="showModal = false"
    />
  </div>
</template>

<style scoped>

</style>