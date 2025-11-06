<script setup lang="ts">
import { NFormItem, NSelect, NSwitch, NTable } from "naive-ui";
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();
const origins =
	defineModel<
		{ id: string; host: string; listen: boolean; active: boolean }[]
	>();

const emit = defineEmits<{
	handleChange: [item: any];
}>();

const allOrigins = {
	label: t("allOrigins"),
	value: "",
};

const activeOrigin = ref();
const defaultValue = computed(() => {
	const active = origins.value?.find((i) => i.active);
	return active ? { label: active.host, value: active.id } : allOrigins.value;
});

const options = computed(() => [
	allOrigins,
	...origins.value!.map((i) => {
		return {
			label: i.host,
			value: i.id,
		};
	}),
]);

const headers = computed(() => [t("origin"), t("originListen")]);
</script>

<template>
  <div class="flex flex-col gap-3 max-w-sm">
    <div class="text-white text-sm">
      {{ $t("originCaption") }}
    </div>

    <NFormItem :label="t('display')" class="mb-[-10px]">
      <NSelect
          v-model:value="activeOrigin"
          :default-value="defaultValue"
          :options="options"
      />
    </NFormItem>

    <NTable
        :bordered="false"
        :single-line="false"
        class="rounded-md shadow-sm mb-3"
    >
      <thead>
      <tr>
        <th v-for="i in headers"
            :key="i"
        >
          {{ i }}
        </th>
      </tr>
      </thead>
      <tbody>
      <tr
          v-for="i in origins"
          :key="i.id"
      >
        <td>
          {{ i?.host }}
        </td>
        <td>
          <NSwitch
              v-model:value="i.listen"
              @update:value="emit('handleChange', i)"
          />
        </td>
      </tr>
      </tbody>
    </NTable>
  </div>
</template>

<style scoped>

</style>