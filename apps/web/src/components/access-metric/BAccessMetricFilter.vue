<script setup lang="ts">
import { NDatePicker, NForm, NFormItem, NInputNumber } from "naive-ui";

const form = defineModel<{
	limit: number;
	time?: [number, number];
}>({
	default: {
		limit: 50,
		time: undefined,
	},
});
</script>

<template>
  <NForm :model="form"
         class="flex gap-2"
  >
    <NFormItem
        label="Limit records"
        class="max-w-[150px]"
    >
      <NInputNumber
          v-model:value="form.limit"
          size="large"
      />
    </NFormItem>

    <NFormItem label="Limit by end time (UTC)">
      <NDatePicker
          v-model:value="form.time"
          type="datetimerange"
          :actions="['now', 'clear', 'confirm']"
          size="large"
          clearable
      />
    </NFormItem>
  </NForm>
</template>

<style scoped>

</style>