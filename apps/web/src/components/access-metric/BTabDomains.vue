<script setup lang="ts">
import { Close } from "@vicons/ionicons5";
import { Icon } from "@vicons/utils";
import { watchDebounced } from "@vueuse/core";
import { NButton, NFormItem, NInput } from "naive-ui";
import { storeToRefs } from "pinia";
import { IMetricDomainOptions } from "server/schema";
import { reactive, ref } from "vue";
import { useDayjs } from "@/composables/dayjs.ts";
import { useDomainStore } from "@/stores/domains.ts";

const dayjs = useDayjs();

const domainsStore = useDomainStore();
const { items, loading, error, count } = storeToRefs(domainsStore);
const search = ref("");
const query = reactive<IMetricDomainOptions>({
	search: search.value,
});

async function handleSearch() {
	await domainsStore.getMetricsDomain();
}

async function handleReset() {
	search.value = "";
}

watchDebounced(search, (v) => {}, {
	debounce: 200,
});
</script>

<template>
  <div class="flex flex-col gap-2">
    <div class="flex gap-2 max-w-sm">
      <NInput
          v-model:value="search"
          size="large"
          placeholder="Search for Domains"
      />

      <NButton
          type="error"
          size="large"
          @click="handleReset"
      >
        <Icon :size="24">
          <Close />
        </Icon>
      </NButton>
    </div>

  </div>
</template>

<style scoped>

</style>