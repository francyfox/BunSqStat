<script setup lang="ts">
import MasonryWall from "@yeger/vue-masonry-wall";
import { storeToRefs } from "pinia";
import { h } from "vue";
import BCardBytes from "@/components/access-metric/masonry-wall/BCardBytes.vue";
import BCardDuration from "@/components/access-metric/masonry-wall/BCardDuration.vue";
import BCardStatus from "@/components/access-metric/masonry-wall/BCardStatus.vue";
import BCardUserSpeed from "@/components/access-metric/masonry-wall/BCardUserSpeed.vue";
import { useStatsStore } from "@/stores/stats.ts";

const statsStore = useStatsStore();
const { accessMetrics } = storeToRefs(statsStore);

const items = [
	{
		component: h(BCardBytes, {
			bytes: accessMetrics.value?.globalStates.bytes,
		}),
	},
	{
		component: h(BCardUserSpeed, {
			users: accessMetrics.value?.users,
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