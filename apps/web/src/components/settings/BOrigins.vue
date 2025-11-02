<script setup lang="ts">
import { NSwitch, NTable } from "naive-ui";

const origins =
	defineModel<
		{ id: string; host: string; listen: boolean; active: boolean }[]
	>();
</script>

<template>
  <NTable
      :bordered="false"
      :single-line="false"
      class="rounded-md shadow-sm max-w-sm mb-3"
  >
    <thead>
      <tr>
        <th>
          Origin
        </th>

        <th>
          Display
        </th>
        <th>
          Listen on server
        </th>
      </tr>
    </thead>
    <tbody>
      <tr
          v-for="i in origins"
          :key="i.id"
      >
        <td>
          {{ i?.host }}
        </td>
        <td>
          <NSwitch v-model:value="i.active" />
        </td>
        <td>
          <NSwitch v-model:value="i.listen" />
        </td>
      </tr>
    </tbody>
  </NTable>
</template>

<style scoped>

</style>