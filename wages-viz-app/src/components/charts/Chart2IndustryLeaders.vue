<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import ChartFrame from './ChartFrame.vue'
import { useChartSource } from '../../lib/chartSource'
import { parseLeaders, leaderSummary } from '../../lib/leaders'
withDefaults(defineProps<{ fullscreen?: boolean }>(), { fullscreen: false })
const { rows, loading, error, load } = useChartSource(parseLeaders)
const period = ref('2023–2025'),
  selected = ref('')
const years = computed(() => [...new Set(rows.value.map((r) => r.year))].sort((a, b) => a - b))
const points = computed(() =>
  leaderSummary(
    rows.value,
    period.value === '2023–2025' ? [2023, 2024, 2025] : [Number(period.value)],
  ),
)
watch(points, (next) => {
  if (!next.some((p) => p.industry === selected.value)) selected.value = next[0]?.industry ?? ''
})
const detail = computed(() => points.value.find((p) => p.industry === selected.value))
const high = computed(() => Math.ceil(Math.max(...points.value.map((p) => p.avgAnnual)) + 1))
const tableRows = computed(() =>
  points.value.map((p) => ({
    key: p.industry,
    label: p.industry,
    values: [p.avgAnnual, p.avgFirstYear, p.latestYear, p.employeeTotal, p.missing],
  })),
)
const coverage = computed(() => Math.max(1, ...points.value.map((p) => p.employeeTotal)))
</script>
<template>
  <ChartFrame
    id="leaders"
    title="Which Industries Lead Wage Growth?"
    :subtitle="`Average annual % adjustment (${period}) · All Sectors`"
    :loading="loading"
    :error="error"
    empty="No industry-level data available for the selected period."
    :fullscreen="fullscreen"
    :columns="[
      'Industry',
      'Avg Annual Adjustment (%)',
      'Avg First-Year Adjustment (%)',
      'Latest Year Observed',
      'Employees Covered',
      'Missing fields',
    ]"
    :table-rows="tableRows"
    :selected="selected"
    @select="selected = $event"
    @retry="load"
    note="Original calculation: means omit missing adjustment values, employee counts are summed, rounded annual averages above zero are ranked and the top eight retained. Missing counts distinguish absent inputs from observed zero. Adjustments are not compounded wage levels."
  >
    <template #controls
      ><label for="leaders-period"
        >Industry period
        <select aria-label="Industry period" id="leaders-period" v-model="period" :disabled="loading || !!error">
          <option>2023–2025</option>
          <option v-for="year in years" :key="year" :value="String(year)">{{ year }}</option>
        </select></label
      ></template
    >
    <template #detail
      ><label
        >Inspect industry
        <select v-model="selected">
          <option v-for="point in points" :key="point.industry">{{ point.industry }}</option>
        </select></label
      >
      <p v-if="detail" role="status">
        {{ detail.industry }} · Avg Annual Adjustment: {{ detail.avgAnnual }}% · Avg First-Year
        Adjustment: {{ detail.avgFirstYear }}% · Latest Year Observed:
        {{ detail.latestYear ?? 'n/a' }} · Employees Covered ({{ period }}):
        {{ detail.employeeTotal.toLocaleString('en-CA') }}
      </p></template
    >
    <svg
      width="920"
      :height="points.length * 56 + 80"
      role="img"
      aria-labelledby="leaders-plot-title leaders-plot-desc"
    >
      <title id="leaders-plot-title">Which Industries Lead Wage Growth?</title>
      <desc id="leaders-plot-desc">
        Top eight average annual percentage adjustments, ranked descending. Bar opacity represents
        employee coverage. Exact annual, first-year, latest-year and employee values are in Table.
      </desc>
      <g v-for="(point, index) in points" :key="point.industry">
        <text x="8" :y="index * 56 + 33" class="axis-text">{{ point.industry }}</text>
        <rect
          class="leader-bar"
          :data-industry="point.industry"
          :data-annual="point.avgAnnual"
          :data-first-year="point.avgFirstYear"
          :data-employees="point.employeeTotal"
          :data-latest-year="point.latestYear"
          x="330"
          :y="index * 56 + 12"
          :width="(point.avgAnnual / high) * 500"
          height="30"
          :fill-opacity="0.35 + (0.65 * point.employeeTotal) / coverage"
        >
          <title>{{ point.industry }}: {{ point.avgAnnual }}%</title>
        </rect>
        <text :x="340 + (point.avgAnnual / high) * 500" :y="index * 56 + 33" class="axis-text">
          {{ point.avgAnnual }}%
        </text>
      </g>
      <text x="330" :y="points.length * 56 + 36" class="axis-text">
        Average Annual % Adjustment · employee coverage indicated by bar opacity
      </text>
    </svg>
  </ChartFrame>
</template>
<style scoped>
select {
  max-width: 100%;
  font-family: var(--font-mono);
}
label {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  min-width: 0;
}
.leader-bar {
  fill: var(--blue);
  stroke: var(--blue);
}
.axis-text {
  fill: var(--fg);
  font: 12px var(--font-mono);
}
</style>
