<script setup lang="ts">
import { BarChart, BookOutline as BookIcon } from "@vicons/ionicons5";
import type { MenuOption } from "naive-ui";
import { NIcon, NLayout, NLayoutContent, NLayoutSider, NMenu } from "naive-ui";
import type { Component } from "vue";
import { h, ref } from "vue";
import { RouterLink } from "vue-router";

function renderIcon(icon: Component) {
	return () => h(NIcon, null, { default: () => h(icon) });
}

const menuOptions: MenuOption[] = [
	{
		label: () =>
			h(
				RouterLink,
				{
					to: {
						name: "/",
					},
				},
				{
					default: () => "Access Log Data",
				},
			),
		key: "access-log-data",
		icon: renderIcon(BookIcon),
	},
	{
		label: () =>
			h(
				RouterLink,
				{
					to: {
						name: "/access-log-metrics",
					},
				},
				{
					default: () => "Access Log Metrics",
				},
			),
		key: "access-log-metrics",
		icon: renderIcon(BarChart),
	},
];

const collapsed = ref(false);
</script>

<template>
  <n-layout has-sider>
    <n-layout-sider
        bordered
        collapse-mode="width"
        :collapsed-width="64"
        :width="240"
        :collapsed="collapsed"
        show-trigger
        @collapse="collapsed = true"
        @expand="collapsed = false"
    >
      <n-menu
          :collapsed="collapsed"
          :collapsed-width="64"
          :collapsed-icon-size="22"
          :options="menuOptions"
      />
    </n-layout-sider>


    <n-layout-content content-style="padding: 24px;">
      <slot />
    </n-layout-content>
  </n-layout>
</template>

<style scoped>

</style>