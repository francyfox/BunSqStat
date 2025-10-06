<script setup lang="ts">
import { InformationCircle } from "@vicons/ionicons5";
import { Icon } from "@vicons/utils";
import {
	NButton,
	NFormItem,
	NInput,
	NInputNumber,
	NTooltip,
	useMessage,
} from "naive-ui";
import { storeToRefs } from "pinia";
import { onMounted } from "vue";
import { useSettingsStore } from "@/stores/settings.ts";
import { formatBytes } from "@/utils/string.ts";

const store = useSettingsStore();
const { loading, error } = storeToRefs(store);
const message = useMessage();

onMounted(async () => {
	await store.getMaxMemory();
});

async function handleUpdateMaxMemory() {
	await store.setMaxMemory(store.settings.maxMemory);

	if (error.value) {
		message.error(error.value);
	} else {
		message.success("Max Memory updated");
	}
}

async function handleUpdateAliases() {
	await Promise.all([store.setAliases(), store.getAliases()]);

	if (error.value) {
		message.error(error.value);
	} else {
		message.success("Aliases updated");
	}
}
</script>

<template>
  <section>
    <div class="mx-a container">
      <div class="flex flex-col gap-5">
        <div class="flex flex-col gap-2">
          <div class="text-lg font-500">Redis Settings</div>
          <div class="flex items-center gap-1">
            <div class="w-full max-w-sm relative flex flex-col gap-1">
              <NFormItem
                  label="Max Memory:"
              >
                <NInputNumber
                    v-model:value="store.settings.maxMemory"
                    class="w-full"
                >
                  <template #prefix>
                    byte
                  </template>
                  <template #suffix>
                    = {{ formatBytes(store.settings.maxMemory) }}
                  </template>
                </NInputNumber>
              </NFormItem>
            </div>

            <NButton
                type="primary"
                @click="handleUpdateAliases"
                :loading="store.loading"
                class="min-w-[120px]"
            >
              SET
            </NButton>
            <NTooltip placement="bottom" trigger="hover">
              <template #trigger>
                <Icon size="32" class="cursor-pointer">
                  <InformationCircle />
                </Icon>
              </template>
              This app watch logs 1 hour. Set optimal size for your company
            </NTooltip>
          </div>
        </div>

        <div class="flex flex-col gap-2">
          <div class="text-lg font-500 mb-3">BunSqStat Settings</div>

          <div class="flex gap-1">
            <NFormItem
                label="User alias by ip (Names without spaces)"
                class="w-full max-w-sm"
            >
              <NInput
                  v-model:value="store.settings.aliases"
                  type="textarea"
                  size="small"
                  :autosize="{
            minRows: 3,
            maxRows: 5,
          }"
                  placeholder="127.0.0.1 username 127.0.0.2 username2 ..."
                  class="w-full"
              />
            </NFormItem>

            <div class="pt-[25px] flex gap-1">
              <NButton
                  type="primary"
                  @click="handleUpdateAliases"
                  :loading="store.loading"
                  class="min-w-[120px]"
              >
                SET
              </NButton>

              <NTooltip
                  placement="bottom"
                  trigger="hover"
              >
                <template #trigger>
                  <Icon size="32"
                        class="cursor-pointer"
                  >
                    <InformationCircle />
                  </Icon>
                </template>
                User search doesnt work with alias. Old ip will be replaced. <br>Alias uses only on frontend, and dont overwrite redis log usernames
              </NTooltip>
            </div>
          </div>
        </div>
      </div>
      
      <div class="flex flex-col max-w-lg bg-red-900/20 border-red-500 border-1 p-3 gap-2">
        <div class="text-red text-sm font-500">
          DANGER ZONE
        </div>

        <div class="flex flex-wrap gap-2">
          <NButton tertiary>
            DROP ACCESS LOGS
          </NButton>
          <NButton tertiary>
            DROP ALIASES
          </NButton>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
label {
  font-weight: bold;
}
</style>