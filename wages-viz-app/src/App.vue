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
import Chart2IndustryLeaders from './components/charts/Chart2IndustryLeaders.vue'
import Chart3DurationVsWages from './components/charts/Chart3DurationVsWages.vue'
import Chart4FirstYearVsAnnual from './components/charts/Chart4FirstYearVsAnnual.vue'
import Chart5EmployeesVsRaises from './components/charts/Chart5EmployeesVsRaises.vue'

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
          <Chart2IndustryLeaders />
        </SwiperSlide>

        <SwiperSlide>
          <Chart3DurationVsWages />
        </SwiperSlide>

        <SwiperSlide>
          <Chart4FirstYearVsAnnual />
        </SwiperSlide>

        <SwiperSlide>
          <Chart5EmployeesVsRaises />
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
}

.wages-swiper {
  height: 700px;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  padding: 3rem;
  border: 1px solid #e0e0e0;
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
  color: #2c3e50;
  font-size: 1.1rem;
  font-weight: 600;
}

footer {
  background: #ffffff;
  color: #666666;
  text-align: center;
  padding: 0.75rem;
  font-size: 0.85rem;
  border-top: 2px solid #e0e0e0;
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
