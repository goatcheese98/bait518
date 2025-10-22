<script setup>
import { ref } from 'vue'

const chartOption = ref({
  title: {
    text: 'Geographic Comparison: Federal vs Provincial Jurisdictions',
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
    data: ['Federal', 'Provincial'],
    top: 40
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '10%',
    top: '20%',
    containLabel: true
  },
  xAxis: {
    type: 'category',
    data: ['Avg First Year Adjustment', 'Number of Agreements', 'Avg Duration (Months)', 'Number of Employees']
  },
  yAxis: {
    type: 'value'
  },
  series: [
    {
      name: 'Federal',
      type: 'bar',
      data: [2.0, 30, 47, 120000],
      itemStyle: {
        color: '#5470c6'
      }
    },
    {
      name: 'Provincial',
      type: 'bar',
      data: [1.6, 196, 42, 683000],
      itemStyle: {
        color: '#91cc75'
      }
    }
  ]
})
</script>

<template>
  <div class="chart-container">
    <v-chart :option="chartOption" style="width: 100%; height: 500px;" autoresize />
    <div class="chart-notes">
      <p><strong>Placeholder:</strong> This chart will show Federal vs Provincial jurisdiction comparisons. Data loading to be implemented.</p>
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
