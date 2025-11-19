<script setup lang="ts">
import BRpsHistory from "@/components/access-metric/BRpsHistory.vue";
import BCardMetric from "@/components/BCardMetric.vue";
import { diffDate } from "@/utils/date.ts";

const {
	rps,
	diffTime,
	time = [0, 60000],
} = defineProps<{
	rps: number;
	diffTime: number;
	time?: [number, number];
	rpsHistory: number[];
}>();
</script>

<template>
  <BCardMetric>
    {{ rps?.toFixed(5) || "0" }} <br>

    <span class="text-lg">
        {{ (rps * diffTime).toFixed(0) }} in {{ diffDate(time) }}
    </span>

    <BRpsHistory :rps-history="rpsHistory" />

    <template #name>
      {{ $t('rpsTitle') }}
    </template>
  </BCardMetric>
</template>

<style scoped>

</style>