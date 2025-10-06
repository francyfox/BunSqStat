<script setup lang="ts">
import {
	Accessibility,
	BarChart,
	BookOutline as BookIcon,
	CogOutline,
} from "@vicons/ionicons5";
import { breakpointsTailwind, useBreakpoints } from "@vueuse/core";
import type { MenuOption } from "naive-ui";
import {
	NIcon,
	NLayout,
	NLayoutContent,
	NLayoutFooter,
	NLayoutSider,
	NMenu,
} from "naive-ui";
import {
	type Component,
	computed,
	h,
	onMounted,
	ref,
	shallowRef,
	watch,
} from "vue";
import { RouterLink } from "vue-router";

const breakpoints = useBreakpoints(breakpointsTailwind);

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
	{
		label: () =>
			h(
				RouterLink,
				{
					to: {
						name: "/settings",
					},
				},
				{
					default: () => "Settings",
				},
			),
		key: "settings",
		icon: renderIcon(CogOutline),
	},
	{
		label: () =>
			h(
				RouterLink,
				{
					to: {
						name: "/about",
					},
				},
				{
					default: () => "About",
				},
			),
		key: "about",
		icon: renderIcon(Accessibility),
	},
];

const collapsed = ref(false);

const isTablet = computed(() => breakpoints.xl.value);

watch(breakpoints.xl, (v) => {
	if (!v) {
		collapsed.value = true;
	} else {
		collapsed.value = false;
	}
});

onMounted(() => {
	setTimeout(() => {
		if (!breakpoints.xl.value) {
			collapsed.value = true;
		} else {
			collapsed.value = false;
		}
	});
});
</script>

<template>
  <NLayout
      position="absolute"
      :has-sider="isTablet"
  >
    <NLayoutSider
        v-if="isTablet"
        bordered
        collapse-mode="width"
        :collapsed-width="64"
        :width="240"
        :collapsed="collapsed"
        show-trigger
        @collapse="collapsed = true"
        @expand="collapsed = false"
    >
      <NMenu
          mode="vertical"
          :collapsed="collapsed"
          :collapsed-width="64"
          :collapsed-icon-size="22"
          :options="menuOptions"
          responsive
      />
    </NLayoutSider>

    <NLayoutFooter
        v-if="!isTablet"
        position="absolute"
        class="z-50"
    >
      <NMenu
          mode="horizontal"
          :icon-size="24"
          :collapsed-width="64"
          :collapsed-icon-size="22"
          :options="menuOptions"
      />
    </NLayoutFooter>


    <NLayoutContent content-style="padding: 16px;">
      <slot />
    </NLayoutContent>
  </NLayout>
</template>

<style scoped>

</style>