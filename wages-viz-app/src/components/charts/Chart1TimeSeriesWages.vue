<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref } from 'vue'
import { compareWages, parseWages, percent, points, type Observation } from '../../lib/wages'
const data = ref<Observation[]>([])
const loading = ref(true),
  error = ref(''),
  message = ref('')
const industry = ref('All industries'),
  start = ref(2016),
  end = ref(2025)
const applied = ref({ industry: 'All industries', start: 2016, end: 2025 })
const publicVisible = ref(true),
  privateVisible = ref(true)
const view = ref<'chart' | 'table'>('chart')
const selectedYear = ref<number | null>(null)
const controlsOpen = ref(false)
const resultsElement = ref<HTMLElement | null>(null)
const availableWidth = ref(560)
let resizeObserver: ResizeObserver | undefined
const industries = computed(() => [...new Set(data.value.map((row) => row.industry))].sort())
const years = computed(() => [...new Set(data.value.map((row) => row.year))].sort((a, b) => a - b))
const rows = computed(() =>
  compareWages(data.value, applied.value.industry, applied.value.start, applied.value.end),
)
const selected = computed(() => rows.value.find((row) => row.year === selectedYear.value))
const invalid = computed(() => start.value > end.value)
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
    data.value = parseWages(await response.text())
    syncYear()
    message.value = `Updated period: ${applied.value.start}–${applied.value.end}. ${rows.value.length} years.`
  } catch (cause) {
    if (cause instanceof DOMException && cause.name === 'AbortError') return
    error.value =
      'The wage dataset could not load. Check the connection or dataset format and retry.'
  } finally {
    loading.value = false
  }
}
function syncYear() {
  if (!rows.value.some((row) => row.year === selectedYear.value))
    selectedYear.value = rows.value[rows.value.length - 1]?.year ?? null
}
function apply() {
  if (invalid.value || loading.value || error.value) return
  applied.value = { industry: industry.value, start: start.value, end: end.value }
  syncYear()
  message.value = `Updated period: ${start.value}–${end.value}. ${rows.value.length} years.`
}
function reset() {
  industry.value = 'All industries'
  start.value = years.value[0] ?? 2016
  end.value = years.value[years.value.length - 1] ?? 2025
  publicVisible.value = true
  privateVisible.value = true
  apply()
}
// A fixed readable plot can scroll at narrow widths; labels never shrink with the viewport.
const plotWidth = computed(() => Math.max(560, availableWidth.value, rows.value.length * 64))
const values = computed(() =>
  rows.value.flatMap((row) => [row.public, row.private]).filter((v): v is number => v !== null),
)
const minimum = computed(() => Math.min(0, ...values.value))
const maximum = computed(() => Math.max(1, ...values.value))
const y = (value: number) => 260 - ((value - minimum.value) / (maximum.value - minimum.value)) * 210
const x = (index: number) =>
  56 + (index * (plotWidth.value - 88)) / Math.max(1, rows.value.length - 1)
function path(sector: 'public' | 'private') {
  let previous = false
  return rows.value
    .map((row, index) => {
      const value = row[sector]
      if (value === null) {
        previous = false
        return ''
      }
      const command = previous ? 'L' : 'M'
      previous = true
      return `${command}${x(index)},${y(value)}`
    })
    .join(' ')
}
onMounted(() => {
  if (resultsElement.value) {
    resizeObserver = new ResizeObserver((entries) => {
      availableWidth.value = Math.floor(entries[0]?.contentRect.width ?? 560)
    })
    resizeObserver.observe(resultsElement.value)
  }
  void load()
})
onBeforeUnmount(() => {
  controller?.abort()
  resizeObserver?.disconnect()
})
</script>

<template>
  <div class="explorer-layout" :aria-busy="loading">
    <aside class="control-rail" aria-label="Comparison filters">
      <h2>Explore the comparison</h2>
      <p class="mobile-summary">{{ applied.industry }} · {{ applied.start }}–{{ applied.end }}</p>
      <button
        class="edit-filters"
        :aria-expanded="controlsOpen"
        aria-controls="filter-form"
        @click="controlsOpen = !controlsOpen"
      >
        Edit filters
      </button>
      <form id="filter-form" :class="{ 'controls-open': controlsOpen }" @submit.prevent="apply">
        <label for="industry">Industry / source category</label>
        <select id="industry" v-model="industry" :disabled="loading || !!error">
          <option v-if="!industries.length">All industries</option>
          <option v-for="name in industries" :key="name">{{ name }}</option>
        </select>
        <p class="hint">Source categories include jurisdictions; no categories are combined.</p>
        <label for="start">From year</label
        ><select id="start" v-model="start" :disabled="loading || !!error">
          <option v-for="year in years" :key="year" :value="year">{{ year }}</option>
        </select>
        <label for="end">To year</label
        ><select id="end" v-model="end" :disabled="loading || !!error">
          <option v-for="year in years" :key="year" :value="year">{{ year }}</option>
        </select>
        <p v-if="invalid" role="alert">From year must be before or equal to To year.</p>
        <div class="display-note">
          <strong>Annual change (%)</strong>
          <p>Percentage adjustment is not an hourly wage or cost-of-living measure.</p>
        </div>
        <button class="primary" :disabled="loading || !!error || invalid">Apply filters</button>
        <button type="button" :disabled="loading || !!error" @click="reset">Reset filters</button>
      </form>
    </aside>
    <section ref="resultsElement" class="results" aria-labelledby="results-title">
      <div class="results-heading">
        <h2 id="results-title">Annual wage adjustment</h2>
        <a href="#methodology">Source &amp; methodology</a>
      </div>
      <p class="status" role="status">
        {{ loading ? 'Loading wage observations…' : error ? '' : message }}
      </p>
      <div v-if="loading" class="state">Loading chart and source table…</div>
      <div v-else-if="error" class="state" role="alert">
        <p>{{ error }}</p>
        <button @click="load">Retry</button>
      </div>
      <div v-else-if="!rows.length" class="state">
        <h3>No observations for this selection</h3>
        <button @click="reset">Clear filters</button>
      </div>
      <template v-else>
        <div class="result-tools">
          <div class="view-switch" role="group" aria-label="Results view">
            <button :aria-pressed="view === 'chart'" @click="view = 'chart'">Chart</button
            ><button :aria-pressed="view === 'table'" @click="view = 'table'">Table</button>
          </div>
          <div class="year-control">
            <label for="selected-year">Selected year</label
            ><select id="selected-year" v-model="selectedYear">
              <option v-for="row in rows" :value="row.year" :key="row.year">{{ row.year }}</option>
            </select>
          </div>
        </div>
        <div class="legend" role="group" aria-label="Visible chart series">
          <label
            ><input type="checkbox" v-model="publicVisible" /><span
              aria-hidden="true"
              class="public-key"
              >━ ●</span
            >
            Public sector</label
          >
          <label
            ><input type="checkbox" v-model="privateVisible" /><span
              aria-hidden="true"
              class="private-key"
              >┄ ◆</span
            >
            Private sector</label
          >
        </div>
        <p v-if="view === 'chart' && !publicVisible && !privateVisible">
          Choose a sector to display its line. Source values remain available below.
        </p>
        <div
          v-if="view === 'chart'"
          class="plot-scroll"
          tabindex="0"
          role="region"
          aria-label="Annual adjustment chart; scroll horizontally for all years. Use Selected year or Table for exact values."
        >
          <svg
            :width="plotWidth"
            height="310"
            role="img"
            aria-labelledby="plot-title plot-description"
          >
            <title id="plot-title">{{ applied.industry }} annual wage adjustments (%)</title>
            <desc id="plot-description">
              Public sector: solid line and circles. Private sector: dashed line and diamonds.
              Missing values break lines. Exact values in the table and selected-year summary.
            </desc>
            <text x="56" y="20" class="axis-text">Annual adjustment (%)</text>
            <g v-for="step in [0, 1, 2, 3, 4]" :key="step">
              <line
                x1="56"
                :x2="plotWidth - 32"
                :y1="50 + step * 52.5"
                :y2="50 + step * 52.5"
                class="grid-line"
              />
              <text x="8" :y="54 + step * 52.5" class="axis-text">
                {{ (maximum - (maximum - minimum) * (step / 4)).toFixed(1) }}
              </text>
            </g>
            <path v-if="publicVisible" :d="path('public')" class="public-line" />
            <path v-if="privateVisible" :d="path('private')" class="private-line" />
            <g v-for="(row, index) in rows" :key="row.year">
              <text :x="x(index)" y="290" text-anchor="middle" class="axis-text">
                {{ row.year }}
              </text>
              <circle
                v-if="publicVisible && row.public !== null"
                :cx="x(index)"
                :cy="y(row.public)"
                r="4"
                class="public-point"
              />
              <path
                v-if="privateVisible && row.private !== null"
                :d="`M${x(index)},${y(row.private) - 5}l5,5 -5,5 -5,-5Z`"
                class="private-point"
              />
            </g>
          </svg>
        </div>
        <section
          v-if="selected"
          class="selected-detail"
          aria-label="Selected year values"
          aria-live="polite"
        >
          <h3>{{ selected.year }} · annual adjustment</h3>
          <p>
            Public: <b>{{ percent(selected.public) }}</b> · Private:
            <b>{{ percent(selected.private) }}</b>
          </p>
          <p>
            Difference: <b>{{ points(selected.difference) }}</b>
          </p>
        </section>
        <div
          v-if="view === 'table'"
          class="table-scroll"
          tabindex="0"
          role="region"
          aria-label="Source values table"
        >
          <table>
            <caption>
              {{
                applied.industry
              }}
              · annual percentage adjustments. Difference in percentage points.
            </caption>
            <thead>
              <tr>
                <th scope="col">Year</th>
                <th scope="col">Public sector</th>
                <th scope="col">Private sector</th>
                <th scope="col">Difference (pp)</th>
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
                    :aria-pressed="row.year === selectedYear"
                    :aria-label="`Select year ${row.year}`"
                    @click="selectedYear = row.year"
                  >
                    {{ row.year }}
                  </button>
                </th>
                <td>{{ percent(row.public) }}</td>
                <td>{{ percent(row.private) }}</td>
                <td>{{ points(row.difference) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
    </section>
  </div>
</template>
