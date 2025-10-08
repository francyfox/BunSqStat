<script setup lang="ts">
import { storeToRefs } from "pinia";
import BUserTable from "@/components/access-metric/BUserTable.vue";
import { useStatsStore } from "@/stores/stats.ts";

const statsStore = useStatsStore();
const { accessMetrics } = storeToRefs(statsStore);
</script>

<template>
  <div class="users flex flex-col gap-5">
    <BUserTable :users="accessMetrics?.users" />
  </div>
</template>

<style scoped>

</style>