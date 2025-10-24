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
const rawData = ref(null)
const fontScale = computed(() => props.fullscreen ? 1.3 : 1)
const fs = (size) => Math.round(size * fontScale.value)

watch(() => props.fullscreen, () => {
  if (rawData.value) {
    processData(rawData.value)
  }
})

const INDUSTRIES = [
  'Information and culture',
  'Education, health, and social services',
  'Public administration',
  'Manufacturing',
  'Entertainment and hospitality'
]

onMounted(async () => {
  try {
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
  const years = Array.from({ length: 2025 - 2016 + 1 }, (_, i) => 2016 + i)

  // Filter for all sectors across all industries
  const filtered = data.filter((row) => {
    return (
      row.Sector_Type === 'All Sectors' &&
      INDUSTRIES.includes(row.Industry) &&
      years.includes(row.Year)
    )
  })

  console.log('Filtered data count:', filtered.length)

  // Prepare box plot data for each industry
  const boxplotData = []
  const scatterDataByYear = {
    2020: [],
    2021: [],
    2022: [],
    2023: [],
    2024: [],
    2025: []
  }
  const olderYearsData = []

  INDUSTRIES.forEach((industry, industryIndex) => {
    const industryRows = filtered.filter((row) => row.Industry === industry)
    const wageValues = industryRows
      .map((row) => row.Annual_Pct_Adjustment_Avg)
      .filter((value) => typeof value === 'number' && !isNaN(value))
      .sort((a, b) => a - b)

    console.log(`${industry}: ${wageValues.length} data points`, wageValues)

    if (wageValues.length === 0) {
      console.warn(`No data for ${industry}`)
      return
    }

    // Calculate quartiles for box plot
    const min = Math.min(...wageValues)
    const max = Math.max(...wageValues)
    const q1Index = Math.floor(wageValues.length * 0.25)
    const medianIndex = Math.floor(wageValues.length * 0.5)
    const q3Index = Math.floor(wageValues.length * 0.75)

    const q1 = wageValues[q1Index]
    const median = wageValues[medianIndex]
    const q3 = wageValues[q3Index]

    boxplotData.push([min, q1, median, q3, max])

    // Add individual data points for scatter overlay (all years)
    industryRows.forEach((row) => {
      if (typeof row.Annual_Pct_Adjustment_Avg === 'number') {
        const dataPoint = {
          value: [industryIndex, row.Annual_Pct_Adjustment_Avg],
          industry: industry,
          year: row.Year,
          wage: Number(row.Annual_Pct_Adjustment_Avg.toFixed(2)),
          employees: row.Number_of_Employees,
          agreements: row.Number_of_Agreements
        }

        if (row.Year >= 2020 && row.Year <= 2025) {
          scatterDataByYear[row.Year].push(dataPoint)
        } else {
          olderYearsData.push(dataPoint)
        }
      }
    })
  })

  console.log('Box plot data:', boxplotData)
  console.log('Scatter data by year:', scatterDataByYear)
  console.log('Older years data count:', olderYearsData.length)

  if (!boxplotData.length) {
    chartOption.value = {
      title: {
        text: 'Industry Wage Distribution',
        left: 'center',
        top: '40%',
        textStyle: {
          fontSize: fs(28),
          fontWeight: 'bold',
          color: '#2c3e50'
        }
      },
      graphic: {
        type: 'text',
        left: 'center',
        top: '52%',
        style: {
          text: 'No wage distribution data available.',
          fontSize: fs(18),
          fill: '#666666'
        }
      }
    }
    loading.value = false
    return
  }

  const yearColors = {
    2016: '#bdbdbd',
    2017: '#bdbdbd',
    2018: '#bdbdbd',
    2019: '#bdbdbd',
    2020: '#fff59d',
    2021: '#ffeb3b',
    2022: '#ffc107',
    2023: '#ff9800',
    2024: '#ff5722',
    2025: '#d32f2f'
  }

  chartOption.value = {
    backgroundColor: '#ffffff',
    title: {
      text: 'How Do Wage Gains Vary Across Industries?',
      subtext: 'Annual wage adjustment distribution by industry (2016-2025)',
      left: 'center',
      top: 5,
      textStyle: {
        fontSize: fs(32),
        fontWeight: 'bold',
        color: '#2c3e50'
      },
      subtextStyle: {
        fontSize: fs(16),
        color: '#666666',
        lineHeight: 20
      }
    },
    legend: {
      data: [
        { name: '2020', itemStyle: { color: yearColors[2020] } },
        { name: '2021', itemStyle: { color: yearColors[2021] } },
        { name: '2022', itemStyle: { color: yearColors[2022] } },
        { name: '2023', itemStyle: { color: yearColors[2023] } },
        { name: '2024', itemStyle: { color: yearColors[2024] } },
        { name: '2025', itemStyle: { color: yearColors[2025] } }
      ],
      top: '12%',
      left: 'center',
      orient: 'horizontal',
      textStyle: {
        fontSize: fs(16),
        color: '#2c3e50',
        fontWeight: 'bold'
      },
      itemWidth: 22,
      itemHeight: 22,
      itemGap: 25,
      icon: 'circle',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#d0d0d0',
      borderWidth: 1.5,
      padding: [12, 20],
      borderRadius: 6,
      selectedMode: 'multiple',
      inactiveColor: '#bdbdbd',
      inactiveBorderColor: '#999999'
    },
    tooltip: {
      trigger: 'item',
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
        if (params.componentSubType === 'boxplot') {
          const industry = INDUSTRIES[params.dataIndex]
          const [min, q1, median, q3, max] = params.data
          return `
            <strong style="font-size: ${fs(20)}px; font-family: Comic Sans MS, Brush Script MT, cursive;">${industry}</strong><br/>
            Maximum: <strong>${max.toFixed(2)}%</strong><br/>
            Upper Quartile (Q3): <strong>${q3.toFixed(2)}%</strong><br/>
            Median: <strong>${median.toFixed(2)}%</strong><br/>
            Lower Quartile (Q1): <strong>${q1.toFixed(2)}%</strong><br/>
            Minimum: <strong>${min.toFixed(2)}%</strong>
          `
        } else {
          const { data } = params
          return `
            <strong style="font-size: ${fs(20)}px; font-family: Comic Sans MS, Brush Script MT, cursive;">${data.industry}</strong><br/>
            Year: <strong>${data.year}</strong><br/>
            Annual Adjustment: <strong>${data.wage}%</strong><br/>
            Employees: <strong>${data.employees ? data.employees.toLocaleString() : 'N/A'}</strong><br/>
            Agreements: <strong>${data.agreements ? data.agreements.toLocaleString() : 'N/A'}</strong>
          `
        }
      }
    },
    grid: {
      left: '5%',
      right: '3%',
      bottom: '8%',
      top: '20%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: INDUSTRIES,
      boundaryGap: true,
      nameGap: 30,
      axisLine: {
        lineStyle: {
          color: '#333333',
          width: 2
        }
      },
      axisLabel: {
        fontSize: fs(15),
        color: '#2c3e50',
        fontWeight: 'bold',
        interval: 0,
        rotate: 25,
        margin: 10,
        lineHeight: 18,
        align: 'right'
      },
      axisTick: {
        show: true,
        lineStyle: {
          color: '#333333'
        }
      },
      splitLine: {
        show: false
      }
    },
    yAxis: {
      type: 'value',
      name: 'Annual Wage Adjustment (%)',
      nameLocation: 'middle',
      nameGap: 60,
      min: 0,
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
        fontSize: fs(15),
        color: '#2c3e50',
        fontWeight: 'bold'
      },
      splitLine: {
        lineStyle: {
          color: '#eeeeee',
          width: 1,
          type: 'solid'
        }
      }
    },
    series: [
      {
        name: 'Box Plot',
        type: 'boxplot',
        data: boxplotData,
        itemStyle: {
          color: 'rgba(100, 181, 246, 0.15)',
          borderColor: '#1976d2',
          borderWidth: 2.5
        },
        boxWidth: ['35%', '55%'],
        emphasis: {
          itemStyle: {
            borderWidth: 3.5,
            borderColor: '#0d47a1',
            shadowBlur: 12,
            shadowColor: 'rgba(0, 0, 0, 0.4)'
          }
        }
      },
      // Older years (2016-2019) - gray
      {
        name: 'Older Years',
        type: 'scatter',
        data: olderYearsData,
        symbolSize: 20,
        itemStyle: {
          color: '#bdbdbd',
          opacity: 0.35,
          borderWidth: 1.5,
          borderColor: '#ffffff',
          shadowBlur: 2,
          shadowColor: 'rgba(0, 0, 0, 0.1)'
        },
        emphasis: {
          itemStyle: {
            opacity: 0.7,
            shadowBlur: 8,
            shadowColor: 'rgba(0, 0, 0, 0.3)',
            borderWidth: 2.5
          },
          scale: 1.2
        },
        zlevel: 1,
        legendHoverLink: false
      },
      // Year 2020
      {
        name: '2020',
        type: 'scatter',
        data: scatterDataByYear[2020],
        symbolSize: 20,
        itemStyle: {
          color: yearColors[2020],
          opacity: 0.85,
          borderWidth: 1.5,
          borderColor: '#ffffff',
          shadowBlur: 3,
          shadowColor: 'rgba(0, 0, 0, 0.15)'
        },
        emphasis: {
          itemStyle: {
            opacity: 1,
            shadowBlur: 12,
            shadowColor: 'rgba(0, 0, 0, 0.4)',
            borderWidth: 3
          },
          scale: 1.3
        },
        zlevel: 1
      },
      // Year 2021
      {
        name: '2021',
        type: 'scatter',
        data: scatterDataByYear[2021],
        symbolSize: 20,
        itemStyle: {
          color: yearColors[2021],
          opacity: 0.85,
          borderWidth: 1.5,
          borderColor: '#ffffff',
          shadowBlur: 3,
          shadowColor: 'rgba(0, 0, 0, 0.15)'
        },
        emphasis: {
          itemStyle: {
            opacity: 1,
            shadowBlur: 12,
            shadowColor: 'rgba(0, 0, 0, 0.4)',
            borderWidth: 3
          },
          scale: 1.3
        },
        zlevel: 1
      },
      // Year 2022
      {
        name: '2022',
        type: 'scatter',
        data: scatterDataByYear[2022],
        symbolSize: 20,
        itemStyle: {
          color: yearColors[2022],
          opacity: 0.85,
          borderWidth: 1.5,
          borderColor: '#ffffff',
          shadowBlur: 3,
          shadowColor: 'rgba(0, 0, 0, 0.15)'
        },
        emphasis: {
          itemStyle: {
            opacity: 1,
            shadowBlur: 12,
            shadowColor: 'rgba(0, 0, 0, 0.4)',
            borderWidth: 3
          },
          scale: 1.3
        },
        zlevel: 1
      },
      // Year 2023
      {
        name: '2023',
        type: 'scatter',
        data: scatterDataByYear[2023],
        symbolSize: 20,
        itemStyle: {
          color: yearColors[2023],
          opacity: 0.85,
          borderWidth: 1.5,
          borderColor: '#ffffff',
          shadowBlur: 3,
          shadowColor: 'rgba(0, 0, 0, 0.15)'
        },
        emphasis: {
          itemStyle: {
            opacity: 1,
            shadowBlur: 12,
            shadowColor: 'rgba(0, 0, 0, 0.4)',
            borderWidth: 3
          },
          scale: 1.3
        },
        zlevel: 1
      },
      // Year 2024
      {
        name: '2024',
        type: 'scatter',
        data: scatterDataByYear[2024],
        symbolSize: 20,
        itemStyle: {
          color: yearColors[2024],
          opacity: 0.85,
          borderWidth: 1.5,
          borderColor: '#ffffff',
          shadowBlur: 3,
          shadowColor: 'rgba(0, 0, 0, 0.15)'
        },
        emphasis: {
          itemStyle: {
            opacity: 1,
            shadowBlur: 12,
            shadowColor: 'rgba(0, 0, 0, 0.4)',
            borderWidth: 3
          },
          scale: 1.3
        },
        zlevel: 1
      },
      // Year 2025
      {
        name: '2025',
        type: 'scatter',
        data: scatterDataByYear[2025],
        symbolSize: 20,
        itemStyle: {
          color: yearColors[2025],
          opacity: 0.85,
          borderWidth: 1.5,
          borderColor: '#ffffff',
          shadowBlur: 3,
          shadowColor: 'rgba(0, 0, 0, 0.15)'
        },
        emphasis: {
          itemStyle: {
            opacity: 1,
            shadowBlur: 12,
            shadowColor: 'rgba(0, 0, 0, 0.4)',
            borderWidth: 3
          },
          scale: 1.3
        },
        zlevel: 1
      }
    ]
  }

  loading.value = false
}
</script>

<template>
  <div class="chart-container">
    <div v-if="loading" class="loading">Loading data...</div>
    <v-chart
      v-else
      :option="chartOption"
      class="chart-canvas"
      style="width: 100%; height: 100%;"
      autoresize
    />
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

.chart-canvas {
  flex: 1;
  min-height: 440px;
}
</style>
