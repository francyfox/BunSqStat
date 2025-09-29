<script setup lang="ts">
import BCardMetric from "@/components/BCardMetric.vue";
import BStatuses from "@/components/BStatuses.vue";

const { items = [] } = defineProps<{
	items:
		| {
				count: any;
				status: any;
		  }[]
		| undefined;
}>();
</script>

<template>
  <BCardMetric>
    <BStatuses
        :status="items"
    />
    <template #name>
      STATUS
    </template>
  </BCardMetric>
</template>

<style scoped>

</style>