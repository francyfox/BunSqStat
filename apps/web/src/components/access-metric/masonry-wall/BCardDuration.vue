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
      {{ $t('durationTimeFormat') }}
    </div>

    <div class="text-center font-900 text-4xl">
      {{ formatMilliseconds(duration) }}
    </div>

    <template #name>
      {{ $t('durationTitle') }}
    </template>
  </BCardMetric>
</template>

<style scoped>

</style>