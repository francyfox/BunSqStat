<script setup lang="ts">
import { onMounted, ref, type Ref } from 'vue';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { getGradient, COLORS } from '@/utils/chart';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface Props {
  rpsHistory: number[];
}

const props = defineProps<Props>();

const chart: Ref<ChartJS | null> = ref(null);

const avgRps = Math.round(props.rpsHistory.reduce((a, b) => a + b, 0) / props.rpsHistory.length * 10) / 10;

const maxY = Math.max(1, ...props.rpsHistory);

const getColorPair = (rps: number) => {
  if (rps > avgRps * 1.3) return COLORS.get("5XX") || ["#e88080", "#bd6d8a"]; // red gradient for high
  if (rps > avgRps * 0.7) return COLORS.get("3XX") || ["#f2c97d", "#817257"]; // orange/yellow for medium
  return COLORS.get("2XX") || ["#63e2b7", "#7a9d44"]; // green for low
};

onMounted(() => {
  const ctxElement = document.getElementById('rpsChart') as HTMLCanvasElement;
  if (ctxElement) {
    const canvasCtx = ctxElement.getContext('2d')!;
    chart.value = new ChartJS(ctxElement, {
      type: 'bar',
      data: {
        labels: props.rpsHistory.map((_, i) => `${(i * 5)}m`),
        datasets: [{
          label: 'RPS',
          data: props.rpsHistory,
          borderWidth: 1,
          backgroundColor: (context) => {
            const chart = context.chart;
            const {ctx, chartArea} = chart;
            if (!chartArea) return null;
            const rps = props.rpsHistory[context.dataIndex];
            const colors = getColorPair(rps);
            return getGradient(ctx, chartArea, colors);
          },
          borderColor: (context) => {
            const rps = props.rpsHistory[context.dataIndex];
            const colors = getColorPair(rps);
            return colors[1]; // darker color for border
          },
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          title: {
            display: true,
            text: `RPS History (Avg: ${avgRps})`,
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            max: maxY,
            ticks: {
              stepSize: maxY / 5,
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
      },
    });
  }
});
</script>

<template>
  <div class="rps-history-chart">
    <canvas id="rpsChart" height="150"></canvas>
  </div>
</template>

<style scoped>
.rps-history-chart {
  height: 150px;
  width: 100%;
}
.rps-history-chart canvas {
  height: 100% !important;
  width: 100% !important;
}
</style>