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
    backgroundColor: '#ffffff',
    title: {
      text: 'Public vs Private: Wage Adjustment Over Time',
      subtext: 'Annual percentage adjustment trends (2016-2024)',
      left: 'center',
      top: 15,
      textStyle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#2c3e50'
      },
      subtextStyle: {
        fontSize: 18,
        color: '#666666'
      }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
        crossStyle: {
          color: '#999'
        }
      },
      backgroundColor: 'rgba(50, 50, 50, 0.95)',
      borderColor: '#333',
      borderWidth: 1,
      textStyle: {
        color: '#fff',
        fontSize: 14
      },
      formatter: (params) => {
        let result = `<strong style="font-size: 16px;">${params[0].axisValue}</strong><br/>`
        params.forEach(item => {
          result += `${item.marker} ${item.seriesName}: <strong>${item.value}%</strong><br/>`
        })
        return result
      }
    },
    legend: {
      data: ['Public Sector', 'Private Sector'],
      top: 85,
      textStyle: {
        color: '#2c3e50',
        fontSize: 16,
        fontWeight: '500'
      },
      itemGap: 40,
      itemWidth: 30,
      itemHeight: 4
    },
    grid: {
      left: '8%',
      right: '6%',
      bottom: '12%',
      top: '25%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: years,
      name: 'Year',
      nameLocation: 'middle',
      nameGap: 45,
      nameTextStyle: {
        color: '#2c3e50',
        fontSize: 18,
        fontWeight: 'bold'
      },
      axisLine: {
        lineStyle: {
          color: '#333333',
          width: 2
        }
      },
      axisLabel: {
        fontSize: 16,
        color: '#2c3e50',
        fontWeight: '500'
      },
      axisTick: {
        lineStyle: {
          color: '#333333'
        }
      }
    },
    yAxis: {
      type: 'value',
      name: 'Annual Wage Adjustment (%)',
      nameLocation: 'middle',
      nameGap: 65,
      nameTextStyle: {
        color: '#2c3e50',
        fontSize: 18,
        fontWeight: 'bold'
      },
      axisLine: {
        show: true,
        lineStyle: {
          color: '#333333',
          width: 2
        }
      },
      axisLabel: {
        formatter: '{value}%',
        fontSize: 16,
        color: '#2c3e50',
        fontWeight: '500'
      },
      splitLine: {
        lineStyle: {
          color: '#e0e0e0',
          width: 1
        }
      },
      axisTick: {
        lineStyle: {
          color: '#333333'
        }
      }
    },
    series: [
      {
        name: 'Public Sector',
        type: 'line',
        data: publicWages,
        smooth: true,
        lineStyle: {
          width: 5,
          color: '#1976d2'
        },
        itemStyle: {
          color: '#1976d2',
          borderWidth: 3,
          borderColor: '#ffffff'
        },
        symbolSize: 12,
        emphasis: {
          focus: 'series',
          itemStyle: {
            borderWidth: 4,
            shadowBlur: 15,
            shadowColor: 'rgba(25, 118, 210, 0.5)',
            scale: 1.3
          }
        }
      },
      {
        name: 'Private Sector',
        type: 'line',
        data: privateWages,
        smooth: true,
        lineStyle: {
          width: 5,
          color: '#d32f2f'
        },
        itemStyle: {
          color: '#d32f2f',
          borderWidth: 3,
          borderColor: '#ffffff'
        },
        symbolSize: 12,
        emphasis: {
          focus: 'series',
          itemStyle: {
            borderWidth: 4,
            shadowBlur: 15,
            shadowColor: 'rgba(211, 47, 47, 0.5)',
            scale: 1.3
          }
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
    <v-chart v-else :option="chartOption" style="width: 100%; height: 620px;" autoresize />
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
  background: #ffffff;
}

.loading {
  font-size: 1.8rem;
  color: #2c3e50;
  padding: 2rem;
  font-weight: 500;
}
</style>
