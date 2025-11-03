<script setup lang="ts">
import { NSwitch, NTable } from "naive-ui";
import { computed } from "vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();
const origins =
	defineModel<
		{ id: string; host: string; listen: boolean; active: boolean }[]
	>();

const emit = defineEmits<{
	handleChange: [item: any];
}>();

const headers = computed(() => [t("origin"), t("display"), t("originListen")]);
</script>

<template>
  <div class="flex flex-col gap-3 max-w-sm">
    <div class="text-white text-sm">
      {{ $t("originCaption") }}
    </div>
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
              v-model:value="i.active"
              @update:value="emit('handleChange', i)"
          />
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