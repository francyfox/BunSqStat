<script setup lang="ts">
import { useEventBus } from "@vueuse/core";
import { useNotification } from "naive-ui";
import { notificationKey } from "@/utils/accessKey.ts";

const notification = useNotification();

const notificationBus = useEventBus(notificationKey);

notificationBus.on((event, data) => {
	notification[event](data);
});
</script>

<template>

</template>

<style scoped>

</style>