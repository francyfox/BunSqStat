<script setup lang="ts">
import { Heart } from "@vicons/ionicons5";
import { Icon } from "@vicons/utils";
</script>

<template>
  <section class="py-3 pos-sticky sticky-top">
    <div class="container mx-a">
      <div class="flex flex-wrap gap-2 items-center">
        <h1 class="text-xl">BunSqStat |</h1>
        <div class="flex gap-2 items-center text-md">
          <span>{{ $t('madeWith') }}</span>

          <Icon size="16">
            <Heart />
          </Icon>

          <a href="https://github.com/francyfox" target="_blank" rel="noopener" class="underline">by Hellizart</a>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>

</style>