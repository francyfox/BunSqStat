<script setup lang="ts">
import { NFormItem, NSelect } from "naive-ui";
import { computed } from "vue";
import timezones from "@/assets/timezone.json";

const value = defineModel();
const { defaultValue } = defineProps<{
	defaultValue?: string;
}>();
const options = computed(() =>
	timezones.map((timezone) => {
		return {
			label: timezone,
			value: timezone,
		};
	}),
);
</script>

<template>
  <NFormItem :label="$t('timezone')">
    <NSelect
        v-model:value="value"
        :default-value="defaultValue"
        :options="options"
        filterable
   />
  </NFormItem>
</template>

<style scoped>

</style>