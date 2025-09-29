<script setup lang="ts">
import { NTag } from "naive-ui";
import BCardMetric from "@/components/BCardMetric.vue";
import { formatBytes } from "@/utils/string.ts";

const { bandwidth } = defineProps<{
	bandwidth: number;
	hitRatePercent: number;
	successRatePercent: number;
}>();
</script>

<template>
  <BCardMetric>
    <div class="flex flex-wrap items-center gap-2">
      <div class="flex-grow">
        <div class="text-xl">bandwidth</div>
        <NTag size="large">
          <div class="text-2xl">{{ formatBytes(bandwidth) }}/s</div>
        </NTag>
      </div>

      <div class="flex-grow">
        <div class="text-xl">
          Hit Rate
        </div>
        <NTag size="large">
          <div class="text-2xl">{{ hitRatePercent.toFixed(2) || 0 }} %</div>
        </NTag>
      </div>


      <div class="w-full">
        <div class="text-xl">Success Rate</div>
        <NTag size="large">
          <div class="text-2xl">{{ successRatePercent.toFixed(2) || 0 }} %</div>
        </NTag>
      </div>
    </div>


    <template #name>
      OPTIMIZATION
    </template>
  </BCardMetric>
</template>

<style scoped>

</style>