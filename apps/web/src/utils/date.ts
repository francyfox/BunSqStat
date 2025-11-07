import { storeToRefs } from "pinia";
import { useDayjs } from "@/composables/dayjs.ts";
import { useSettingsStore } from "@/stores/settings.ts";

export function getDate(date: number | string) {
	const dayjs = useDayjs();
	const store = useSettingsStore();
	const { timezone } = storeToRefs(store);

	return dayjs(Number(date)).tz(timezone.value).format("HH:mm:ss DD/MM");
}

export function getRelativeTime(date: number | string) {
	const dayjs = useDayjs();

	return dayjs(Number(date)).fromNow();
}

export function diffDate(dates?: [number, number]) {
	if (!dates) return "1 h.";

	const dayjs = useDayjs();
	const startDate = dayjs(dates[0]);
	const endDate = dayjs(dates[1]);
	const diff = (dates[1] - dates[0]) / 1000;

	if (diff < 60) {
		return `${endDate.diff(startDate, "s")} sec.`;
	} else if (diff < 3600) {
		return `${endDate.diff(startDate, "m")} min.`;
	} else if (diff < 86400) {
		return `${endDate.diff(startDate, "h")} h.`;
	} else if (diff < 2592000) {
		return `${endDate.diff(startDate, "d")} d.`;
	}

	return `${endDate.diff(startDate, "M")} m.`;
}
