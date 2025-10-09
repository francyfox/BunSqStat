<script setup lang="ts">
import BCardMetric from "@/components/BCardMetric.vue";
import { diffDate } from "@/utils/date.ts";

const { rps, diffTime, time } = defineProps<{
	rps: number;
	diffTime: number;
	time?: [number, number];
}>();
</script>

<template>
  <BCardMetric>
    {{ rps?.toFixed(5) || "0" }} <br>

    <span class="text-lg">
        {{ (rps * diffTime).toFixed(0) }} in {{ diffDate(time) }}
    </span>

    <template #name>
      RPS
    </template>
  </BCardMetric>
</template>

<style scoped>

</style>