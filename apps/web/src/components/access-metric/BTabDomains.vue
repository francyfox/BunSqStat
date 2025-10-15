<script setup lang="ts">
import { useRouteHash } from "@vueuse/router";
import { type DataTableColumns, NTag, useNotification } from "naive-ui";
import { storeToRefs } from "pinia";
import { computed, onMounted } from "vue";
import BDomainTable from "@/components/access-metric/BDomainTable.vue";
import { useDomainStore } from "@/stores/domains.ts";

const hash = useRouteHash();

const domainStore = useDomainStore();
const { items, error } = storeToRefs(domainStore);
const notification = useNotification();

onMounted(async () => {
	try {
		await domainStore.getMetricsDomain();
	} catch (_) {
		notification.error({
			title: "Cant load domain metrics",
			description: error.value,
		});
	}
});
</script>

<template>
  <div class="flex flex-col gap-2">
    <div class="flex flex-wrap gap-1">
      <NTag class="text-xl">
        TOTAL:
        {{ items?.length }}
      </NTag>
    </div>

    <BDomainTable
        :domains="items"
    />
  </div>
</template>

<style scoped>

</style>