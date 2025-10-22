<script setup>
import { ref, onMounted } from 'vue'
import Papa from 'papaparse'

const chartOption = ref({})
const loading = ref(true)

onMounted(async () => {
  try {
    // Load CSV data
    const response = await fetch('/data/TABLEAU_jurisdiction_year.csv')
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
  // Filter for "All industries" and recent years (2020-2024)
  const recentYears = [2020, 2021, 2022, 2023, 2024]
  const filteredData = data.filter(row =>
    row.Sector === 'All industries' &&
    recentYears.includes(row.Year) &&
    (row.Jurisdiction === 'Federal Jurisdiction' || row.Jurisdiction === 'Provincial Jurisdiction')
  )

  // Extract data for each year
  const years = recentYears.map(y => y.toString())
  const federalWages = []
  const provincialWages = []

  recentYears.forEach(year => {
    const federalRow = filteredData.find(row =>
      row.Year === year && row.Jurisdiction === 'Federal Jurisdiction'
    )
    const provincialRow = filteredData.find(row =>
      row.Year === year && row.Jurisdiction === 'Provincial Jurisdiction'
    )

    federalWages.push(federalRow ? federalRow.Annual_Pct_Adjustment_Avg : null)
    provincialWages.push(provincialRow ? provincialRow.Annual_Pct_Adjustment_Avg : null)
  })

  chartOption.value = {
    backgroundColor: '#ffffff',
    title: {
      text: 'Federal vs Provincial: Wage Adjustment Comparison',
      subtext: 'Average annual wage adjustments by jurisdiction (2020-2024)',
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
        type: 'shadow'
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
      data: ['Federal Jurisdiction', 'Provincial Jurisdiction'],
      top: 85,
      textStyle: {
        color: '#2c3e50',
        fontSize: 16,
        fontWeight: '500'
      },
      itemGap: 40,
      itemWidth: 30,
      itemHeight: 20
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
        name: 'Federal Jurisdiction',
        type: 'bar',
        data: federalWages,
        itemStyle: {
          color: '#7b1fa2',
          borderRadius: [4, 4, 0, 0]
        },
        barMaxWidth: 60,
        emphasis: {
          itemStyle: {
            color: '#9c27b0',
            shadowBlur: 10,
            shadowColor: 'rgba(123, 31, 162, 0.5)'
          }
        },
        label: {
          show: true,
          position: 'top',
          formatter: '{c}%',
          fontSize: 14,
          fontWeight: 'bold',
          color: '#2c3e50'
        }
      },
      {
        name: 'Provincial Jurisdiction',
        type: 'bar',
        data: provincialWages,
        itemStyle: {
          color: '#00897b',
          borderRadius: [4, 4, 0, 0]
        },
        barMaxWidth: 60,
        emphasis: {
          itemStyle: {
            color: '#26a69a',
            shadowBlur: 10,
            shadowColor: 'rgba(0, 137, 123, 0.5)'
          }
        },
        label: {
          show: true,
          position: 'top',
          formatter: '{c}%',
          fontSize: 14,
          fontWeight: 'bold',
          color: '#2c3e50'
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
