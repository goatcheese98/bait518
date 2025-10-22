<script setup>
import { ref } from 'vue'

const chartOption = ref({
  title: {
    text: 'COLA (Cost of Living Adjustment) Adoption Over Time',
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
    },
    formatter: (params) => {
      let result = params[0].axisValue + '<br/>'
      params.forEach(item => {
        result += `${item.marker} ${item.seriesName}: ${item.value}%<br/>`
      })
      return result
    }
  },
  legend: {
    data: ['Without COLA', 'With COLA'],
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
    data: ['2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024']
  },
  yAxis: {
    type: 'value',
    max: 100,
    axisLabel: {
      formatter: '{value}%'
    }
  },
  series: [
    {
      name: 'Without COLA',
      type: 'bar',
      stack: 'total',
      data: [95, 99, 99, 99, 89, 95, 92, 88, 85],
      itemStyle: {
        color: '#91cc75'
      }
    },
    {
      name: 'With COLA',
      type: 'bar',
      stack: 'total',
      data: [5, 1, 1, 1, 11, 5, 8, 12, 15],
      itemStyle: {
        color: '#fac858'
      }
    }
  ]
})
</script>

<template>
  <div class="chart-container">
    <v-chart :option="chartOption" style="width: 100%; height: 500px;" autoresize />
    <div class="chart-notes">
      <p><strong>Placeholder:</strong> Shows percentage of agreements with/without COLA provisions over time. Data loading to be implemented.</p>
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
