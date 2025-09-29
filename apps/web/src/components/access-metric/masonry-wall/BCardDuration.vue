<script setup lang="ts">
import BCardMetric from "@/components/BCardMetric.vue";
import { formatMilliseconds } from "@/utils/string.ts";

const { duration = 0 } = defineProps<{
	duration?: number;
}>();
</script>

<template>
  <BCardMetric>
    <div class="text-center text-sm font-300">
      hour:minute:second:millisecond
    </div>

    <div class="text-center font-900 text-4xl">
      {{ formatMilliseconds(duration) }}
    </div>

    <template #name>
      DURATION
    </template>
  </BCardMetric>
</template>

<style scoped>

</style>