<script setup lang="ts">
import BCardMetric from "@/components/BCardMetric.vue";
import { formatBytes } from "@/utils/string.ts";

const { bytes = 0 } = defineProps<{
	bytes?: number;
}>();
</script>

<template>
  <BCardMetric>
    {{ formatBytes(bytes) }}

    <template #name>
      {{ $t('totalRequestSizeTitle') }}
    </template>
  </BCardMetric>
</template>

<style scoped>

</style>