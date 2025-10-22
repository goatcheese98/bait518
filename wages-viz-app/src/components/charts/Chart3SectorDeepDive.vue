<script setup>
import { ref } from 'vue'

const chartOption = ref({
  title: {
    text: 'Public vs Private Sector Wage Comparison by Industry',
    left: 'center',
    textStyle: {
      fontSize: 20,
      fontWeight: 'bold'
    }
  },
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'shadow'
    }
  },
  legend: {
    data: ['Private Sector', 'Public Sector'],
    top: 40
  },
  grid: {
    left: '15%',
    right: '10%',
    bottom: '10%',
    top: '20%',
    containLabel: true
  },
  xAxis: {
    type: 'value',
    name: 'Avg Annual Wage Adjustment (%)'
  },
  yAxis: {
    type: 'category',
    data: ['Education & Health', 'Public Administration', 'Transportation', 'Manufacturing', 'Finance', 'Construction']
  },
  series: [
    {
      name: 'Private Sector',
      type: 'bar',
      data: [2.1, 1.8, 2.5, 2.3, 1.9, 2.4],
      itemStyle: {
        color: '#ee6666'
      }
    },
    {
      name: 'Public Sector',
      type: 'bar',
      data: [1.7, 1.5, 1.9, 1.6, 1.4, 1.8],
      itemStyle: {
        color: '#5470c6'
      }
    }
  ]
})
</script>

<template>
  <div class="chart-container">
    <v-chart :option="chartOption" style="width: 100%; height: 500px;" autoresize />
    <div class="chart-notes">
      <p><strong>Placeholder:</strong> Butterfly/diverging bar chart showing public vs private wage gaps by industry. Data loading to be implemented.</p>
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
