<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import Papa from 'papaparse'

const props = defineProps({
  fullscreen: {
    type: Boolean,
    default: false
  }
})

const chartOption = ref({})
const loading = ref(true)
const chartRef = ref(null)
const activeYear = ref(null)
const timelineYears = ref([])
const fontScale = computed(() => props.fullscreen ? 1.3 : 1)
const rawData = ref(null)

const fs = (size) => Math.round(size * fontScale.value)

watch(() => props.fullscreen, () => {
  if (rawData.value) {
    processData(rawData.value)
  }
})

onMounted(async () => {
  try {
    // Load CSV data
    const response = await fetch('/data/TABLEAU_sector_year.csv')
    const csvText = await response.text()

    Papa.parse(csvText, {
      header: true,
      dynamicTyping: true,
      complete: (results) => {
        rawData.value = results.data
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
        autoPlay: false,
        loop: false,
        playInterval: 1500,
        currentIndex: 5,
        bottom: 12,
        left: '12%',
        right: '12%',
        height: 48,
        symbolSize: 11,
        label: {
          color: '#37474f',
          fontSize: fs(14),
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
        text: 'Public vs Private: Wage Adjustment Racing Chart',
        subtext: 'Annual percentage adjustment trends {bold|(2016-2025)}',
        left: 'center',
        top: 5,
        textStyle: {
          fontSize: fs(32),
          fontWeight: 'bold',
          color: '#2c3e50'
        },
        subtextStyle: {
          fontSize: fs(18),
          color: '#666666',
          rich: {
            bold: {
              fontWeight: 'bold',
              color: '#2c3e50'
            }
          }
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
        backgroundColor: 'rgba(255, 252, 245, 0.98)',
        borderColor: '#2c3e50',
        borderWidth: 3,
        padding: [16, 20],
        textStyle: {
          color: '#2c3e50',
          fontSize: fs(17),
          fontFamily: 'Comic Sans MS, Brush Script MT, cursive'
        },
        formatter: (params) => {
          if (!params.length) return ''
          const dataIndex = params[0].dataIndex
          const year = params[0].axisValue
          let result = `<strong style="font-size: ${fs(20)}px; font-family: Comic Sans MS, Brush Script MT, cursive;">${year}</strong><br/><br/>`

          // Get 2016 baseline values (first year)
          const public2016 = publicWages[0]
          const private2016 = privateWages[0]

          params.forEach((item) => {
            // Color code sector names
            const sectorColor = item.seriesName === 'Public Sector' ? '#1976d2' : '#d32f2f'
            result += `${item.marker} <strong style="color:${sectorColor};">${item.seriesName}: ${item.value}%</strong>`

            // Calculate multiplier from 2016 levels
            if (dataIndex > 0 && item.value != null) {
              const baseline2016 = item.seriesName === 'Public Sector' ? public2016 : private2016

              if (baseline2016 != null && baseline2016 !== 0) {
                const multiplier = item.value / baseline2016
                const multiplierText = `${multiplier.toFixed(1)}x`
                const changeColor = multiplier >= 1 ? '#27ae60' : '#e74c3c'
                result += ` <span style="color:${changeColor}; font-weight:bold;">(${multiplierText} vs 2016)</span>`
              }
            }
            result += '<br/>'
          })

          return result
        }
      },
      legend: {
        data: ['Public Sector', 'Private Sector'],
        top: 95,
        textStyle: {
          color: '#2c3e50',
          fontSize: fs(16),
          fontWeight: '500'
        },
        itemGap: 40,
        itemWidth: 30,
        itemHeight: 4
      },
      grid: {
        left: '8%',
        right: '6%',
        bottom: 120,
        top: '20%',
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
          fontSize: fs(18),
          fontWeight: 'bold'
        },
        axisLine: {
          lineStyle: {
            color: '#333333',
            width: 2
          }
        },
        axisLabel: {
          fontSize: fs(16),
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
          fontSize: fs(18),
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
          fontSize: fs(16),
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
            fontSize: fs(14),
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
            fontSize: fs(14),
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
