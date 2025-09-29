<script setup lang="ts">
import { NForm, NInput, NSelect } from "naive-ui";
import { accessKeys } from "server/schema";
import BAccessDataHelper from "@/components/BAccessDataHelper.vue";

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
          placeholder="Select"
          :options="fieldOptions"
          size="large"
          class="w-[200px]"
      />

      <NInput
          v-model:value="form.search"
          placeholder="Search by column"
          size="large"
      />

      <BAccessDataHelper />
    </div>
  </NForm>
</template>

<style scoped>

</style>