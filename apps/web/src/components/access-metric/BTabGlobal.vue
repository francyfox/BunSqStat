<script setup lang="ts">
import MasonryWall from "@yeger/vue-masonry-wall";
import { storeToRefs } from "pinia";
import { computed, h } from "vue";
import BCardBytes from "@/components/access-metric/masonry-wall/BCardBytes.vue";
import BCardContentStats from "@/components/access-metric/masonry-wall/BCardContentStats.vue";
import BCardDuration from "@/components/access-metric/masonry-wall/BCardDuration.vue";
import BCardOptimization from "@/components/access-metric/masonry-wall/BCardOptimization.vue";
import BCardRPS from "@/components/access-metric/masonry-wall/BCardRPS.vue";
import BCardStatus from "@/components/access-metric/masonry-wall/BCardStatus.vue";
import { useStatsStore } from "@/stores/stats.ts";

const statsStore = useStatsStore();
const { accessMetrics } = storeToRefs(statsStore);

const form = defineModel<{
	limit: number;
	time?: [number, number];
}>({
	default: {
		limit: 50,
		time: undefined,
	},
});

const diffTime = computed(() => {
	if (!form.value.time) return 3600;
	return form.value.time[0] - form.value.time[1];
});

const items = computed(() => [
	{
		component: h(BCardRPS, {
			rps: accessMetrics.value?.currentStates?.rps,
			diffTime: diffTime.value,
			time: form.value.time,
		}),
	},
	{
		component: h(BCardContentStats, {
			items: accessMetrics.value?.globalStates.contentTypes.items,
		}),
	},
	{
		component: h(BCardBytes, {
			bytes: accessMetrics.value?.globalStates.bytes,
		}),
	},
	{
		component: h(BCardStatus, {
			items: accessMetrics.value?.globalStates.statusCodes.items,
		}),
	},
	{
		component: h(BCardDuration, {
			duration: accessMetrics.value?.globalStates.duration,
		}),
	},
	{
		component: h(BCardOptimization, {
			bandwidth: accessMetrics.value?.globalStates.bandwidth,
			hitRatePercent: accessMetrics.value?.globalStates.hitRatePercent,
			successRatePercent: accessMetrics.value?.globalStates.successRatePercent,
		}),
	},
]);
</script>

<template>
  <MasonryWall
      v-bind="{ items }"
      :max-columns="4"
      :gap="16"
  >
    <template #default="{ item }">
      <component :is="item.component" />
    </template>
  </MasonryWall>
</template>

<style scoped>

</style>