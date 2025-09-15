<script setup lang="ts">
import {
	BarElement,
	CategoryScale,
	type ChartData,
	Chart as ChartJS,
	type ChartOptions,
	Filler,
	LinearScale,
	Tooltip,
} from "chart.js";
import { computed } from "vue";
import { Bar } from "vue-chartjs";
import { COLORS, getGradient } from "@/utils/chart.ts";

ChartJS.register(BarElement, Tooltip, Filler, CategoryScale, LinearScale);

const { status } = defineProps<{
	status: { status: string; count: number }[];
}>();

const data = computed<ChartData<"bar">>(() => {
	return {
		labels: status.map((i) => i.status),
		datasets: [
			{
				axis: "y",
				fill: false,
				data: status.map((i) => i.count),
				hoverOffset: 4,
				barPercentage: 1,
				categoryPercentage: 0.3,
				backgroundColor: (context) => {
					const statusItem = status.find((j) => j.count === context.raw);
					const chart = context.chart;
					const { ctx, chartArea } = chart;

					if (!chartArea) {
						return;
					}

					return getGradient(
						ctx,
						chartArea,
						COLORS.get(statusItem?.status || "5XX"),
					);
				},
			},
		],
	};
});
const options = computed<ChartOptions<"bar">>(() => {
	return {
		responsive: true,
		indexAxis: "y",
		aspectRatio: false,
		scales: {
			y: {
				offset: 0.2,
			},
		},
	};
});
</script>

<template>
  <div class="status-chart">
      <Bar
          v-if="status.length > 0"
          v-bind="{ options, data }"
          class="!h-[120px] !w-full"
      />
      <div v-else class="text-warmgray">NO DATA</div>
  </div>
</template>

<style scoped>

</style>