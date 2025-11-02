<script setup lang="ts">
import { InformationCircle } from "@vicons/ionicons5";
import { Icon } from "@vicons/utils";
import {
	NButton,
	NFormItem,
	NInput,
	NInputNumber,
	NSelect,
	NTooltip,
	useMessage,
} from "naive-ui";
import { storeToRefs } from "pinia";
import { computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import BOrigins from "@/components/settings/BOrigins.vue";
import { useSettingsStore } from "@/stores/settings.ts";

const { t, availableLocales } = useI18n();
const store = useSettingsStore();
const { loading, error, language, interval } = storeToRefs(store);
const message = useMessage();

const locales = computed(() =>
	availableLocales.map((i) => {
		return {
			label: i,
			value: i,
		};
	}),
);

async function handleUpdateAliases() {
	try {
		await Promise.all([store.setAliases(), store.getAliases()]);
	} finally {
		if (error.value) {
			message.error(error.value);
		} else {
			message.success(t("aliasesUpdated")); // Используем t() здесь
		}
	}
}

onMounted(async () => {
	await store.getOrigins();
});
</script>

<template>
  <div class="flex flex-col gap-2">
    <div class="text-lg font-500 mb-3">{{ $t('settingsTitle') }}</div>

    <div           class="w-full max-w-sm"
    >
      <NFormItem :label="$t('userLocale')">
        <NSelect
            v-model:value="language"
            @update:value="store.setLocale"
            :options="locales"
            class="w-full"
        />
      </NFormItem>
    </div>

    <div class="flex gap-1">
      <div class="w-full flex gap-1 max-w-sm">
        <NFormItem :label="$t('interval')" class="w-full">
          <NInputNumber
              v-model:value="interval"
              :show-button="false"
              class="w-full"
          />
        </NFormItem>
      </div>

      <div class="mt-[-10px] md:mt-[25px] pb-5 flex gap-1">
        <NTooltip
            placement="bottom"
            trigger="click"
        >
          <template #trigger>
            <Icon size="32"
                  class="cursor-pointer"
            >
              <InformationCircle />
            </Icon>
          </template>

          {{ $t('intervalTooltip') }}
        </NTooltip>
      </div>
    </div>

    <BOrigins v-model="store.settings.origins" />

    <div class="flex flex-col md:flex-row gap-1">

      <NFormItem
          :label="$t('userAliasLabel')"
          class="w-full max-w-sm"
      >
        <NInput
            v-model:value="store.settings.aliases"
            type="textarea"
            size="small"
            :autosize="{
            minRows: 3,
            maxRows: 5,
          }"
            :placeholder="$t('userAliasPlaceholder')"
            class="w-full"
        />
      </NFormItem>

      <div class="mt-[-10px] md:mt-[25px] pb-5 flex gap-1">
        <NButton
            type="primary"
            @click="handleUpdateAliases"
            :loading="loading"
            class="min-w-[120px]"
        >
          {{ $t('set') }}
        </NButton>

        <NTooltip
            placement="bottom"
            trigger="click"
        >
          <template #trigger>
            <Icon size="32"
                  class="cursor-pointer"
            >
              <InformationCircle />
            </Icon>
          </template>
          <span v-html="$t('userAliasTooltip')"></span>
        </NTooltip>
      </div>
    </div>
  </div>
</template>

<style scoped>

</style>