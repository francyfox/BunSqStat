<script setup lang="ts">
import { Copy } from "@vicons/ionicons5";
import { Icon } from "@vicons/utils";
import { useClipboard } from "@vueuse/core";
import { NTooltip } from "naive-ui";

const { text } = defineProps<{
	text: string;
}>();

const { copy, copied, isSupported } = useClipboard({ source: text });
</script>

<template>
  <n-tooltip placement="bottom" trigger="hover">
    <template #trigger>
      <a :href="text"
         class="copy flex items-center gap-2"
         @click.prevent="copy(text)"
      >
        <Icon>
          <Copy />
        </Icon>

        <span>{{ text }}</span>
      </a>
    </template>
    <span v-if="!isSupported">Your browser does not support Clipboard API.</span>
    <span v-if="!copied">Copy</span>
    <span v-else>Copied!</span>
  </n-tooltip>
</template>

<style scoped>

</style>