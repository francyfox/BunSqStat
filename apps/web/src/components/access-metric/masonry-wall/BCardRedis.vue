<script setup lang="ts">
import { NProgress } from "naive-ui";
import { computed } from "vue";
import BCardMetric from "@/components/BCardMetric.vue";
import { formatBytes } from "@/utils/string.ts";

const { maxMemory = 0, usedMemory = 0 } = defineProps<{
	maxMemory?: number;
	usedMemory?: number;
}>();

const percentage = computed(() =>
	parseFloat(Number((usedMemory / maxMemory) * 100).toString()).toFixed(2),
);
</script>

<template>
  <BCardMetric>
    <div class="flex justify-center mb-3">
      <NProgress
          type="dashboard"
          gap-position="bottom"
          :percentage="percentage"
      />
    </div>

    REDIS
    <template #name>
      <ul>
        <li>
          {{ $t("maxMemory") }}: {{ formatBytes(maxMemory) }}
        </li>
        <li>
          {{ $t("usedMemory") }}: {{ formatBytes(usedMemory) }}
        </li>
      </ul>
    </template>
  </BCardMetric>
</template>

<style scoped>

</style>