<script setup>
import { ref, onMounted } from 'vue'
import Papa from 'papaparse'

const chartOption = ref({})
const loading = ref(true)

onMounted(async () => {
  try {
    // Load CSV data
    const response = await fetch('/data/TABLEAU_sector_year.csv')
    const csvText = await response.text()

    Papa.parse(csvText, {
      header: true,
      dynamicTyping: true,
      complete: (results) => {
        processData(results.data)
      }
    })
  } catch (error) {
    console.error('Error loading data:', error)
    loading.value = false
  }
})

const processData = (data) => {
  // Filter for All Industries and separate by sector
  const publicData = data.filter(row =>
    row.Industry === 'All industries' && row.Sector_Type === 'Public Sector'
  )
  const privateData = data.filter(row =>
    row.Industry === 'All industries' && row.Sector_Type === 'Private Sector'
  )

  // Extract years and values
  const years = publicData.map(row => row.Year).sort()
  const publicWages = years.map(year => {
    const row = publicData.find(r => r.Year === year)
    return row ? row.Annual_Pct_Adjustment_Avg : null
  })
  const privateWages = years.map(year => {
    const row = privateData.find(r => r.Year === year)
    return row ? row.Annual_Pct_Adjustment_Avg : null
  })
  const publicEmployees = years.map(year => {
    const row = publicData.find(r => r.Year === year)
    return row ? row.Number_of_Employees : null
  })
  const privateEmployees = years.map(year => {
    const row = privateData.find(r => r.Year === year)
    return row ? row.Number_of_Employees : null
  })

  chartOption.value = {
    title: {
      text: 'Wage Adjustment Trends: Public vs Private Sector (2016-2024)',
      left: 'center',
      textStyle: {
        fontSize: 20,
        fontWeight: 'bold'
      }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross'
      }
    },
    legend: {
      data: ['Public Sector Wage %', 'Private Sector Wage %', 'Public Employees', 'Private Employees'],
      top: 40
    },
    grid: {
      left: '5%',
      right: '5%',
      bottom: '15%',
      top: '20%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: years,
      name: 'Year',
      nameLocation: 'middle',
      nameGap: 30,
      axisLabel: {
        fontSize: 12
      }
    },
    yAxis: [
      {
        type: 'value',
        name: 'Annual Wage Adjustment (%)',
        position: 'left',
        axisLabel: {
          formatter: '{value}%'
        }
      },
      {
        type: 'value',
        name: 'Number of Employees',
        position: 'right',
        axisLabel: {
          formatter: (value) => {
            return (value / 1000).toFixed(0) + 'K'
          }
        }
      }
    ],
    series: [
      {
        name: 'Public Sector Wage %',
        type: 'line',
        data: publicWages,
        smooth: true,
        lineStyle: {
          width: 3
        },
        itemStyle: {
          color: '#5470c6'
        },
        emphasis: {
          focus: 'series'
        }
      },
      {
        name: 'Private Sector Wage %',
        type: 'line',
        data: privateWages,
        smooth: true,
        lineStyle: {
          width: 3
        },
        itemStyle: {
          color: '#ee6666'
        },
        emphasis: {
          focus: 'series'
        }
      },
      {
        name: 'Public Employees',
        type: 'bar',
        yAxisIndex: 1,
        data: publicEmployees,
        itemStyle: {
          color: 'rgba(84, 112, 198, 0.3)'
        },
        barGap: '-100%',
        emphasis: {
          focus: 'series'
        }
      },
      {
        name: 'Private Employees',
        type: 'bar',
        yAxisIndex: 1,
        data: privateEmployees,
        itemStyle: {
          color: 'rgba(238, 102, 102, 0.3)'
        },
        emphasis: {
          focus: 'series'
        }
      }
    ]
  }

  loading.value = false
}
</script>

<template>
  <div class="chart-container">
    <div v-if="loading" class="loading">Loading data...</div>
    <v-chart v-else :option="chartOption" style="width: 100%; height: 500px;" autoresize />
    <div class="chart-notes">
      <p><strong>Key Insight:</strong> Track how wage adjustments changed over time, especially during COVID-19 and recent inflation periods.</p>
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

.loading {
  font-size: 1.5rem;
  color: #666;
  padding: 2rem;
}

.chart-notes {
  margin-top: 1rem;
  padding: 0.75rem;
  background: #f0f2f5;
  border-radius: 6px;
  max-width: 900px;
  text-align: center;
}

.chart-notes p {
  margin: 0;
  color: #555;
  font-size: 0.9rem;
}
</style>
