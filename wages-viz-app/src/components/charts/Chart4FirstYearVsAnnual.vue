<script setup>
import { ref, onMounted } from 'vue'
import Papa from 'papaparse'

const chartOption = ref({})
const loading = ref(true)

onMounted(async () => {
  try {
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
  const allSectorRows = data.filter(
    (row) => row.Industry === 'All industries' && row.Sector_Type === 'All Sectors'
  )

  if (!allSectorRows.length) {
    chartOption.value = {
      title: {
        text: 'First-Year vs Annual Adjustments',
        left: 'center',
        top: '40%',
        textStyle: {
          fontSize: 28,
          fontWeight: 'bold',
          color: '#2c3e50'
        }
      },
      graphic: {
        type: 'text',
        left: 'center',
        top: '52%',
        style: {
          text: 'No aggregate industry data available.',
          fontSize: 18,
          fill: '#666666'
        }
      }
    }
    loading.value = false
    return
  }

  const years = [...new Set(allSectorRows.map((row) => row.Year))].sort((a, b) => a - b)

  const firstYearSeries = years.map((year) => {
    const match = allSectorRows.find((row) => row.Year === year)
    return match && typeof match.First_Year_Pct_Adjustment_Avg === 'number'
      ? Number(match.First_Year_Pct_Adjustment_Avg.toFixed(2))
      : null
  })

  const annualSeries = years.map((year) => {
    const match = allSectorRows.find((row) => row.Year === year)
    return match && typeof match.Annual_Pct_Adjustment_Avg === 'number'
      ? Number(match.Annual_Pct_Adjustment_Avg.toFixed(2))
      : null
  })

  const gapSeries = years.map((_, idx) => {
    const annual = annualSeries[idx]
    const firstYear = firstYearSeries[idx]
    return annual != null && firstYear != null ? Number((firstYear - annual).toFixed(2)) : null
  })

  const numberValues = (arr) => arr.filter((value) => typeof value === 'number' && !Number.isNaN(value))
  const annualValues = numberValues([...annualSeries, ...firstYearSeries])
  const annualMax = annualValues.length ? Math.max(...annualValues) : 5

  chartOption.value = {
    backgroundColor: '#ffffff',
    title: {
      text: 'Front-Loaded vs. Steady Wage Gains',
      subtext: 'All industries • First-year vs. annual average adjustments (2016-2025)',
      left: 'center',
      top: 15,
      textStyle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#2c3e50'
      },
      subtextStyle: {
        fontSize: 16,
        color: '#666666'
      }
    },
    legend: {
      data: ['First-Year Adjustment', 'Annualised Adjustment'],
      top: 85,
      textStyle: {
        color: '#2c3e50',
        fontSize: 16,
        fontWeight: '500'
      },
      itemGap: 40,
      itemWidth: 32,
      itemHeight: 14
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
        const first = params.find((item) => item.seriesName === 'First-Year Adjustment')
        const annual = params.find((item) => item.seriesName === 'Annualised Adjustment')
        const gap =
          first && annual ? Number((first.value - annual.value).toFixed(2)) : null
        let tooltip = `<strong style=\"font-size: 16px;\">${params[0].axisValue}</strong><br/>`
        params.forEach((item) => {
          tooltip += `${item.marker} ${item.seriesName}: <strong>${item.value}%</strong><br/>`
        })
        if (gap != null) {
          tooltip += `<span style=\"color:#43a047;\">Gap: <strong>${gap >= 0 ? '+' : ''}${gap} pp</strong></span>`
        }
        return tooltip
      }
    },
    grid: {
      left: '8%',
      right: '6%',
      bottom: '12%',
      top: '30%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: true,
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
        alignWithLabel: true,
        lineStyle: {
          color: '#333333'
        }
      }
    },
    yAxis: {
      type: 'value',
      name: 'Average Wage Adjustment (%)',
      nameLocation: 'middle',
      nameGap: 65,
      min: 0,
      max: Math.ceil((annualMax || 5) + 1),
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
      }
    },
    series: [
      {
        name: 'First-Year Adjustment',
        type: 'bar',
        data: firstYearSeries,
        barWidth: 22,
        barGap: '20%',
        barCategoryGap: '45%',
        itemStyle: {
          color: '#ef6c00',
          borderRadius: [6, 6, 0, 0]
        },
        label: {
          show: true,
          position: 'top',
          formatter: '{c}%',
          fontSize: 12,
          fontWeight: 600,
          color: '#2c3e50'
        },
        emphasis: {
          focus: 'series'
        }
      },
      {
        name: 'Annualised Adjustment',
        type: 'bar',
        data: annualSeries,
        barWidth: 22,
        barGap: '20%',
        barCategoryGap: '45%',
        itemStyle: {
          color: '#1565c0',
          borderRadius: [6, 6, 0, 0]
        },
        label: {
          show: true,
          position: 'top',
          formatter: '{c}%',
          fontSize: 12,
          fontWeight: 600,
          color: '#2c3e50'
        },
        emphasis: {
          focus: 'series'
        }
      },
      {
        name: 'Gap indicator',
        type: 'scatter',
        symbolSize: 1,
        data: years.map((year, idx) => {
          const first = firstYearSeries[idx]
          const annual = annualSeries[idx]
          if (first == null || annual == null) return null
          const maxBar = Math.max(first, annual)
          const gap = Number((first - annual).toFixed(2))
          return {
            value: [year, maxBar + 0.25],
            gap
          }
        }).filter(Boolean),
        itemStyle: {
          color: 'rgba(0,0,0,0)'
        },
        label: {
          show: true,
          formatter: (params) => {
            const gap = params.data.gap
            if (Math.abs(gap) < 0.2) return ''
            const sign = gap > 0 ? '+' : ''
            const style = gap >= 0 ? 'pos' : 'neg'
            return `{${style}|${sign}${gap} pp}`
          },
          rich: {
            pos: {
              color: '#1b5e20',
              fontSize: 12,
              fontWeight: 600,
              backgroundColor: 'rgba(255,255,255,0.9)',
              borderRadius: 4,
              padding: [2, 6],
              borderColor: 'rgba(27, 94, 32, 0.4)',
              borderWidth: 1
            },
            neg: {
              color: '#b71c1c',
              fontSize: 12,
              fontWeight: 600,
              backgroundColor: 'rgba(255,255,255,0.9)',
              borderRadius: 4,
              padding: [2, 6],
              borderColor: 'rgba(183, 28, 28, 0.4)',
              borderWidth: 1
            }
          }
        },
        tooltip: {
          show: false
        },
        silent: true
      }
    ],
    graphic: gapSeries.some((value) => value != null && value > 0.5)
      ? [
          {
            type: 'text',
            left: '70%',
            top: '20%',
            style: {
              text: 'Notice the widening front-load since 2022.',
              fontSize: 14,
              fill: '#424242',
              fontWeight: 500,
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              padding: [6, 10],
              borderRadius: 6,
              shadowColor: 'rgba(0,0,0,0.1)',
              shadowBlur: 6
            }
          }
        ]
      : []
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
