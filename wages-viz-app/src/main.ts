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
  PieChart
} from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  DataZoomComponent,
  ToolboxComponent
} from 'echarts/components'

// Register ECharts components
use([
  CanvasRenderer,
  LineChart,
  BarChart,
  ScatterChart,
  PieChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  DataZoomComponent,
  ToolboxComponent
])

const app = createApp(App)

// Register ECharts component globally
app.component('v-chart', ECharts)

app.mount('#app')
