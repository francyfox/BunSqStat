<script setup lang="ts">
import { InformationCircle } from "@vicons/ionicons5";
import { Icon } from "@vicons/utils";
import { NTag, NTooltip } from "naive-ui";
</script>

<template>
  <NTooltip placement="bottom" trigger="hover">
    <template #trigger>
      <Icon size="32" class="cursor-pointer">
        <InformationCircle />
      </Icon>
    </template>
    This input use for <a target="_blank" rel="noopener" href="https://redis.io/docs/latest/develop/ai/search-and-query/query/" class="c-amber underline">redis query</a> like <NTag>@user: fox</NTag>
    <br>
    Search by IP: <NTag>192.168.1.1</NTag> (auto-escaped)
    <br>
    Single number: <NTag>200</NTag> → <NTag>[200 200]</NTag>
    <br>
    Number ranges: <NTag>[200 299]</NTag> or <NTag>[0 20]</NTag>
  </NTooltip>
</template>

<style scoped>

</style>