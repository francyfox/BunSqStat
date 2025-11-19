<script setup lang="ts">
// biome-ignore assist/source/organizeImports: <explanation>
import { computed } from "vue";
import {
	Chart as ChartJS,
	CategoryScale,
	LinearScale,
	BarElement,
	Title,
	Tooltip,
} from "chart.js";
import { Bar } from "vue-chartjs";
import { COLORS, getGradient } from "@/utils/chart";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip);

interface Props {
	rpsHistory: number[];
}

const props = defineProps<Props>();

const avgRps = computed(
	() =>
		Math.round(
			(props.rpsHistory.reduce((a, b) => a + b, 0) / props.rpsHistory.length) *
				10,
		) / 10,
);

const maxY = computed(() => Math.max(1, ...props.rpsHistory));

const data = computed(() => ({
	labels: Array.from({ length: 12 }, (_, i) => `${60 - i * 5}m`),
	datasets: [
		{
			label: "RPS",
			data: props.rpsHistory,
			borderWidth: 1,
			backgroundColor: (context: any) => {
				const chart = context.chart;
				const { ctx, chartArea } = chart;
				if (!chartArea) {
					return null;
				}
				const rps = props.rpsHistory[context.dataIndex] || 0;
				const colors =
					rps > avgRps.value * 1.3
						? COLORS.get("5XX") || ["#e88080", "#bd6d8a"]
						: rps > avgRps.value * 0.7
							? COLORS.get("3XX") || ["#f2c97d", "#817257"]
							: COLORS.get("2XX") || ["#63e2b7", "#7a9d44"];
				return getGradient(ctx, chartArea, colors as any);
			},
			borderColor: (context: any) => {
				const rps = props.rpsHistory[context.dataIndex] || 0;
				const colors =
					rps > avgRps.value * 1.3
						? COLORS.get("5XX") || ["#e88080", "#bd6d8a"]
						: rps > avgRps.value * 0.7
							? COLORS.get("3XX") || ["#f2c97d", "#817257"]
							: COLORS.get("2XX") || ["#63e2b7", "#7a9d44"];
				return colors[1]; // darker for border
			},
		},
	],
}));

const options = computed(() => ({
	responsive: true,
	maintainAspectRatio: false,
	animation: false,
	plugins: {
		legend: {
			display: false,
		},
		title: {
			display: true,
			text: `RPS History (Avg: ${avgRps.value})`,
		},
	},
	scales: {
		y: {
			beginAtZero: true,
			max: maxY.value,
			ticks: {
				stepSize: maxY.value / 5,
			},
		},
		x: {
			ticks: {
				maxRotation: 45,
			},
		},
	},
	elements: {
		bar: {
			borderRadius: 4,
		},
	},
}));
</script>

<template>
  <div class="rps-history-chart">
    <Bar
      v-if="props.rpsHistory?.length > 0"
      v-bind="{ data, options }"
      class="!h-[150px] !w-full"
    />
    <div v-else class="text-warmgray">{{ $t("noData") }}</div>
  </div>
</template>

<style scoped>
.rps-history-chart {
  height: 150px;
  width: 100%;
}
</style>
