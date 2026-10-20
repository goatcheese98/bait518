<script setup lang="ts">
import { computed, ref } from 'vue'
import ChartFrame, { type ChartTableRow } from './ChartFrame.vue'
import { useChartSource } from '../../lib/chartSource'
import {
  parseDistribution,
  distributionSummary,
  distributionExtent,
  distributionIndustries,
} from '../../lib/distribution'
withDefaults(defineProps<{ fullscreen?: boolean }>(), { fullscreen: false })
const { rows, loading, error, load } = useChartSource(parseDistribution)
const model = computed(() => distributionSummary(rows.value))
const selectedYear = ref(2025),
  selectedIndustry = ref<string>(distributionIndustries[0])
const selected = computed(() =>
  model.value.observations.find(
    (r) => r.year === selectedYear.value && r.category === selectedIndustry.value,
  ),
)
const years = computed(() => [...new Set(rows.value.map((r) => r.year))].sort((a, b) => a - b))
const groups = ['Older Years', '2020', '2021', '2022', '2023', '2024', '2025']
const visible = ref<string[]>([...groups])
const group = (year: number) => (year < 2020 ? 'Older Years' : String(year))
const extent = computed(() =>
  model.value.points.length
    ? distributionExtent(model.value.points.map((p) => p.annual))
    : ([0, 1] as const),
)
const y = (value: number) =>
  310 - ((value - extent.value[0]) / (extent.value[1] - extent.value[0])) * 250
const x = (industry: string) =>
  100 + distributionIndustries.findIndex((name) => name === industry) * 200
const fmt = (value: number | null | undefined) =>
  value === null || value === undefined ? null : Number(value.toFixed(2))
const tableRows = computed<ChartTableRow[]>(() =>
  model.value.boxes.length
    ? [
        ...model.value.boxes.map((b) => ({
          key: `summary:${b.industry}`,
          label: `${b.industry} · Box Plot`,
          values: [
            '2016–2025',
            '—',
            '—',
            '—',
            b.min.toFixed(2),
            b.q1.toFixed(2),
            b.median.toFixed(2),
            b.q3.toFixed(2),
            b.max.toFixed(2),
          ],
        })),
        ...model.value.observations.map((r) => ({
          key: `${r.category}:${r.year}`,
          label: `${r.category} · ${r.year}`,
          values: [r.year, fmt(r.annual), r.employees, r.agreements, '—', '—', '—', '—', '—'],
        })),
      ]
    : [],
)
function inspect(key: string) {
  const row = model.value.observations.find((r) => `${r.category}:${r.year}` === key)
  if (row) {
    selectedIndustry.value = row.category
    selectedYear.value = row.year
  } else selectedIndustry.value = key.slice('summary:'.length)
}
function lines(label: string) {
  const result: string[] = []
  for (const word of label.split(' ')) {
    if (!result.length || result[result.length - 1]!.length + word.length > 25) result.push(word)
    else result[result.length - 1] += ' ' + word
  }
  return result
}
</script>
<template>
  <ChartFrame
    id="distribution"
    title="How Do Wage Gains Vary Across Industries?"
    subtitle="Annual wage adjustment distribution by industry (2016–2025)"
    :loading="loading"
    :error="error"
    empty="No wage distribution data available."
    :fullscreen="fullscreen"
    :columns="[
      'Observation',
      'Year',
      'Annual Adjustment (%)',
      'Employees',
      'Agreements',
      'Minimum (%)',
      'Lower Quartile (Q1)',
      'Median (%)',
      'Upper Quartile (Q3)',
      'Maximum (%)',
    ]"
    :table-rows="tableRows"
    :selected="`${selectedIndustry}:${selectedYear}`"
    @select="inspect"
    @retry="load"
    note="Box Plot quartiles use the original sorted observation indices floor(n×0.25), floor(n×0.5), floor(n×0.75), without interpolation. Missing annual observations are omitted from plot/quartiles; observed zero is retained. The table includes source counts and missing values as Not available. Percentages are not compounded wage levels."
  >
    <template #controls
      ><label for="distribution-year"
        >Inspect year
        <select id="distribution-year" v-model="selectedYear">
          <option v-for="year in years" :key="year" :value="year">{{ year }}</option>
        </select></label
      ></template
    >
    <template #detail
      ><div class="series-controls" role="group" aria-label="Highlighted Years:">
        <label v-for="name in groups" :key="name"
          ><input type="checkbox" v-model="visible" :value="name" />{{ name }}</label
        >
      </div>
      <label for="distribution-industry"
        >Inspect distribution industry
        <select id="distribution-industry" v-model="selectedIndustry">
          <option v-for="industry in distributionIndustries" :key="industry">{{ industry }}</option>
        </select></label
      >
      <p role="status">
        {{ selectedIndustry }} · Year: {{ selectedYear }} · Annual Adjustment:
        {{ fmt(selected?.annual) ?? 'Not available'
        }}{{ selected?.annual === null || !selected ? '' : '%' }} · Employees:
        {{ selected?.employees ?? 'Not available' }} · Agreements:
        {{ selected?.agreements ?? 'Not available' }}
      </p></template
    >
    <svg
      width="1000"
      height="420"
      role="img"
      aria-labelledby="distribution-plot-title distribution-plot-desc"
    >
      <title id="distribution-plot-title">How Do Wage Gains Vary Across Industries?</title>
      <desc id="distribution-plot-desc">
        Box Plot with minimum, lower quartile, median, upper quartile and maximum, overlaid by
        individual annual observations. Highlighted Years: 2020 through 2025; Older Years: 2016
        through 2019. The selected year is labeled; stroke patterns distinguish other highlighted
        years in addition to color. All observations and quartiles are in Table.
      </desc>
      <text x="48" y="18" class="axis-text">Annual Wage Adjustment (%)</text>
      <g v-for="step in [0, 1, 2, 3, 4]" :key="step">
        <line x1="48" x2="974" :y1="60 + step * 62.5" :y2="60 + step * 62.5" class="grid-line" />
        <text x="2" :y="64 + step * 62.5" class="axis-text">
          {{ (extent[1] - (extent[1] - extent[0]) * (step / 4)).toFixed(1) }}
        </text>
      </g>
      <line
        v-if="extent[0] <= 0 && extent[1] >= 0"
        x1="48"
        x2="974"
        :y1="y(0)"
        :y2="y(0)"
        class="zero-line"
      />
      <g
        v-for="box in model.boxes"
        :key="box.industry"
        class="distribution-box"
        :data-industry="box.industry"
        :data-values="JSON.stringify([box.min, box.q1, box.median, box.q3, box.max])"
      >
        <line
          :x1="x(box.industry)"
          :x2="x(box.industry)"
          :y1="y(box.min)"
          :y2="y(box.max)"
          class="whisker"
        />
        <line
          v-for="(value, index) in [box.min, box.max]"
          :key="index"
          :x1="x(box.industry) - 30"
          :x2="x(box.industry) + 30"
          :y1="y(value)"
          :y2="y(value)"
          class="whisker"
        />
        <rect
          :x="x(box.industry) - 50"
          :y="y(box.q3)"
          width="100"
          :height="Math.max(1, y(box.q1) - y(box.q3))"
          class="quartile-box"
        />
        <line
          :x1="x(box.industry) - 50"
          :x2="x(box.industry) + 50"
          :y1="y(box.median)"
          :y2="y(box.median)"
          class="whisker"
        />
        <title>
          {{ box.industry }}: minimum {{ box.min }}, Q1 {{ box.q1 }}, median {{ box.median }}, Q3
          {{ box.q3 }}, maximum {{ box.max }}
        </title>
      </g>
      <g
        v-for="point in model.points.filter((p) => visible.includes(group(p.year)))"
        :key="`${point.industry}:${point.year}`"
      >
        <circle
          class="distribution-point"
          :class="[
            { older: point.year < 2020, 'selected-point': point.year === selectedYear },
            `year-${point.year}`,
          ]"
          :data-industry="point.industry"
          :data-year="point.year"
          :data-annual="point.annual"
          :cx="x(point.industry)"
          :cy="y(point.annual)"
          r="10"
        >
          <title>{{ point.industry }}, {{ point.year }}: {{ point.wage }}%</title>
        </circle>
        <text
          v-if="point.year === selectedYear"
          :x="x(point.industry) + 14"
          :y="y(point.annual) + 4"
          class="point-year"
        >
          {{ point.year }}
        </text>
      </g>
      <text
        v-for="industry in distributionIndustries"
        :key="industry"
        :x="x(industry)"
        y="344"
        text-anchor="middle"
        class="axis-text"
      >
        <tspan
          v-for="(line, index) in lines(industry)"
          :key="index"
          :x="x(industry)"
          :dy="index ? 16 : 0"
        >
          {{ line }}
        </tspan>
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
.axis-text,
.point-year {
  fill: var(--mut);
  font: 12px var(--font-mono);
}
.grid-line {
  stroke: var(--line);
}
.whisker,
.zero-line {
  stroke: var(--fg);
  stroke-width: 2;
}
.quartile-box {
  stroke: var(--blue);
  stroke-width: 2;
  fill: var(--blue);
  fill-opacity: 0.12;
}
.distribution-point {
  fill: var(--panel);
  stroke: var(--fg);
  stroke-width: 2;
}
.year-2020 {
  stroke-dasharray: 2 2;
}
.year-2021 {
  stroke: var(--blue);
}
.year-2022 {
  stroke-dasharray: 5 2;
}
.year-2023 {
  stroke: var(--blue);
  stroke-dasharray: 1 3;
}
.year-2024 {
  stroke-dasharray: 8 2 2 2;
}
.older {
  fill: var(--mut);
  stroke: var(--bg);
  opacity: 0.4;
}
.selected-point {
  fill: var(--acc);
  stroke: var(--on-acc);
}
</style>
