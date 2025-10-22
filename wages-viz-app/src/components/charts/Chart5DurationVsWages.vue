<script setup>
import { ref } from 'vue'

const chartOption = ref({
  title: {
    text: 'Agreement Duration vs Wage Increases',
    subtext: 'Bubble size represents number of employees affected',
    left: 'center',
    textStyle: {
      fontSize: 20,
      fontWeight: 'bold'
    }
  },
  tooltip: {
    trigger: 'item',
    formatter: (params) => {
      return `${params.seriesName}<br/>
              Duration: ${params.value[0]} months<br/>
              Wage Adjustment: ${params.value[1]}%<br/>
              Employees: ${params.value[2].toLocaleString()}`
    }
  },
  legend: {
    data: ['Public Sector', 'Private Sector'],
    top: 60
  },
  grid: {
    left: '10%',
    right: '10%',
    bottom: '15%',
    top: '25%',
    containLabel: true
  },
  xAxis: {
    type: 'value',
    name: 'Agreement Duration (Months)',
    nameLocation: 'middle',
    nameGap: 30
  },
  yAxis: {
    type: 'value',
    name: 'Annual Wage Adjustment (%)',
    nameLocation: 'middle',
    nameGap: 40,
    axisLabel: {
      formatter: '{value}%'
    }
  },
  series: [
    {
      name: 'Public Sector',
      type: 'scatter',
      symbolSize: (val) => Math.sqrt(val[2]) / 50,
      data: [
        [36, 1.9, 250000],
        [48, 1.7, 500000],
        [42, 2.1, 180000],
        [60, 1.5, 120000],
        [24, 2.3, 90000],
        [36, 2.0, 300000]
      ],
      itemStyle: {
        color: '#5470c6'
      },
      emphasis: {
        focus: 'series'
      }
    },
    {
      name: 'Private Sector',
      type: 'scatter',
      symbolSize: (val) => Math.sqrt(val[2]) / 50,
      data: [
        [36, 2.5, 80000],
        [48, 2.2, 150000],
        [24, 3.0, 60000],
        [42, 2.4, 110000],
        [36, 2.7, 95000],
        [60, 2.0, 70000]
      ],
      itemStyle: {
        color: '#ee6666'
      },
      emphasis: {
        focus: 'series'
      }
    }
  ]
})
</script>

<template>
  <div class="chart-container">
    <v-chart :option="chartOption" style="width: 100%; height: 500px;" autoresize />
    <div class="chart-notes">
      <p><strong>Placeholder:</strong> Scatter plot showing relationship between contract duration and wage increases. Data loading to be implemented.</p>
    </div>
  </div>
</template>

<style scoped>
.chart-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.chart-notes {
  margin-top: 1rem;
  padding: 0.75rem;
  background: #fff3cd;
  border-radius: 6px;
  max-width: 900px;
  text-align: center;
  border: 1px solid #ffc107;
}

.chart-notes p {
  margin: 0;
  color: #856404;
  font-size: 0.9rem;
}
</style>
