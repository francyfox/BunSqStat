<script setup lang="ts">
import { watchDebounced } from "@vueuse/core";
import {
	NDatePicker,
	NForm,
	NFormItem,
	NInputNumber,
	NTabPane,
	NTabs,
} from "naive-ui";
import { storeToRefs } from "pinia";
import { ref } from "vue";
import BCardMetric from "@/components/BCardMetric.vue";
import BStatuses from "@/components/BStatuses.vue";
import { useStatsStore } from "@/stores/stats.ts";
import { formatBytes, formatMilliseconds } from "@/utils/string.ts";

const statsStore = useStatsStore();
const { accessMetrics } = storeToRefs(statsStore);

const form = ref({
	limit: 50,
	time: undefined,
});

await statsStore.getAccessMetrics();

watchDebounced(form, async (v) => {
	await statsStore.getAccessMetrics(v);
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
            :actions="['now', 'clear']"
            size="large"
            clearable
        />
      </NFormItem>

      {{ form.time }}
    </NForm>
    <NTabs
        type="line"
        size="large"
        animated
    >
      <NTabPane name="per-60" tab="Per 60 sec">
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

      <NTabPane name="per-month" tab="Per Month">
        <div class="metric-list grid grid-cols-4 items-start gap-5">
          <BCardMetric>
            {{ formatBytes(accessMetrics?.globalStates.bytes) }}

            <template #name>
              TOTAL REQUEST SIZE
            </template>
          </BCardMetric>

          <BCardMetric>
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

          <BCardMetric>
            <BStatuses
                :status="accessMetrics?.globalStates.statusCodes.items"
            />
            <template #name>
              STATUS
            </template>
          </BCardMetric>
        </div>
      </NTabPane>
    </NTabs>


  </div>
</template>

<style scoped>

</style>