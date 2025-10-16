<script setup lang="ts">
import { Pause, Play } from "@vicons/ionicons5";
import { Icon } from "@vicons/utils";
import { breakpointsTailwind, useBreakpoints } from "@vueuse/core";
import { NButton, NInputNumber, NTag } from "naive-ui";
import { computed } from "vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();
const interval = defineModel<number>("interval", { default: 300 });

const emit = defineEmits<{
	handlePause: [];
}>();
const { total, count, pause, status } = defineProps<{
	total: number;
	count: number;
	pause: boolean;
	status: string; // ws status
}>();

const breakpoints = useBreakpoints(breakpointsTailwind);
const isTablet = computed(() => breakpoints.md.value);
</script>

<template>
  <div class="flex flex-wrap gap-2">
    <NTag v-if="isTablet" class="text-xl">
      {{ $t('totalRecords') }}: {{ total }}
    </NTag>
    <NTag class="text-xl">
      {{ $t('count') }}: {{ count }}
    </NTag>
    <NButton
        size="small"
        :type="`${!pause ? 'error' : 'success'}`"
        @click="emit('handlePause')"
        class="text-xl"
    >
      <template #icon>
        <Icon>
          <Pause v-if="!pause" />
          <Play v-else />
        </Icon>
      </template>

      {{ !pause ? $t('pause') : $t('start') }}
    </NButton>

    <NTag v-if="isTablet" class="text-xl">
      {{ $t('interval') }}:
    </NTag>
    <NInputNumber
        v-if="isTablet"
        v-model:value="interval"
        size="small"
        :show-button="false"
        class="max-w-[50px]"
    />
    <NTag v-if="isTablet" class="text-xl">
      {{ $t('wsStatus') }}: {{ status }}
    </NTag>
  </div>
</template>

<style scoped>

</style>