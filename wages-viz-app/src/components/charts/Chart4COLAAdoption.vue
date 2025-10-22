<script setup>
import { ref, onMounted } from 'vue'
import Papa from 'papaparse'

const chartOption = ref({})
const loading = ref(true)

onMounted(async () => {
  try {
    // Load CSV data
    const response = await fetch('/data/TABLEAU_cola_year.csv')
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
  // Filter for "All sectors" data
  const allSectorsData = data.filter(row => row.Sector === 'All sectors')

  // Get unique years and sort them
  const years = [...new Set(allSectorsData.map(row => row.Year))].sort()

  // Calculate percentages for each year
  const withCOLAPercentages = []
  const withoutCOLAPercentages = []

  years.forEach(year => {
    const yearData = allSectorsData.filter(row => row.Year === year)
    const totalRow = yearData.find(row => row.COLA_Status === 'Total')
    const withCOLARow = yearData.find(row => row.COLA_Status === 'With COLA')
    const withoutCOLARow = yearData.find(row => row.COLA_Status === 'Without COLA')

    if (totalRow && withCOLARow && withoutCOLARow) {
      const totalAgreements = totalRow.Number_of_Agreements
      const withCOLAAgreements = withCOLARow.Number_of_Agreements
      const withoutCOLAAgreements = withoutCOLARow.Number_of_Agreements

      // Calculate percentages
      const withCOLAPercentage = (withCOLAAgreements / totalAgreements) * 100
      const withoutCOLAPercentage = (withoutCOLAAgreements / totalAgreements) * 100

      withCOLAPercentages.push(withCOLAPercentage.toFixed(1))
      withoutCOLAPercentages.push(withoutCOLAPercentage.toFixed(1))
    }
  })

  chartOption.value = {
    backgroundColor: '#ffffff',
    title: {
      text: 'COLA Adoption Rate Over Time',
      subtext: 'Percentage of wage agreements with cost-of-living adjustments (2016-2025)',
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
        type: 'cross'
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
      data: ['Without COLA', 'With COLA'],
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
      boundaryGap: false,
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
      max: 100,
      name: 'Percentage of Agreements (%)',
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
        name: 'Without COLA',
        type: 'line',
        stack: 'Total',
        areaStyle: {
          color: '#78909c'
        },
        lineStyle: {
          width: 3,
          color: '#546e7a'
        },
        itemStyle: {
          color: '#546e7a',
          borderWidth: 2,
          borderColor: '#ffffff'
        },
        data: withoutCOLAPercentages,
        symbolSize: 10,
        emphasis: {
          focus: 'series'
        }
      },
      {
        name: 'With COLA',
        type: 'line',
        stack: 'Total',
        areaStyle: {
          color: '#ffa726'
        },
        lineStyle: {
          width: 3,
          color: '#ff9800'
        },
        itemStyle: {
          color: '#ff9800',
          borderWidth: 2,
          borderColor: '#ffffff'
        },
        data: withCOLAPercentages,
        symbolSize: 10,
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
