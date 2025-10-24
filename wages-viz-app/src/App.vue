<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { Swiper, SwiperSlide } from 'swiper/vue'
import { Navigation, Pagination, Keyboard } from 'swiper/modules'

// Import Swiper styles
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'

// Import chart components
import Chart1TimeSeriesWages from './components/charts/Chart1TimeSeriesWages.vue'
import Chart2IndustryLeaders from './components/charts/Chart2IndustryLeaders.vue'
import Chart3DurationVsWages from './components/charts/Chart3DurationVsWages.vue'
import Chart4FirstYearVsAnnual from './components/charts/Chart4FirstYearVsAnnual.vue'
import Chart5EmployeesVsRaises from './components/charts/Chart5EmployeesVsRaises.vue'
import Chart6IndustryWageDistribution from './components/charts/Chart6IndustryWageDistribution.vue'

const swiperModules = [Navigation, Pagination, Keyboard]
const currentSlide = ref(1)
const isFullscreen = ref(false)

const onSlideChange = (swiper) => {
  currentSlide.value = swiper.activeIndex + 1
}

const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value
}

const handleKeydown = (event) => {
  if (event.key === 'Escape' && isFullscreen.value) {
    isFullscreen.value = false
  }
}

const updateBodyOverflow = (value) => {
  if (typeof document === 'undefined') {
    return
  }
  document.body.style.overflow = value ? 'hidden' : ''
  document.body.classList.toggle('fullscreen-mode', value)
}

watch(isFullscreen, (value) => {
  updateBodyOverflow(value)
})

onMounted(() => {
  if (typeof window === 'undefined') {
    return
  }
  window.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('keydown', handleKeydown)
  }
  updateBodyOverflow(false)
})
</script>

<template>
  <div id="app" :class="{ fullscreen: isFullscreen }">
    <button type="button" class="fullscreen-toggle" @click="toggleFullscreen">
      {{ isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen' }}
    </button>

    <header v-if="!isFullscreen">
      <h1>Canadian Wage Settlements Analysis (2016-2025)</h1>
      <p class="subtitle">Data Source: Employment and Social Development Canada</p>
    </header>

    <div class="slideshow-container" :class="{ fullscreen: isFullscreen }">
      <Swiper
        :modules="swiperModules"
        :slides-per-view="1"
        :space-between="isFullscreen ? 0 : 50"
        :centered-slides="isFullscreen"
        :navigation="true"
        :pagination="{ clickable: true }"
        :keyboard="{ enabled: true }"
        @slideChange="onSlideChange"
        :class="['wages-swiper', { fullscreen: isFullscreen }]"
      >
        <SwiperSlide>
          <div class="slide-card">
            <Chart6IndustryWageDistribution :fullscreen="isFullscreen" />
          </div>
        </SwiperSlide>

        <SwiperSlide>
          <div class="slide-card">
            <Chart1TimeSeriesWages :fullscreen="isFullscreen" />
          </div>
        </SwiperSlide>

        <SwiperSlide>
          <div class="slide-card">
            <Chart2IndustryLeaders :fullscreen="isFullscreen" />
          </div>
        </SwiperSlide>

        <SwiperSlide>
          <div class="slide-card">
            <Chart3DurationVsWages :fullscreen="isFullscreen" />
          </div>
        </SwiperSlide>

        <SwiperSlide>
          <div class="slide-card">
            <Chart4FirstYearVsAnnual :fullscreen="isFullscreen" />
          </div>
        </SwiperSlide>

        <SwiperSlide>
          <div class="slide-card">
            <Chart5EmployeesVsRaises :fullscreen="isFullscreen" />
          </div>
        </SwiperSlide>
      </Swiper>
    </div>

    <footer v-if="!isFullscreen">
      <p>Use arrow keys or click arrows to navigate</p>
    </footer>
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body.fullscreen-mode {
  background: #0d1b2a;
}

#app {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  min-height: 100vh;
  background: #ffffff;
  display: flex;
  flex-direction: column;
}

header {
  background: #ffffff;
  padding: 1rem 2rem;
  text-align: center;
  border-bottom: 2px solid #e0e0e0;
}

header h1 {
  color: #2c3e50;
  font-size: 1.8rem;
  margin-bottom: 0.25rem;
  font-weight: 600;
}

.subtitle {
  color: #666666;
  font-size: 0.85rem;
}

.slideshow-container {
  flex: 1;
  padding: 2rem;
  max-width: 1400px;
  width: 100%;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.wages-swiper {
  height: 700px;
  width: 100%;
  background: transparent;
  overflow: hidden;
  align-self: stretch;
}

.swiper-slide {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1rem;
  width: 100% !important;
}

footer {
  background: #ffffff;
  color: #666666;
  text-align: center;
  padding: 0.75rem;
  font-size: 0.85rem;
  border-top: 2px solid #e0e0e0;
}

.slide-card {
  width: 100%;
  max-width: 1200px;
  height: 100%;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  border: 1px solid #e0e0e0;
  padding: 2.5rem;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.slide-card > * {
  flex: 1;
  display: flex;
}

.fullscreen-toggle {
  position: fixed;
  top: 1.5rem;
  right: 1.5rem;
  z-index: 1000;
  background: rgba(44, 62, 80, 0.92);
  color: #ffffff;
  border: none;
  border-radius: 999px;
  padding: 0.55rem 1.2rem;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
  transition: background 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
}

.fullscreen-toggle:hover {
  background: rgba(26, 37, 47, 0.95);
  transform: translateY(-1px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.22);
}

.fullscreen-toggle:active {
  transform: translateY(0);
}

#app.fullscreen {
  background: #0d1b2a;
  overflow: hidden;
}

#app.fullscreen .slideshow-container {
  padding: 0;
  max-width: none;
  width: 100vw;
  height: 100vh;
  flex: 1;
  justify-content: center;
  align-items: center;
  position: fixed;
  top: 0;
  left: 0;
}

#app.fullscreen .wages-swiper {
  height: 100vh !important;
  width: 100vw !important;
  padding: 0;
  background: #0d1b2a;
  overflow: visible;
}

#app.fullscreen .swiper-slide {
  padding: 0 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  width: 100vw !important;
}

#app.fullscreen .slide-card {
  max-width: none;
  width: 96vw;
  height: 94vh;
  padding: 2rem 2.5rem;
  border-radius: 18px;
  margin: 0;
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.25);
}

#app.fullscreen .slide-card > * {
  flex: 1;
}

#app.fullscreen :deep(.swiper-button-next),
#app.fullscreen :deep(.swiper-button-prev) {
  border-color: rgba(255, 255, 255, 0.85);
  color: #ffffff;
  background: rgba(13, 27, 42, 0.35);
}

#app.fullscreen :deep(.swiper-button-next:hover),
#app.fullscreen :deep(.swiper-button-prev:hover) {
  background: rgba(255, 255, 255, 0.95);
  color: #0d1b2a;
}

#app.fullscreen :deep(.swiper-pagination) {
  bottom: 1rem !important;
}

#app.fullscreen :deep(.swiper-pagination-bullet),
#app.fullscreen :deep(.swiper-pagination-bullet-active) {
  background: #ffffff;
}

/* Swiper navigation buttons styling */
:deep(.swiper-button-next),
:deep(.swiper-button-prev) {
  color: #2c3e50;
  background: rgba(255, 255, 255, 0.9);
  width: 50px;
  height: 50px;
  border-radius: 50%;
  border: 2px solid #2c3e50;
}

:deep(.swiper-button-next:hover),
:deep(.swiper-button-prev:hover) {
  background: #2c3e50;
  color: #ffffff;
}

:deep(.swiper-button-next:after),
:deep(.swiper-button-prev:after) {
  font-size: 20px;
  font-weight: bold;
}

:deep(.swiper-pagination-bullet) {
  background: #cccccc;
  opacity: 1;
  width: 12px;
  height: 12px;
}

:deep(.swiper-pagination-bullet-active) {
  background: #2c3e50;
  width: 30px;
  border-radius: 6px;
}

/* Responsive design */
@media (max-width: 768px) {
  header h1 {
    font-size: 1.8rem;
  }

  .wages-swiper {
    height: 500px;
    padding: 1rem;
  }

  .slideshow-container {
    padding: 1rem;
  }
}
</style>
