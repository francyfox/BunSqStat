<script setup lang="ts">
import { useWebSocket, watchDebounced } from "@vueuse/core";
import {
	NDatePicker,
	NForm,
	NFormItem,
	NInputNumber,
	NTabPane,
	NTabs,
	useNotification,
} from "naive-ui";
import { storeToRefs } from "pinia";
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import BCardMetric from "@/components/BCardMetric.vue";
import BStatuses from "@/components/BStatuses.vue";
import BUserSpeed from "@/components/BUserSpeed.vue";
import { WS_URL } from "@/consts.ts";
import { useStatsStore } from "@/stores/stats.ts";
import { diffDate } from "@/utils/date.ts";
import { formatBytes, formatMilliseconds } from "@/utils/string.ts";

const route = useRoute();
const router = useRouter();
const notification = useNotification();

const statsStore = useStatsStore();
const { accessMetrics } = storeToRefs(statsStore);

const form = ref({
	limit: 50,
	time: undefined,
});

const diffTime = computed(() => {
	if (!form.value.time) return 3600;
	return form.value.time[0] - form.value.time[1];
});

const tab = ref("actual");

await statsStore.getAccessMetrics();

function handleTabChange(tab: string) {
	router.push({ name: route.name, hash: `#${tab}` });
}

watchDebounced(
	form,
	async (v) => {
		const { limit, time: [startTime, endTime] = [] } = v;

		await statsStore.getAccessMetrics({
			limit,
			startTime,
			endTime,
		});
	},
	{
		deep: true,
		debounce: 500,
	},
);

watch(
	() => route.hash,
	(v) => {
		tab.value = v ? v.replace("#", "") : "actual";
	},
);

const { data } = useWebSocket(`${WS_URL}/ws/access-logs`, {
	autoReconnect: {
		retries: 3,
		delay: 1000,
		onFailed() {
			notification.error({
				content: "Failed to connect WebSocket after 3 retries",
			});
		},
	},
});

watchDebounced(data, async (v) => {
	if (!v) return;
	let value: any;
	try {
		value = JSON.parse(v);
	} catch (_) {
		// Ignore non-JSON messages
		return;
	}

	if (
		typeof value?.changedLinesCount !== "number" ||
		value.changedLinesCount <= 0
	) {
		return;
	}
	console.log(`Received ${value.changedLinesCount} new log entries`);

	await statsStore.getAccessMetrics({
		limit: form.value.limit,
		startTime: form.value.time ? form.value.time[0] : undefined,
		endTime: form.value.time ? form.value.time[1] : undefined,
	});
});

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
            :actions="['now', 'clear', 'confirm']"
            size="large"
            clearable
        />
      </NFormItem>
    </NForm>
    <NTabs
        v-model:value="tab"
        type="line"
        size="large"
        @update:value="handleTabChange"
        animated
    >
      <NTabPane name="actual" tab="By time">
        <div class="metric-list columns-4">
          <BCardMetric>
            {{ accessMetrics?.currentStates?.rps?.toFixed(5) || "0" }} <br>
            <span class="text-lg">
              {{ accessMetrics?.currentStates?.rps * diffTime }} in {{ diffDate(form.time) }}
            </span>

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

      <NTabPane name="per-n" tab="By limit">
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