<script setup lang="ts">
import { watchDebounced } from "@vueuse/core";
import MasonryWall from "@yeger/vue-masonry-wall";
import {
	NDatePicker,
	NForm,
	NFormItem,
	NInputNumber,
	NTabPane,
	NTabs,
} from "naive-ui";
import { storeToRefs } from "pinia";
import { onMounted, onUnmounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import BCardMetric from "@/components/BCardMetric.vue";
import BStatuses from "@/components/BStatuses.vue";
import BUserSpeed from "@/components/BUserSpeed.vue";
import { useStatsStore } from "@/stores/stats.ts";
import { formatBytes, formatMilliseconds } from "@/utils/string.ts";

const route = useRoute();
const router = useRouter();

const statsStore = useStatsStore();
const { accessMetrics } = storeToRefs(statsStore);

const form = ref({
	limit: 50,
	time: undefined,
});

const tab = ref("actual");

await statsStore.getAccessMetrics();

function handleTabChange(tab: string) {
	router.push({ name: route.name, hash: `#${tab}` });
}

watchDebounced(form, async (v) => {
	await statsStore.getAccessMetrics(v);
});

watch(
	() => route.hash,
	(v) => {
		tab.value = v ? v.replace("#", "") : "actual";
	},
);

onMounted(() => {
	if (route.hash) {
		tab.value = route.hash.replace("#", "");
	}
});

onUnmounted(() => {
	window.location.hash = "";
});
</script>

<template>
  <div class="flex flex-col gap-5">
    ff
    <MasonryWall :items="['test', 'fff']" :column-width="300" :gap="16">
      <template #default="{ item }">
        {{ item }}
      </template>
    </MasonryWall>
    <NForm :model="form"
           class="flex gap-2"
    >
      <NFormItem
          label="Limit records"
          class="max-w-[150px]"
      >
        <NInputNumber
            v-model:value="form.limit"
            size="large"
        />
      </NFormItem>

      <NFormItem label="Limit by end time (UTC)">
        <NDatePicker
            v-model:value="form.time"
            type="datetimerange"
            :actions="['now', 'clear']"
            size="large"
            clearable
        />
      </NFormItem>

      {{ form.time }}
    </NForm>
    <NTabs
        v-model:value="tab"
        type="line"
        size="large"
        @update:value="handleTabChange"
        animated
    >
      <NTabPane name="actual" tab="Actual">
        <div class="metric-list grid grid-cols-4 gap-5">
          <BCardMetric>
            {{ accessMetrics?.currentStates.rps }}

            <template #name>
              RPS
            </template>
          </BCardMetric>

          <BCardMetric>
            <BStatuses
                :status="accessMetrics?.currentStates.statusCodes.items"
            />
            <template #name>
              STATUS
            </template>
          </BCardMetric>
        </div>
      </NTabPane>

      <NTabPane name="per-n" tab="Per N">
        <div class="metric-list columns-4">
          <BCardMetric class="max-w-sm">
            {{ formatBytes(accessMetrics?.globalStates.bytes) }}

            <template #name>
              TOTAL REQUEST SIZE
            </template>
          </BCardMetric>

          <BCardMetric class="max-w-sm">
            <div class="text-center text-sm font-300">
              hour:minute:second:millisecond
            </div>
            <div class="text-center font-900 text-4xl">
              {{ formatMilliseconds(accessMetrics?.globalStates.duration) }}
            </div>

            <template #name>
              DURATION
            </template>
          </BCardMetric>

          <BCardMetric class="max-w-sm">
            <BStatuses
                :status="accessMetrics?.globalStates.statusCodes.items"
            />
            <template #name>
              STATUS
            </template>
          </BCardMetric>

          <BCardMetric class="max-w-sm">
            <BUserSpeed :users="accessMetrics?.users" />
          </BCardMetric>
        </div>
      </NTabPane>
    </NTabs>
  </div>
</template>

<style lang="postcss" scoped>
.metric-list {
  column-gap: 0.5rem;
  .n-card {
    margin-bottom: 0.5rem;
  }
}
</style>