<script setup lang="ts">
import { storeToRefs } from "pinia";
import { useLoading } from "@/composables/loading.ts";
import { useSettingsStore } from "@/stores/settings.ts";
import { useStatsStore } from "@/stores/stats.ts";

const settinsStore = useSettingsStore();
const { loading, error } = storeToRefs(settinsStore);

const statsStore = useStatsStore();
const { loading: loadingStats, error: errorStats } = storeToRefs(statsStore);

useLoading(loading, error);
useLoading(loadingStats, errorStats);
</script>

<template>

</template>

<style scoped>

</style>