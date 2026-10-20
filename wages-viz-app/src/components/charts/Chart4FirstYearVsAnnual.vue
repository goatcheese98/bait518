<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import {
  parseAnnualAdjustments,
  adjustmentPercent,
  adjustmentGap,
  type AnnualAdjustment,
} from '../../lib/adjustments'
const props = withDefaults(defineProps<{ fullscreen?: boolean }>(), { fullscreen: false })
const rows = ref<AnnualAdjustment[]>([])
const comparisonElement = ref<HTMLElement | null>(null)
const availableWidth = ref(0)
const plotElement = ref<HTMLElement | null>(null)
let resizeObserver: ResizeObserver | undefined
const loading = ref(true),
  error = ref('')
const view = ref<'chart' | 'table'>('chart')
const selectedYear = ref<number | null>(null)
const firstVisible = ref(true),
  annualVisible = ref(true)
const selected = computed(() => rows.value.find((row) => row.year === selectedYear.value))
const disabled = computed(() => loading.value || !!error.value || !rows.value.length)
const series = [
  { key: 'firstYear', label: 'First-year adjustment' },
  { key: 'annual', label: 'Annual average' },
] as const
const marks = computed(() =>
  rows.value.flatMap((row, index) =>
    series.flatMap((series) => {
      const value = row[series.key]
      if (
        value === null ||
        (series.key === 'firstYear' ? !firstVisible.value : !annualVisible.value)
      )
        return []
      return [
        {
          year: row.year,
          index,
          series: series.key,
          value,
          label: `${row.year} ${series.label}: ${adjustmentPercent(value)}`,
        },
      ]
    }),
  ),
)
const values = computed(() =>
  rows.value.flatMap((row) => [row.firstYear, row.annual]).filter((v): v is number => v !== null),
)
const low = computed(() => Math.min(0, ...values.value))
const high = computed(() => Math.max(1, ...values.value))
const y = (value: number) => 236 - ((value - low.value) / (high.value - low.value)) * 200
const center = (index: number) =>
  72 + (index * (plotWidth.value - 112)) / Math.max(1, rows.value.length - 1)
const plotWidth = computed(() => Math.max(560, availableWidth.value, rows.value.length * 72 + 64))
watch([selectedYear, view, availableWidth], async () => {
  await nextTick()
  const index = rows.value.findIndex((row) => row.year === selectedYear.value)
  if (plotElement.value && index >= 0) {
    plotElement.value.scrollLeft = Math.max(0, center(index) - plotElement.value.clientWidth / 2)
  }
})
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
    rows.value = parseAnnualAdjustments(await response.text())
    if (!rows.value.some((row) => row.year === selectedYear.value))
      selectedYear.value = rows.value[rows.value.length - 1]?.year ?? null
  } catch (cause) {
    if (cause instanceof DOMException && cause.name === 'AbortError') return
    error.value =
      'The first-year adjustment dataset could not load. Check the connection or dataset format and retry.'
  } finally {
    loading.value = false
  }
}
onMounted(() => {
  if (comparisonElement.value) {
    resizeObserver = new ResizeObserver((entries) => {
      availableWidth.value = Math.floor(entries[0]?.contentRect.width ?? 0)
    })
    resizeObserver.observe(comparisonElement.value)
  }
  void load()
})
onBeforeUnmount(() => {
  controller?.abort()
  resizeObserver?.disconnect()
})
</script>

<template>
  <section
    ref="comparisonElement"
    class="adjustment-comparison"
    :class="{ expanded: props.fullscreen }"
    aria-labelledby="adjustments-title"
    :aria-busy="loading"
  >
    <div class="comparison-heading">
      <h2 id="adjustments-title">First-year vs annual adjustments</h2>
      <p>
        All industries · All sectors ·
        {{
          rows.length ? `${rows[0]?.year}–${rows[rows.length - 1]?.year}` : 'Source observations'
        }}
      </p>
    </div>
    <div class="comparison-tools">
      <div role="group" aria-label="First-year comparison view">
        <button :disabled="disabled" :aria-pressed="view === 'chart'" @click="view = 'chart'">
          Chart</button
        ><button :disabled="disabled" :aria-pressed="view === 'table'" @click="view = 'table'">
          Table
        </button>
      </div>
      <div class="year-picker">
        <label for="adjustment-year">Comparison year</label
        ><select id="adjustment-year" v-model="selectedYear" :disabled="disabled">
          <option v-for="row in rows" :key="row.year" :value="row.year">{{ row.year }}</option>
        </select>
      </div>
    </div>
    <p v-if="loading" class="comparison-state" role="status">
      Loading first-year and annual observations…
    </p>
    <div v-else-if="error" class="comparison-state" role="alert">
      <p>{{ error }}</p>
      <button @click="load">Retry first-year data</button>
    </div>
    <div v-else-if="!rows.length" class="comparison-state">
      <h3>No aggregate observations available</h3>
      <button @click="load">Reload first-year data</button>
    </div>
    <template v-else>
      <div class="comparison-legend" role="group" aria-label="Visible adjustment series">
        <label
          ><input type="checkbox" v-model="firstVisible" /><span aria-hidden="true">■</span>
          First-year adjustment</label
        ><label
          ><input type="checkbox" v-model="annualVisible" /><span
            class="annual-key"
            aria-hidden="true"
            >▧</span
          >
          Annual average</label
        >
      </div>
      <div
        v-if="selected"
        class="comparison-detail"
        role="status"
        aria-label="Selected adjustment comparison"
      >
        <h3>{{ selected.year }} comparison</h3>
        <p>
          First-year: <b>{{ adjustmentPercent(selected.firstYear) }}</b> · Annual average:
          <b>{{ adjustmentPercent(selected.annual) }}</b>
        </p>
        <p>
          Gap: <b>{{ adjustmentGap(selected.gap) }}</b>
        </p>
      </div>
      <template v-if="view === 'chart'">
        <p v-if="!firstVisible && !annualVisible">
          Choose an adjustment series to display. Table values remain available.
        </p>
        <div
          ref="plotElement"
          class="comparison-scroll"
          tabindex="0"
          role="region"
          aria-label="First-year and annual chart; scroll horizontally for all years. Use Comparison year or Table for exact values."
        >
          <svg
            :width="plotWidth"
            height="286"
            role="img"
            aria-labelledby="adjustment-plot-title adjustment-plot-desc"
          >
            <title id="adjustment-plot-title">
              First-year versus annual average percentage adjustments
            </title>
            <desc id="adjustment-plot-desc">
              Filled bars show first-year adjustments; outlined dashed bars show annual averages.
              Missing observations have no bar. Zero observations have a baseline mark. Exact values
              and gaps are available in Table.
            </desc>
            <text x="48" y="18" class="axis-text">Adjustment (%)</text>
            <g v-for="step in [0, 1, 2, 3, 4]" :key="step">
              <line
                x1="48"
                :x2="plotWidth - 16"
                :y1="36 + step * 50"
                :y2="36 + step * 50"
                class="grid-line"
              />
              <text x="2" :y="40 + step * 50" class="axis-text">
                {{ (high - ((high - low) * step) / 4).toFixed(1) }}
              </text>
            </g>
            <line x1="48" :x2="plotWidth - 16" :y1="y(0)" :y2="y(0)" class="zero-line" />
            <g v-for="mark in marks" :key="`${mark.year}-${mark.series}`">
              <rect
                :class="['adjustment-bar', mark.series]"
                :data-year="mark.year"
                :data-series="mark.series"
                :data-value="mark.value"
                :aria-label="mark.label"
                :x="center(mark.index) + (mark.series === 'firstYear' ? -20 : 4)"
                :y="y(Math.max(mark.value, 0))"
                width="16"
                :height="Math.abs(y(mark.value) - y(0))"
              >
                <title>{{ mark.label }}</title>
              </rect>
              <line
                v-if="mark.value === 0"
                class="zero-value"
                :class="mark.series"
                :data-zero-year="mark.year"
                :x1="center(mark.index) + (mark.series === 'firstYear' ? -20 : 4)"
                :x2="center(mark.index) + (mark.series === 'firstYear' ? -4 : 20)"
                :y1="y(0)"
                :y2="y(0)"
              />
            </g>
            <text
              v-for="(row, index) in rows"
              :key="row.year"
              :x="center(index)"
              y="268"
              text-anchor="middle"
              :class="['axis-text', { 'active-year': row.year === selectedYear }]"
            >
              {{ row.year }}
            </text>
          </svg>
        </div>
      </template>
      <div
        v-else
        class="comparison-scroll"
        tabindex="0"
        role="region"
        aria-label="First-year source values table"
      >
        <table role="table">
          <caption>
            All industries, All Sectors · source percentage adjustments; gap in percentage points
          </caption>
          <thead>
            <tr>
              <th scope="col">Year</th>
              <th scope="col">First-year</th>
              <th scope="col">Annual average</th>
              <th scope="col">Gap (pp)</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in rows"
              :key="row.year"
              :class="{ selected: row.year === selectedYear }"
            >
              <th scope="row">
                <button
                  :aria-label="`Inspect comparison year ${row.year}`"
                  :aria-pressed="row.year === selectedYear"
                  @click="selectedYear = row.year"
                >
                  {{ row.year }}
                </button>
              </th>
              <td>
                <span class="cell-label" aria-hidden="true">First-year</span
                ><span class="cell-value">{{ adjustmentPercent(row.firstYear) }}</span>
              </td>
              <td>
                <span class="cell-label" aria-hidden="true">Annual average</span
                ><span class="cell-value">{{ adjustmentPercent(row.annual) }}</span>
              </td>
              <td>
                <span class="cell-label" aria-hidden="true">Gap (pp)</span
                ><span class="cell-value">{{ adjustmentGap(row.gap) }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
    <p class="comparison-note">
      Source: Employment and Social Development Canada · existing sector/year CSV. Gap is first-year
      minus annual average, in percentage points. Missing values are not zero; these adjustments are
      not wage levels or compounded income. Values display up to two decimals.
    </p>
  </section>
</template>

<style scoped>
.adjustment-comparison {
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
