<script setup>
import { ref } from 'vue'
import { Swiper, SwiperSlide } from 'swiper/vue'
import { Navigation, Pagination, Keyboard } from 'swiper/modules'

// Import Swiper styles
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'

// Import chart components
import Chart1TimeSeriesWages from './components/charts/Chart1TimeSeriesWages.vue'
import Chart2GeographicComparison from './components/charts/Chart2GeographicComparison.vue'
import Chart3SectorDeepDive from './components/charts/Chart3SectorDeepDive.vue'
import Chart4COLAAdoption from './components/charts/Chart4COLAAdoption.vue'
import Chart5DurationVsWages from './components/charts/Chart5DurationVsWages.vue'

const swiperModules = [Navigation, Pagination, Keyboard]
const currentSlide = ref(1)

const onSlideChange = (swiper) => {
  currentSlide.value = swiper.activeIndex + 1
}
</script>

<template>
  <div id="app">
    <header>
      <h1>Canadian Wage Settlements Analysis (2016-2024)</h1>
      <p class="subtitle">Data Source: Employment and Social Development Canada</p>
    </header>

    <div class="slideshow-container">
      <Swiper
        :modules="swiperModules"
        :slides-per-view="1"
        :space-between="50"
        :navigation="true"
        :pagination="{ clickable: true }"
        :keyboard="{ enabled: true }"
        @slideChange="onSlideChange"
        class="wages-swiper"
      >
        <SwiperSlide>
          <Chart1TimeSeriesWages />
        </SwiperSlide>

        <SwiperSlide>
          <Chart2GeographicComparison />
        </SwiperSlide>

        <SwiperSlide>
          <Chart3SectorDeepDive />
        </SwiperSlide>

        <SwiperSlide>
          <Chart4COLAAdoption />
        </SwiperSlide>

        <SwiperSlide>
          <Chart5DurationVsWages />
        </SwiperSlide>
      </Swiper>

      <div class="slide-counter">
        Slide {{ currentSlide }} of 5
      </div>
    </div>

    <footer>
      <p>Use arrow keys or click arrows to navigate • Press Space to advance slides</p>
    </footer>
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

#app {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  flex-direction: column;
}

header {
  background: rgba(255, 255, 255, 0.95);
  padding: 2rem;
  text-align: center;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

header h1 {
  color: #2c3e50;
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
}

.subtitle {
  color: #7f8c8d;
  font-size: 1rem;
}

.slideshow-container {
  flex: 1;
  padding: 2rem;
  max-width: 1400px;
  width: 100%;
  margin: 0 auto;
}

.wages-swiper {
  height: 600px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  padding: 2rem;
}

.swiper-slide {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1rem;
}

.slide-counter {
  text-align: center;
  margin-top: 1.5rem;
  color: white;
  font-size: 1.2rem;
  font-weight: bold;
}

footer {
  background: rgba(0, 0, 0, 0.2);
  color: white;
  text-align: center;
  padding: 1rem;
  font-size: 0.9rem;
}

/* Swiper navigation buttons styling */
:deep(.swiper-button-next),
:deep(.swiper-button-prev) {
  color: #667eea;
  background: white;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

:deep(.swiper-button-next:after),
:deep(.swiper-button-prev:after) {
  font-size: 20px;
}

:deep(.swiper-pagination-bullet) {
  background: #667eea;
  opacity: 0.5;
}

:deep(.swiper-pagination-bullet-active) {
  opacity: 1;
  background: #667eea;
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
