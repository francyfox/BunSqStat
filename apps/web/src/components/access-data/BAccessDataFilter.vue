<script setup lang="ts">
import { Close } from "@vicons/ionicons5";
import { Icon } from "@vicons/utils";
import { NButton, NForm, NInput, NSelect } from "naive-ui";
import { accessKeys } from "server/schema";
import BAccessDataHelper from "@/components/access-data/BAccessDataHelper.vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();
const emit = defineEmits<{
	reset: [];
}>();
const form = defineModel<{
	field: string;
	search: string | null;
}>({ default: { field: "@user", search: null } });

const fieldOptions = accessKeys.map((key: string) => {
	return {
		label: `@${key}:`,
		value: `@${key}:`,
	};
});
</script>

<template>
  <NForm :model="form" class="search">
    <div class="max-w-xl flex items-center gap-2">
      <NSelect
          v-model:value="form.field"
          :placeholder="$t('selectPlaceholder')"
          :options="fieldOptions"
          size="large"
          class="w-[200px]"
      />

      <NInput
          v-model:value="form.search"
          :placeholder="$t('searchPlaceholder')"
          size="large"
      />

      <NButton
          type="error"
          size="large"
          @click="emit('reset')"
      >
        <Icon :size="24">
          <Close />
        </Icon>
      </NButton>

      <BAccessDataHelper />
    </div>
  </NForm>
</template>

<style scoped>

</style>