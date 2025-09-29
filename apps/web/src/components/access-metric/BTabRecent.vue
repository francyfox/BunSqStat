<script setup lang="ts">
import MasonryWall from "@yeger/vue-masonry-wall";
import { storeToRefs } from "pinia";
import { computed, h } from "vue";
import BCardRPS from "@/components/access-metric/masonry-wall/BCardRPS.vue";
import BCardStatus from "@/components/access-metric/masonry-wall/BCardStatus.vue";
import { useStatsStore } from "@/stores/stats.ts";

const form = defineModel<{
	limit: number;
	time?: [number, number];
}>({
	default: {
		limit: 50,
		time: undefined,
	},
});

const statsStore = useStatsStore();
const { accessMetrics } = storeToRefs(statsStore);

const diffTime = computed(() => {
	if (!form.value.time) return 3600;
	return form.value.time[0] - form.value.time[1];
});

const items = [
	{
		component: h(BCardRPS, {
			rps: accessMetrics.value?.currentStates?.rps,
			diffTime: diffTime.value,
			time: form.value.time,
		}),
	},
	{
		component: h(BCardStatus, {
			items: accessMetrics.value?.currentStates.statusCodes.items,
		}),
	},
];
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