<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import ChartFrame from './ChartFrame.vue'
import { useChartSource } from '../../lib/chartSource'
import {
  parseRegions,
  regionalSummary,
  regionalAxes,
  regionalHighlights,
  regionalYears,
} from '../../lib/regions'
withDefaults(defineProps<{ fullscreen?: boolean }>(), { fullscreen: false })
const { rows, loading, error, load } = useChartSource(parseRegions)
const period = ref('2016–2025'),
  selected = ref('British Columbia')
const years = computed(() => [...new Set(rows.value.map((r) => r.year))].sort((a, b) => a - b))
const points = computed(() =>
  regionalSummary(
    rows.value,
    period.value === '2016–2025' ? regionalYears : [Number(period.value)],
  ),
)
const axes = computed(() => regionalAxes(points.value))
const x = (value: number) =>
  72 + ((value - axes.value.x[0]) / (axes.value.x[1] - axes.value.x[0])) * 510
const y = (value: number) =>
  310 - ((value - axes.value.y[0]) / (axes.value.y[1] - axes.value.y[0])) * 250
watch(points, (next) => {
  if (!next.some((p) => p.name === selected.value)) selected.value = next[0]?.name ?? ''
})
const detail = computed(() => points.value.find((p) => p.name === selected.value))
const groups = [...regionalHighlights, 'Other provinces']
const visible = ref<string[]>([...groups])
const group = (name: string) =>
  regionalHighlights.some((region) => region === name) ? name : 'Other provinces'
const tableRows = computed(() =>
  points.value.map((p) => ({
    key: p.name,
    label: p.name,
    values: [
      p.annualAvg.toFixed(2),
      p.firstYearAvg.toFixed(2),
      Math.round(p.employees),
      Math.round(p.employeesTotal),
      Math.round(p.agreements),
      p.missing,
    ],
  })),
)
</script>
<template>
  <ChartFrame
    id="regions"
    title="Do Bigger Bargaining Units Win Bigger Raises?"
    :subtitle="`Average annual % adjustment vs. employees represented (${period})`"
    :loading="loading"
    :error="error"
    empty="No regional data available for the selected period."
    :fullscreen="fullscreen"
    :columns="[
      'Region',
      'Avg Annual Adjustment (%)',
      'Avg First-Year Adjustment (%)',
      'Avg Employees Covered (per year)',
      'Total Employees Across Deals',
      'Agreements Signed',
      'Missing fields',
    ]"
    :table-rows="tableRows"
    :selected="selected"
    @select="selected = $event"
    @retry="load"
    note="Original arithmetic means count blank fields as zero contributions; totals sum the selected rows. Missing-field counts distinguish absent inputs from observed zero. The plot uses the unrounded average employee count and two-decimal annual adjustment; bubble diameter represents average employees. Displayed employee/agreement counts are rounded. Percentages are not compounded wage levels."
  >
    <template #controls
      ><label for="regional-period"
        >Regional period
        <select id="regional-period" v-model="period" :disabled="loading || !!error">
          <option>2016–2025</option>
          <option v-for="year in years" :key="year" :value="String(year)">{{ year }}</option>
        </select></label
      ></template
    >
    <template #detail>
      <div class="series-controls" role="group" aria-label="Visible regional series">
        <label v-for="name in groups" :key="name"
          ><input type="checkbox" v-model="visible" :value="name" />{{ name }}</label
        >
      </div>
      <label for="regional-inspect"
        >Inspect region
        <select id="regional-inspect" v-model="selected">
          <option v-for="point in points" :key="point.name">{{ point.name }}</option>
        </select></label
      >
      <p v-if="detail" role="status">
        {{ detail.name }} · Avg Annual Adjustment: {{ detail.annualAvg.toFixed(2) }}% · Avg
        First-Year Adjustment: {{ detail.firstYearAvg.toFixed(2) }}% · Avg Employees Covered (per
        year): {{ Math.round(detail.employees).toLocaleString('en-CA') }} · Total Employees Across
        Deals: {{ Math.round(detail.employeesTotal).toLocaleString('en-CA') }} · Agreements Signed
        ({{ period }}): {{ Math.round(detail.agreements).toLocaleString('en-CA') }}
      </p>
    </template>
    <svg
      width="640"
      height="390"
      role="img"
      aria-labelledby="regional-plot-title regional-plot-desc"
    >
      <title id="regional-plot-title">Do Bigger Bargaining Units Win Bigger Raises?</title>
      <desc id="regional-plot-desc">
        British Columbia, Ontario, Quebec and Alberta retain separate highlighted series; other
        provinces share a series. Circle stroke patterns identify groups in addition to color.
        Bubble diameter scales with average employees. Exact values and counts appear in Table.
      </desc>
      <text x="48" y="18" class="axis-text">Average Annual Wage Adjustment (%)</text>
      <g v-for="step in [0, 1, 2, 3, 4]" :key="step">
        <line x1="48" x2="602" :y1="60 + step * 62.5" :y2="60 + step * 62.5" class="grid-line" />
        <text x="2" :y="64 + step * 62.5" class="axis-text">
          {{ (axes.y[1] - ((axes.y[1] - axes.y[0]) * step) / 4).toFixed(1) }}
        </text>
        <text :x="72 + step * 127.5" y="340" text-anchor="middle" class="axis-text">
          {{ ((axes.x[0] + ((axes.x[1] - axes.x[0]) * step) / 4) / 1000).toFixed(0) }}k
        </text>
      </g>
      <line
        v-if="axes.y[0] <= 0 && axes.y[1] >= 0"
        x1="48"
        x2="602"
        :y1="y(0)"
        :y2="y(0)"
        class="zero-line"
      />
      <circle
        v-for="point in points.filter((p) => visible.includes(group(p.name)))"
        :key="point.name"
        class="regional-point"
        :class="`series-${groups.indexOf(group(point.name))}`"
        :data-region="point.name"
        :data-employees="point.employees"
        :data-annual="point.plotAnnual"
        :data-first-year="point.firstYearAvg"
        :data-total="point.employeesTotal"
        :data-agreements="point.agreements"
        :cx="x(point.employees)"
        :cy="y(point.plotAnnual)"
        :r="point.size / 2"
      >
        <title>
          {{ point.name }}: {{ point.annualAvg.toFixed(2) }}% annual;
          {{ Math.round(point.employees) }} average employees
        </title>
      </circle>
      <text x="320" y="375" text-anchor="middle" class="axis-text">
        Average Employees Covered (per year)
      </text>
    </svg>
  </ChartFrame>
</template>
<style scoped>
label {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  min-width: 0;
}
select {
  max-width: 100%;
  font-family: var(--font-mono);
}
.series-controls {
  display: flex;
  gap: 8px 24px;
  flex-wrap: wrap;
}
.series-controls label {
  min-height: 44px;
}
.series-controls input {
  width: 20px;
  height: 20px;
  accent-color: var(--acc);
}
.axis-text {
  fill: var(--mut);
  font: 12px var(--font-mono);
}
.grid-line {
  stroke: var(--line);
}
.zero-line {
  stroke: var(--fg);
  stroke-width: 2;
}
.regional-point {
  fill: var(--panel);
  stroke: var(--blue);
  stroke-width: 3;
}
.series-1 {
  stroke-dasharray: 6 2;
}
.series-2 {
  stroke: var(--fg);
  stroke-dasharray: 2 3;
}
.series-3 {
  stroke: var(--fg);
  stroke-dasharray: 8 3 2 3;
}
.series-4 {
  fill: var(--mut);
  stroke: var(--bg);
  stroke-width: 2;
}
</style>
