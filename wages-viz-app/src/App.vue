<script setup lang="ts">
import { defineAsyncComponent, ref } from 'vue'
import WageExplorer from './components/charts/Chart1TimeSeriesWages.vue'
const LegacyGallery = defineAsyncComponent(() => import('./LegacyGallery.vue'))
const galleryOpen = ref(false)
const baseUrl = import.meta.env.BASE_URL
const dark = ref(window.matchMedia('(prefers-color-scheme: dark)').matches)
function toggleTheme() {
  dark.value = !dark.value
  document.documentElement.dataset.theme = dark.value ? 'dark' : 'light'
}
document.documentElement.dataset.theme = dark.value ? 'dark' : 'light'
</script>

<template>
  <a class="skip" href="#explorer">Skip to wage explorer</a>
  <header class="page-header">
    <div class="topbar">
      <strong>Wage explorer</strong
      ><button :aria-pressed="dark" @click="toggleTheme">Dark mode</button>
    </div>
    <h1>How do wage adjustments compare?</h1>
    <p>Compare annual percentage adjustments across Canadian public and private sectors.</p>
  </header>
  <main id="explorer">
    <WageExplorer />
    <section class="more-charts" aria-labelledby="more-title">
      <h2 id="more-title">Continue exploring</h2>
      <button
        :aria-expanded="galleryOpen"
        aria-controls="gallery"
        @click="galleryOpen = !galleryOpen"
      >
        {{ galleryOpen ? 'Hide other charts' : 'Show other charts' }}
      </button>
      <div v-if="galleryOpen" id="gallery"><LegacyGallery /></div>
    </section>
  </main>
  <footer class="provenance" id="methodology">
    <h2>Source &amp; methodology</h2>
    <p>
      Employment and Social Development Canada · Major wage settlements, 2016–2025. Extracted
      2025-10-21.
    </p>
    <p>
      Annual percentage adjustments from the existing sector/year dataset. These are not hourly wage
      levels or inflation-adjusted income. Differences are public minus private, in percentage
      points. Missing observations are not zero.
    </p>
    <a :href="`${baseUrl}data/TABLEAU_sector_year.csv`" download>Download source CSV</a>
    <p>
      <a
        href="https://www.canada.ca/en/employment-social-development/services/collective-bargaining-data/wages.html"
        >ESDC wage settlement source</a
      >
      · BAIT518 Data Visualization, UBC Sauder School of Business.
    </p>
  </footer>
</template>
