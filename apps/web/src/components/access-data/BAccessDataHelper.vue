<script setup lang="ts">
import { InformationCircle } from "@vicons/ionicons5";
import { Icon } from "@vicons/utils";
import { NTag, NTooltip } from "naive-ui";
</script>

<template>
  <NTooltip placement="bottom" trigger="click">
    <template #trigger>
      <Icon size="32" class="cursor-pointer">
        <InformationCircle />
      </Icon>
    </template>
    {{ $t('inputInfo') }} <a target="_blank" rel="noopener" href="https://redis.io/docs/latest/develop/ai/search-and-query/query/" class="c-amber underline">{{ $t('redisQueryLink') }}</a> like <NTag>@user: fox</NTag>
    <br>
    {{ $t('searchByIp') }} <NTag>192.168.1.1</NTag> {{ $t('autoEscaped') }}
    <br>
    {{ $t('singleNumber') }} <NTag>200</NTag> {{ $t('to') }} <NTag>[200 200]</NTag>
    <br>
    {{ $t('numberRanges') }} <NTag>[200 299]</NTag> {{ $t('or') }} <NTag>[0 20]</NTag>
  </NTooltip>
</template>

<style scoped>

</style>