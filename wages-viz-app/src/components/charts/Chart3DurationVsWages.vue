<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { plotExtent } from '../../lib/plotScale'
import { parseDuration, durationPoints, type DurationRow } from '../../lib/duration'
const props = withDefaults(defineProps<{ fullscreen?: boolean }>(), { fullscreen: false })
const rows = ref<DurationRow[]>([]),
  loading = ref(true),
  error = ref('')
const view = ref<'chart' | 'table'>('chart'),
  period = ref('2023–2025')
const selectedIndustry = ref('Education, health, and social services')
const years = computed(() => [...new Set(rows.value.map((r) => r.year))].sort((a, b) => a - b))
const points = computed(() =>
  durationPoints(
    rows.value,
    period.value === '2023–2025' ? [2023, 2024, 2025] : [Number(period.value)],
  ),
)
const selected = computed(() => points.value.find((p) => p.name === selectedIndustry.value))
watch(points, (next) => {
  if (!next.some((p) => p.name === selectedIndustry.value))
    selectedIndustry.value = next[0]?.name ?? ''
})
const disabled = computed(() => loading.value || !!error.value || !rows.value.length)
const groups = ['Education & Health', 'Entertainment & Hospitality', 'Other industries'] as const
const visible = ref<string[]>([...groups])
const group = (name: string) =>
  name === 'Education, health, and social services'
    ? groups[0]
    : name === 'Entertainment and hospitality'
      ? groups[1]
      : groups[2]
const extentX = computed(() =>
  plotExtent(
    points.value.map((p) => p.duration),
    2,
  ),
)
const extentY = computed(() =>
  plotExtent(
    points.value.map((p) => p.annual),
    1,
    true,
  ),
)
const lowX = computed(() => extentX.value[0]),
  highX = computed(() => extentX.value[1])
const lowY = computed(() => extentY.value[0]),
  highY = computed(() => extentY.value[1])
const x = (v: number) => 72 + ((v - lowX.value) / (highX.value - lowX.value)) * 510
const y = (v: number) => 310 - ((v - lowY.value) / (highY.value - lowY.value)) * 250
let controller: AbortController | undefined
async function load() {
  controller?.abort()
  controller = new AbortController()
  loading.value = true
  error.value = ''
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}data/TABLEAU_sector_year.csv`, {
      signal: controller.signal,
    })
    if (!response.ok) throw new Error('Dataset request failed')
    const parsed = parseDuration(await response.text())
    // Validate every selectable period before committing externally supplied data to reactive rendering.
    const validate = (years?: number[]) => {
      const next = durationPoints(parsed, years)
      plotExtent(
        next.map((p) => p.duration),
        2,
      )
      plotExtent(
        next.map((p) => p.annual),
        1,
        true,
      )
    }
    validate()
    for (const year of new Set(parsed.map((r) => r.year))) validate([year])
    rows.value = parsed
  } catch (cause) {
    if (cause instanceof DOMException && cause.name === 'AbortError') return
    error.value =
      cause instanceof Error && cause.message.includes('range overflow')
        ? 'Unsupported plot range: reduce the selected period or inspect the source values; this range exceeds finite plotting precision.'
        : cause instanceof Error && cause.message.startsWith('Unsupported plot range')
          ? cause.message
          : 'The duration dataset could not load. Check the connection or dataset format and retry.'
  } finally {
    loading.value = false
  }
}
onMounted(() => {
  void load()
})
onBeforeUnmount(() => controller?.abort())
</script>
<template>
  <section
    class="duration-comparison"
    :class="{ expanded: props.fullscreen }"
    aria-labelledby="duration-title"
    :aria-busy="loading"
  >
    <div class="comparison-heading">
      <h2 id="duration-title">Do longer contracts deliver better raises?</h2>
      <p>Average contract duration vs. annual wage adjustment · {{ period }} · All sectors</p>
    </div>
    <div class="comparison-tools">
      <div role="group" aria-label="Duration comparison view">
        <button :disabled="disabled" :aria-pressed="view === 'chart'" @click="view = 'chart'">
          Chart</button
        ><button :disabled="disabled" :aria-pressed="view === 'table'" @click="view = 'table'">
          Table
        </button>
      </div>
      <div class="year-picker">
        <label for="duration-year">Duration period</label
        ><select id="duration-year" v-model="period" :disabled="disabled">
          <option>2023–2025</option>
          <option v-for="year in years" :key="year" :value="String(year)">{{ year }}</option>
        </select>
      </div>
    </div>
    <p v-if="loading" role="status" class="comparison-state">
      Loading contract duration observations…
    </p>
    <div v-else-if="error" role="alert" class="comparison-state">
      <p>{{ error }}</p>
      <button @click="load">Retry duration data</button>
    </div>
    <div v-else-if="!points.length" class="comparison-state">
      <h3>No duration data available for the selected period.</h3>
      <button @click="load">Reload duration data</button>
    </div>
    <template v-else>
      <div class="comparison-legend" role="group" aria-label="Visible duration series">
        <label v-for="name in groups" :key="name"
          ><input type="checkbox" v-model="visible" :value="name" />{{ name }}</label
        >
      </div>
      <label for="duration-industry">Inspect industry</label
      ><select id="duration-industry" v-model="selectedIndustry">
        <option v-for="point in points" :key="point.name">{{ point.name }}</option>
      </select>
      <div v-if="selected" role="status" class="comparison-detail">
        <h3>{{ selected.name }}</h3>
        <p>
          {{ selected.duration }} months · {{ selected.annual }}% annual · {{ selected.firstYear }}%
          first-year · {{ selected.agreements.toLocaleString('en-CA') }} agreements ·
          {{ selected.employees.toLocaleString('en-CA') }} employees
        </p>
        <p>{{ selected.missing }} missing source fields (see calculation note).</p>
      </div>
      <div
        v-if="view === 'chart'"
        class="comparison-scroll"
        tabindex="0"
        role="region"
        aria-label="Duration bubble chart; scroll horizontally or use Table for exact values"
      >
        <svg
          width="640"
          height="380"
          role="img"
          aria-labelledby="duration-plot-title duration-plot-desc"
        >
          <title id="duration-plot-title">
            Contract duration and annual adjustment by industry
          </title>
          <desc id="duration-plot-desc">
            Bubble diameter represents total agreements. Education and health use outlined circles,
            entertainment uses dashed circles, other industries use filled circles. The shaded band
            starts above 3.5%, with a dashed threshold at 4%. Exact statistics are in Table.
          </desc>
          <defs>
            <clipPath id="duration-clip"><rect x="40" y="28" width="570" height="314" /></clipPath>
          </defs>
          <g clip-path="url(#duration-clip)">
            <rect
              x="48"
              :y="y(highY)"
              width="554"
              :height="Math.max(0, y(Math.max(3.5, lowY)) - y(highY))"
              class="duration-band"
            />
            <g v-for="step in [0, 1, 2, 3, 4]" :key="step">
              <line
                x1="48"
                x2="602"
                :y1="60 + step * 62.5"
                :y2="60 + step * 62.5"
                class="grid-line"
              />
            </g>
            <line
              v-if="lowY <= 4 && highY >= 4"
              x1="48"
              x2="602"
              :y1="y(4)"
              :y2="y(4)"
              class="threshold"
            />
            <line
              v-if="lowY <= 0 && highY >= 0"
              class="duration-zero"
              x1="48"
              x2="602"
              :y1="y(0)"
              :y2="y(0)"
            />
            <circle
              v-for="point in points.filter((p) => visible.includes(group(p.name)))"
              :key="point.name"
              class="duration-point"
              :class="{
                education: group(point.name) === groups[0],
                entertainment: group(point.name) === groups[1],
              }"
              :data-industry="point.name"
              :data-duration="point.duration"
              :data-annual="point.annual"
              :data-first-year="point.firstYear"
              :data-agreements="point.agreements"
              :data-employees="point.employees"
              :cx="x(point.duration)"
              :cy="y(point.annual)"
              :r="point.size / 2"
            >
              <title>
                {{ point.name }}: {{ point.duration }} months, {{ point.annual }}% annual;
                {{ point.agreements }} agreements
              </title>
            </circle>
          </g>
          <text x="48" y="18" class="axis-text">
            Annual adjustment (%) · band &gt;3.5% · dashed line 4%
          </text>
          <g v-for="step in [0, 1, 2, 3, 4]" :key="step">
            <text x="4" :y="64 + step * 62.5" class="axis-text">
              {{ (highY - ((highY - lowY) * step) / 4).toFixed(1) }}
            </text>
            <text :x="72 + step * 127.5" y="340" text-anchor="middle" class="axis-text">
              {{ (lowX + ((highX - lowX) * step) / 4).toFixed(1) }}
            </text>
          </g>
          <text x="320" y="370" text-anchor="middle" class="axis-text">
            Average contract duration (months) · bubble diameter = agreements
          </text>
        </svg>
      </div>
      <div
        v-else
        class="comparison-scroll"
        tabindex="0"
        role="region"
        aria-label="Duration source values table"
      >
        <table role="table">
          <caption>
            Arithmetic industry averages for
            {{
              period
            }}; counts are totals
          </caption>
          <thead>
            <tr>
              <th scope="col">Industry</th>
              <th scope="col">Duration (months)</th>
              <th scope="col">Annual (%)</th>
              <th scope="col">First-year (%)</th>
              <th scope="col">Agreements</th>
              <th scope="col">Employees</th>
              <th scope="col">Missing fields</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="point in points" :key="point.name">
              <th scope="row">
                <button
                  @click="selectedIndustry = point.name"
                  :aria-pressed="selectedIndustry === point.name"
                >
                  {{ point.name }}
                </button>
              </th>
              <td
                v-for="(value, label) in {
                  'Duration (months)': point.duration,
                  'Annual (%)': point.annual,
                  'First-year (%)': point.firstYear,
                  Agreements: point.agreements,
                  Employees: point.employees,
                  'Missing fields': point.missing,
                }"
                :key="label"
              >
                <span class="cell-label" aria-hidden="true">{{ label }}</span
                ><span class="cell-value">{{ value }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
    <p class="comparison-note">
      Source: Employment and Social Development Canada · existing sector/year CSV. Original
      calculation: unweighted arithmetic means over the selected rows; blank source inputs
      contribute zero to these means and totals. Missing-field counts distinguish blanks from
      observed zero. Duration displays one decimal, adjustments up to two; counts are rounded.
      Adjustments are percentages, not compounded wage levels.
    </p>
  </section>
</template>
<style scoped>
.duration-point {
  fill: var(--mut);
  stroke: var(--bg);
  stroke-width: 2;
}
.duration-point.education {
  fill: var(--panel);
  stroke: var(--blue);
  stroke-width: 3;
}
.duration-point.entertainment {
  fill: var(--panel);
  stroke: var(--fg);
  stroke-width: 3;
  stroke-dasharray: 4 2;
}
.duration-band {
  fill: var(--blue);
  opacity: 0.08;
}
.duration-zero {
  stroke: var(--fg);
  stroke-width: 2;
}
.threshold {
  stroke: var(--blue);
  stroke-dasharray: 6 4;
  stroke-width: 2;
}

.duration-comparison {
  width: 100%;
  min-width: 0;
  min-height: 0;
  height: 100%;
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
  color: var(--on-acc);
  background: var(--acc);
  border-color: var(--acc);
}
.year-picker {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}
.comparison-legend {
  display: flex;
  gap: 8px 24px;
  flex-wrap: wrap;
}
.comparison-legend label {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 44px;
  cursor: pointer;
}
.comparison-legend input {
  width: 20px;
  height: 20px;
  accent-color: var(--acc);
}
.annual-key {
  color: var(--blue);
}
.comparison-scroll {
  overflow: auto;
  max-width: 100%;
  flex-shrink: 0;
}
.comparison-scroll svg {
  display: block;
}
.axis-text {
  fill: var(--mut);
  font: 12px var(--font-mono);
}
.grid-line {
  stroke: var(--line);
}
.zero-line {
  stroke: var(--mut);
}
.adjustment-bar.firstYear {
  fill: var(--fg);
}
.adjustment-bar.annual {
  fill: var(--panel);
  stroke: var(--blue);
  stroke-width: 2;
  stroke-dasharray: 4 2;
}
.zero-value {
  stroke-width: 3;
}
.zero-value.firstYear {
  stroke: var(--fg);
}
.zero-value.annual {
  stroke: var(--blue);
  stroke-dasharray: 3 2;
}
.comparison-detail {
  border-top: 1px solid var(--line);
  padding-top: 12px;
  display: grid;
  gap: 4px;
}
.comparison-detail h3 {
  font-size: var(--fs-lg);
}
b,
td,
select {
  font-family: var(--font-mono);
}
.comparison-note {
  font-size: var(--fs-base);
}
.comparison-state {
  min-height: 286px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  align-items: flex-start;
  justify-content: center;
}
.expanded {
  padding: 16px;
}
.active-year {
  fill: var(--fg);
  font-weight: 700;
}
.cell-label {
  display: none;
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
