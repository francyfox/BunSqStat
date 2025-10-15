<script setup lang="ts">
import { NTag } from "naive-ui";
import { storeToRefs } from "pinia";
import { computed } from "vue";
import BUserTable from "@/components/access-metric/BUserTable.vue";
import { useDayjs } from "@/composables/dayjs.ts";
import { useStatsStore } from "@/stores/stats.ts";

const dayjs = useDayjs();
const statsStore = useStatsStore();
const { accessMetrics } = storeToRefs(statsStore);

const status = computed(() => {
	const online =
		accessMetrics.value?.users?.reduce((acc, current) => {
			const secondsAgo = dayjs().diff(current.lastActivity, "s");
			const isOnline = secondsAgo < 300;

			if (isOnline) {
				return acc + 1;
			}

			return acc;
		}, 0) || 0;

	return {
		online,
		offline: accessMetrics.value?.users?.length || 0 - online,
	};
});
</script>

<template>
  <div class="users flex flex-col gap-2">
    <div class="flex flex-wrap gap-1">
      <NTag class="text-xl">
        TOTAL:
        {{ accessMetrics?.users?.length }}
      </NTag>
      <NTag class="text-xl" type="success">
        ONLINE: {{ status.online }}
      </NTag>
      <NTag class="text-xl" type="default">
        OFFLINE: {{ status.offline }}
      </NTag>
    </div>

    <BUserTable :users="accessMetrics?.users || []" />
  </div>
</template>

<style scoped>

</style>