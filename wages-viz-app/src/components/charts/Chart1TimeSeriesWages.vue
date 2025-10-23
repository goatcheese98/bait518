<script setup>
import { ref, onMounted } from 'vue'
import Papa from 'papaparse'

const chartOption = ref({})
const loading = ref(true)
const chartRef = ref(null)
const activeYear = ref(null)
const timelineYears = ref([])

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
  // Filter for "All industries" and split by sector to prepare the race
  const publicData = data.filter(
    (row) => row.Industry === 'All industries' && row.Sector_Type === 'Public Sector'
  )
  const privateData = data.filter(
    (row) => row.Industry === 'All industries' && row.Sector_Type === 'Private Sector'
  )

  const years = Array.from(new Set([...publicData, ...privateData].map((row) => row.Year))).sort(
    (a, b) => a - b
  )
  timelineYears.value = years

  if (!years.length) {
    chartOption.value = {}
    loading.value = false
    return
  }
  activeYear.value = years[0]

  const valueForYear = (rows, key) =>
    years.map((year) => {
      const match = rows.find((row) => row.Year === year)
      return match ? match[key] : null
    })

  const publicWages = valueForYear(publicData, 'Annual_Pct_Adjustment_Avg')
  const privateWages = valueForYear(privateData, 'Annual_Pct_Adjustment_Avg')
  const publicEmployees = valueForYear(publicData, 'Number_of_Employees')
  const privateEmployees = valueForYear(privateData, 'Number_of_Employees')

  const formatEmployees = (value) => (value != null ? value.toLocaleString('en-CA') : 'N/A')

  const cumulative = (series) =>
    years.map((_, index) => {
      return series.slice(0, index + 1)
    })

  const cumulativeYears = cumulative(years)
  const publicRace = cumulative(publicWages)
  const privateRace = cumulative(privateWages)

  chartOption.value = {
    baseOption: {
      backgroundColor: '#ffffff',
      timeline: {
        show: true,
        axisType: 'category',
        autoPlay: true,
        loop: false,
        playInterval: 1500,
        bottom: 8,
        left: '12%',
        right: '12%',
        height: 54,
        symbolSize: 12,
        label: {
          color: '#37474f',
          fontSize: 14,
          margin: 18,
          formatter: (value) => `${value}`
        },
        controlStyle: {
          color: '#2c3e50',
          borderColor: '#2c3e50'
        },
        lineStyle: {
          color: '#90caf9'
        },
        progress: {
          lineStyle: {
            color: '#1976d2',
            width: 5
          },
          itemStyle: {
            color: '#1976d2'
          }
        },
        data: years.map(String)
      },
      title: {
        text: 'Public vs Private: Wage Adjustment Race',
        subtext: 'Annual percentage adjustment trends (2016-2025)',
        left: 'center',
        top: 5,
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
          type: 'line',
          lineStyle: {
            color: '#999',
            width: 2
          }
        },
        backgroundColor: 'rgba(48, 48, 48, 0.95)',
        borderColor: '#333',
        borderWidth: 1,
        textStyle: {
          color: '#fff',
          fontSize: 14
        },
        formatter: (params) => {
          if (!params.length) return ''
          const dataIndex = params[0].dataIndex
          let result = `<strong style="font-size: 16px;">${params[0].axisValue}</strong><br/>`
          params.forEach((item) => {
            const employees =
              item.seriesName === 'Public Sector'
                ? publicEmployees[dataIndex]
                : privateEmployees[dataIndex]
            result += `${item.marker} ${item.seriesName}: <strong>${item.value}%</strong>`
            if (employees != null) {
              result += ` <span style="color:#cccccc;">(${formatEmployees(
                employees
              )} employees)</span>`
            }
            result += '<br/>'
          })
          return result
        }
      },
      legend: {
        data: ['Public Sector', 'Private Sector'],
        top: 70,
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
        bottom: 108,
        top: '18%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        name: 'Year',
        boundaryGap: false,
        nameLocation: 'middle',
        nameGap: 32,
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
        },
        data: cumulativeYears[0].map(String)
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
          smooth: true,
          symbolSize: 12,
          lineStyle: {
            width: 5,
            color: '#1976d2'
          },
          itemStyle: {
            color: '#1976d2',
            borderWidth: 3,
            borderColor: '#ffffff'
          },
          emphasis: {
            focus: 'series',
            scale: 1.2,
            itemStyle: {
              borderWidth: 4,
              shadowBlur: 15,
              shadowColor: 'rgba(25, 118, 210, 0.5)'
            }
          },
          endLabel: {
            show: true,
            backgroundColor: 'rgba(255,255,255,0.9)',
            borderColor: '#1976d2',
            borderWidth: 1,
            borderRadius: 6,
            padding: [4, 8],
            fontSize: 14,
            fontWeight: '600',
            color: '#1976d2',
            formatter: ({ value }) => (value != null ? `${value}%` : '')
          },
          universalTransition: true,
          data: publicRace[0]
        },
        {
          name: 'Private Sector',
          type: 'line',
          smooth: true,
          symbolSize: 12,
          lineStyle: {
            width: 5,
            color: '#d32f2f'
          },
          itemStyle: {
            color: '#d32f2f',
            borderWidth: 3,
            borderColor: '#ffffff'
          },
          emphasis: {
            focus: 'series',
            scale: 1.2,
            itemStyle: {
              borderWidth: 4,
              shadowBlur: 15,
              shadowColor: 'rgba(211, 47, 47, 0.5)'
            }
          },
          endLabel: {
            show: true,
            backgroundColor: 'rgba(255,255,255,0.9)',
            borderColor: '#d32f2f',
            borderWidth: 1,
            borderRadius: 6,
            padding: [4, 8],
            fontSize: 14,
            fontWeight: '600',
            color: '#d32f2f',
            formatter: ({ value }) => (value != null ? `${value}%` : '')
          },
          universalTransition: true,
          data: privateRace[0]
        }
      ]
    },
    options: years.map((year, index) => ({
      title: {
        subtext: `Annual percentage adjustment trends (${years[0]}-${year})`
      },
      xAxis: {
        data: cumulativeYears[index].map(String)
      },
      series: [
        {
          data: publicRace[index]
        },
        {
          data: privateRace[index]
        }
      ]
    }))
  }

  loading.value = false
}

const replayAnimation = () => {
  const chart = chartRef.value?.chart
  if (!chart || !timelineYears.value.length) return
  chart.dispatchAction({ type: 'timelineChange', currentIndex: 0 })
  chart.dispatchAction({ type: 'timelinePlayChange', playState: true })
  activeYear.value = timelineYears.value[0]
}

const onTimelineChange = (event) => {
  const index = event?.currentIndex ?? 0
  const year = timelineYears.value[index]
  if (year != null) {
    activeYear.value = year
  }
}
</script>

<template>
  <div class="chart-container">
    <div v-if="loading" class="loading">Loading data...</div>
    <div v-else class="chart-wrapper">
      <div class="chart-controls">
        <span v-if="activeYear != null" class="year-badge">Current year: {{ activeYear }}</span>
        <button type="button" class="replay-button" @click="replayAnimation">
          Replay Animation
        </button>
      </div>
      <v-chart
        ref="chartRef"
        :option="chartOption"
        class="chart-canvas"
        style="width: 100%; height: 100%;"
        autoresize
        @timelinechanged="onTimelineChange"
      />
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
  background: #ffffff;
}

.loading {
  font-size: 1.8rem;
  color: #2c3e50;
  padding: 2rem;
  font-weight: 500;
}

.chart-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.chart-canvas {
  flex: 1;
  min-height: 440px;
}

.chart-controls {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  align-items: center;
}

.replay-button {
  background: #2c3e50;
  color: #ffffff;
  border: none;
  border-radius: 999px;
  padding: 0.5rem 1.2rem;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease, transform 0.2s ease;
}

.replay-button:hover {
  background: #1a252f;
  transform: translateY(-1px);
}

.replay-button:active {
  transform: translateY(0);
}

.year-badge {
  background: rgba(44, 62, 80, 0.08);
  color: #2c3e50;
  border-radius: 999px;
  padding: 0.4rem 1rem;
  font-size: 0.9rem;
  font-weight: 600;
}
</style>
