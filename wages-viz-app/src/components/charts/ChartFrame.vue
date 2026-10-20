<script setup lang="ts">
import { ref } from 'vue'
export interface ChartTableRow {
  key: string
  label: string
  values: readonly (string | number | null)[]
}
defineProps<{
  id: string
  title: string
  subtitle: string
  loading: boolean
  error: string
  empty: string
  fullscreen?: boolean
  columns: readonly string[]
  tableRows: readonly ChartTableRow[]
  note: string
  selected?: string
}>()
const emit = defineEmits<{ retry: []; select: [key: string] }>()
const view = ref<'chart' | 'table'>('chart')
</script>
<template>
  <section
    class="chart-frame"
    :class="{ expanded: fullscreen }"
    :aria-labelledby="`${id}-title`"
    :aria-busy="loading"
  >
    <div class="comparison-heading">
      <h2 :id="`${id}-title`">{{ title }}</h2>
      <p>{{ subtitle }}</p>
    </div>
    <div class="comparison-tools">
      <div role="group" :aria-label="`${title} view`">
        <button
          :disabled="loading || !!error || !tableRows.length"
          :aria-pressed="view === 'chart'"
          @click="view = 'chart'"
        >
          Chart</button
        ><button
          :disabled="loading || !!error || !tableRows.length"
          :aria-pressed="view === 'table'"
          @click="view = 'table'"
        >
          Table
        </button>
      </div>
      <slot name="controls" />
    </div>
    <p v-if="loading" role="status" class="comparison-state">Loading source observations…</p>
    <div v-else-if="error" role="alert" class="comparison-state">
      <p>{{ error }}</p>
      <button @click="emit('retry')">Retry data</button>
    </div>
    <div v-else-if="!tableRows.length" class="comparison-state">
      <h3>{{ empty }}</h3>
      <button @click="emit('retry')">Reload data</button>
    </div>
    <template v-else>
      <slot name="detail" />
      <div
        v-if="view === 'chart'"
        class="comparison-scroll"
        role="region"
        :aria-label="`${title} chart; scroll horizontally or use Table for exact values`"
        tabindex="0"
      >
        <slot />
      </div>
      <div
        v-else
        class="comparison-scroll"
        role="region"
        :aria-label="`${title} source values table`"
        tabindex="0"
      >
        <table role="table">
          <caption>
            {{
              subtitle
            }}
            · source values
          </caption>
          <thead>
            <tr>
              <th scope="col">{{ columns[0] }}</th>
              <th v-for="column in columns.slice(1)" :key="column" scope="col">{{ column }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in tableRows" :key="row.key" :class="{ selected: row.key === selected }">
              <th scope="row">
                <button :aria-pressed="row.key === selected" @click="emit('select', row.key)">
                  {{ row.label }}
                </button>
              </th>
              <td v-for="(value, index) in row.values" :key="index">
                <span class="cell-label" aria-hidden="true">{{ columns[index + 1] }}</span
                ><span class="cell-value">{{ value ?? 'Not available' }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
    <p class="comparison-note">
      Source: Employment and Social Development Canada · existing sector/year CSV. {{ note }}
    </p>
  </section>
</template>
<style scoped>
.chart-frame {
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
  color: var(--fg);
  background: var(--bg);
  font: var(--fs-md) / 1.5 var(--font-ui);
  padding: 4px;
}
.comparison-heading {
  display: grid;
  gap: 8px;
}
h2 {
  font-size: var(--fs-xl);
  line-height: 1.3;
}
.comparison-heading p,
.comparison-note {
  color: var(--mut);
}
.comparison-tools {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.comparison-tools [role='group'] {
  display: flex;
  gap: 8px;
}
.comparison-tools [aria-pressed='true'] {
  background: var(--acc);
  color: var(--on-acc);
  border-color: var(--acc);
}
.comparison-scroll {
  overflow: auto;
  max-width: 100%;
  flex-shrink: 0;
}
.comparison-scroll :deep(svg) {
  display: block;
}
.comparison-state {
  min-height: 286px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  align-items: flex-start;
  justify-content: center;
}
.comparison-note {
  font-size: var(--fs-base);
}
.expanded {
  padding: 16px;
}
.cell-label {
  display: none;
}
td {
  font-family: var(--font-mono);
}
th button {
  text-align: left;
  white-space: normal;
  overflow-wrap: anywhere;
}
@media (max-width: 768px) {
  table {
    min-width: 0;
  }
  caption {
    display: block;
  }
  thead {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
  }
  tbody,
  tr {
    display: block;
  }
  tr {
    padding: 12px 0;
    border-bottom: 1px solid var(--line);
  }
  th,
  td {
    border: 0;
    padding: 4px;
  }
  td {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 12px;
  }
  .cell-label {
    display: inline;
    color: var(--mut);
    font-family: var(--font-ui);
  }
}
</style>
