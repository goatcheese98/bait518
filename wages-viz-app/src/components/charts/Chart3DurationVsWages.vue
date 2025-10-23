<script setup>
import { ref, onMounted } from 'vue'
import Papa from 'papaparse'

const chartOption = ref({})
const loading = ref(true)

const INDUSTRIES = [
  'Construction',
  'Education, health, and social services',
  'Entertainment and hospitality',
  'Finance and professional services',
  'Information and culture',
  'Manufacturing',
  'Primary industries',
  'Public administration',
  'Transportation',
  'Utilities',
  'Wholesale and retail trade'
]

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
  const focusYears = [2023, 2024, 2025]

  const filtered = data.filter((row) => {
    return (
      row.Sector_Type === 'All Sectors' &&
      INDUSTRIES.includes(row.Industry) &&
      focusYears.includes(row.Year)
    )
  })

  const scatterData = INDUSTRIES.map((industry) => {
    const rows = filtered.filter((row) => row.Industry === industry)
    if (!rows.length) return null

    const avgDuration =
      rows.reduce((sum, row) => sum + (row.Duration_Months_Avg || 0), 0) / rows.length
    const avgAnnual =
      rows.reduce((sum, row) => sum + (row.Annual_Pct_Adjustment_Avg || 0), 0) / rows.length
    const avgFirstYear =
      rows.reduce((sum, row) => sum + (row.First_Year_Pct_Adjustment_Avg || 0), 0) / rows.length
    const agreements = rows.reduce((sum, row) => sum + (row.Number_of_Agreements || 0), 0)
    const employees = rows.reduce((sum, row) => sum + (row.Number_of_Employees || 0), 0)

    return {
      name: industry,
      value: [
        Number(avgDuration.toFixed(1)),
        Number(avgAnnual.toFixed(2)),
        Math.max(agreements, 1)
      ],
      avgAnnual: Number(avgAnnual.toFixed(2)),
      avgFirstYear: Number(avgFirstYear.toFixed(2)),
      avgDuration: Number(avgDuration.toFixed(1)),
      agreements: Math.round(agreements),
      employees: Math.round(employees)
    }
  }).filter(Boolean)

  if (!scatterData.length) {
    chartOption.value = {
      title: {
        text: 'Contract Duration vs Wage Growth',
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
          text: 'No duration data available for the selected period.',
          fontSize: 18,
          fill: '#666666'
        }
      }
    }
    loading.value = false
    return
  }

  const industryColors = {
    'Construction': '#ffa726',
    'Education, health, and social services': '#42a5f5',
    'Entertainment and hospitality': '#ef5350',
    'Finance and professional services': '#7e57c2',
    'Information and culture': '#26a69a',
    'Manufacturing': '#ab47bc',
    'Primary industries': '#66bb6a',
    'Public administration': '#5c6bc0',
    'Transportation': '#29b6f6',
    'Utilities': '#8d6e63',
    'Wholesale and retail trade': '#ff7043'
  }

  const sizeScaler = (agreements) => {
    const minSize = 18
    const maxSize = 65
    const agreementsValues = scatterData.map((item) => item.value[2])
    const min = Math.min(...agreementsValues)
    const max = Math.max(...agreementsValues)
    if (min === max) return maxSize
    return minSize + ((agreements - min) / (max - min)) * (maxSize - minSize)
  }

  const yMax = Math.ceil(Math.max(...scatterData.map((item) => item.value[1])) + 1)
  const educationPoint = scatterData.find(
    (item) => item.name === 'Education, health, and social services'
  )

  const highlightIndustries = [
    'Education, health, and social services',
    'Entertainment and hospitality'
  ]

  const highlightLabels = {
    'Education, health, and social services': 'Education & Health',
    'Entertainment and hospitality': 'Entertainment & Hospitality'
  }

  const highlightPoints = scatterData.filter((item) => highlightIndustries.includes(item.name))
  const otherPoints = scatterData.filter((item) => !highlightIndustries.includes(item.name))

  const makeScatterPoint = (item) => ({
    ...item,
    symbolSize: sizeScaler(item.value[2])
  })

  const otherSeries = {
    name: 'Other industries',
    type: 'scatter',
    data: otherPoints.map((item) => ({
      ...makeScatterPoint(item),
      itemStyle: {
        color: '#b0bec5',
        shadowBlur: 10,
        shadowColor: 'rgba(0, 0, 0, 0.15)'
      }
    })),
    emphasis: {
      focus: 'series'
    }
  }

  const highlightSeries = highlightPoints.map((point) => {
    const alias = highlightLabels[point.name] || point.name
    const color = industryColors[point.name] || '#ff7043'
    return {
      name: alias,
      type: 'scatter',
      data: [
        {
          ...makeScatterPoint(point),
          itemStyle: {
            color,
            shadowBlur: 20,
            shadowColor: 'rgba(0, 0, 0, 0.25)'
          },
          label: {
            show: true,
            formatter: alias,
            fontFamily:
              '"Permanent Marker","Patrick Hand","Comic Sans MS","Bradley Hand",cursive',
            color,
            fontSize: point.name.length > 20 ? 14 : 16,
            fontWeight: 600,
            backgroundColor: 'rgba(255, 255, 255, 0.85)',
            borderRadius: 8,
            padding: [4, 8],
            borderColor: 'rgba(0,0,0,0.12)',
            borderWidth: 1,
            offset: [0, 26]
          }
        }
      ],
      tooltip: {
        formatter: (params) => {
          const data = params.data
          return `
            <strong style="font-size: 16px;">${point.name}</strong><br/>
            Avg Annual Adjustment: <strong>${data.avgAnnual}%</strong><br/>
            Avg First-Year Adjustment: <strong>${data.avgFirstYear}%</strong><br/>
            Avg Contract Duration: <strong>${data.avgDuration} months</strong><br/>
            Agreements Signed: <strong>${data.agreements.toLocaleString()}</strong><br/>
            Employees Covered: <strong>${data.employees.toLocaleString()}</strong>
          `
        }
      },
      emphasis: {
        focus: 'series'
      }
    }
  })

  const bandSeries = {
    type: 'scatter',
    coordinateSystem: 'cartesian2d',
    symbolSize: 0,
    data: [],
    markArea: {
      silent: true,
      itemStyle: {
        color: 'rgba(46, 204, 113, 0.08)'
      },
      data: [
        [
          { yAxis: 3.5 },
          { yAxis: yMax }
        ]
      ]
    },
    markLine: {
      silent: true,
      lineStyle: {
        color: '#90caf9',
        width: 2,
        type: 'dashed'
      },
      data: [
        {
          name: '4% threshold',
          yAxis: 4,
          label: {
            formatter: '4%+ raises',
            color: '#1976d2',
            fontWeight: '600',
            fontSize: 13,
            padding: [4, 6],
            backgroundColor: 'rgba(255,255,255,0.8)',
            borderRadius: 6,
            position: 'end'
          }
        }
      ]
    }
  }

  const series = [...highlightSeries, otherSeries, bandSeries]

  chartOption.value = {
    backgroundColor: '#ffffff',
    title: {
      text: 'Do Longer Contracts Deliver Better Raises?',
      subtext: 'Average contract duration vs. annual wage adjustment (2023-2025)\nBubble size = total agreements signed',
      left: 'center',
      top: 15,
      textStyle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#2c3e50'
      },
      subtextStyle: {
        fontSize: 16,
        color: '#666666',
        lineHeight: 22
      }
    },
    legend: {
      data: [...highlightSeries.map((item) => item.name), 'Other industries'],
      orient: 'vertical',
      top: 'middle',
      right: '4%',
      textStyle: {
        color: '#2c3e50',
        fontSize: 16,
        fontWeight: '500'
      },
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      padding: [12, 16],
      borderRadius: 10,
      itemGap: 18
    },
    graphic: [
      {
        type: 'text',
        left: '65%',
        top: '86%',
        style: {
          text: 'Shaded band highlights annual raises above 3.5%',
          fontSize: 13,
          fill: '#455a64',
          fontWeight: 500,
          lineHeight: 20
        }
      }
    ],
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(50, 50, 50, 0.95)',
      borderColor: '#333',
      borderWidth: 1,
      textStyle: {
        color: '#fff',
        fontSize: 14
      },
      formatter: (params) => {
        const { data } = params
        return `
          <strong style="font-size: 16px;">${data.name}</strong><br/>
          Avg Annual Adjustment: <strong>${data.avgAnnual}%</strong><br/>
          Avg First-Year Adjustment: <strong>${data.avgFirstYear}%</strong><br/>
          Avg Contract Duration: <strong>${data.avgDuration} months</strong><br/>
          Agreements Signed: <strong>${data.agreements.toLocaleString()}</strong><br/>
          Employees Covered: <strong>${data.employees.toLocaleString()}</strong>
        `
      }
    },
    grid: {
      left: '8%',
      right: '20%',
      bottom: '16%',
      top: '26%',
      containLabel: true
    },
    xAxis: {
      type: 'value',
      name: 'Average Contract Duration (months)',
      nameLocation: 'middle',
      nameGap: 50,
      min: Math.floor(Math.min(...scatterData.map((item) => item.value[0])) - 2),
      max: Math.ceil(Math.max(...scatterData.map((item) => item.value[0])) + 2),
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
      splitLine: {
        lineStyle: {
          color: '#e0e0e0',
          width: 1
        }
      }
    },
    yAxis: {
      type: 'value',
      name: 'Average Annual Wage Adjustment (%)',
      nameLocation: 'middle',
      nameGap: 60,
      min: Math.max(Math.floor(Math.min(...scatterData.map((item) => item.value[1])) - 1), 0),
      max: Math.ceil(Math.max(...scatterData.map((item) => item.value[1])) + 1),
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
    visualMap: null,
    series
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
