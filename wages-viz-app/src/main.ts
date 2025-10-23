import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'

// Import ECharts and vue-echarts
import ECharts from 'vue-echarts'
import { use } from 'echarts/core'

// Import ECharts components
import {
  CanvasRenderer
} from 'echarts/renderers'
import {
  LineChart,
  BarChart,
  ScatterChart,
  PieChart,
  BoxplotChart
} from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  DataZoomComponent,
  ToolboxComponent,
  TimelineComponent,
  GraphicComponent
} from 'echarts/components'

// Register ECharts components
use([
  CanvasRenderer,
  LineChart,
  BarChart,
  ScatterChart,
  PieChart,
  BoxplotChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  DataZoomComponent,
  ToolboxComponent,
  TimelineComponent,
  GraphicComponent
])

const app = createApp(App)

// Register ECharts component globally
app.component('v-chart', ECharts)

app.mount('#app')
