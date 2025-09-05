<script setup lang="ts">
import { Heart } from "@vicons/ionicons5";
import { Icon } from "@vicons/utils";
</script>

<template>
  <section class="py-3 pos-sticky sticky-top">
    <div class="container mx-a">
      <div class="flex flex-col">
        <h1 class="text-3xl">BunSqStat</h1>
        <div class="flex gap-2 items-center text-md">
         <span>Made with</span>

          <Icon size="16">
            <Heart />
          </Icon>

          <span>by Hellizart</span>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>

</style>