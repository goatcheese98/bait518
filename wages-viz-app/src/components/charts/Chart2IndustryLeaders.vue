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

  const industrySummary = INDUSTRIES.map((industry) => {
    const rows = filtered.filter((row) => row.Industry === industry)
    const adjustments = rows
      .map((row) => row.Annual_Pct_Adjustment_Avg)
      .filter((value) => typeof value === 'number')

    const firstYear = rows
      .map((row) => row.First_Year_Pct_Adjustment_Avg)
      .filter((value) => typeof value === 'number')

    const employeeTotal = rows
      .map((row) => row.Number_of_Employees)
      .filter((value) => typeof value === 'number')

    const avgAnnual =
      adjustments.length > 0
        ? adjustments.reduce((sum, value) => sum + value, 0) / adjustments.length
        : 0
    const avgFirstYear =
      firstYear.length > 0
        ? firstYear.reduce((sum, value) => sum + value, 0) / firstYear.length
        : 0
    const totalEmployees =
      employeeTotal.length > 0 ? employeeTotal.reduce((sum, value) => sum + value, 0) : 0

    const latestRow = rows.find((row) => row.Year === 2025) || rows[rows.length - 1]

    return {
      industry,
      avgAnnual: Number(avgAnnual.toFixed(2)),
      avgFirstYear: Number(avgFirstYear.toFixed(2)),
      employeeTotal: Math.round(totalEmployees),
      latestYear: latestRow ? latestRow.Year : null,
      latestAnnual: latestRow ? latestRow.Annual_Pct_Adjustment_Avg : null
    }
  }).filter((item) => item.avgAnnual > 0)

  industrySummary.sort((a, b) => b.avgAnnual - a.avgAnnual)

  const topIndustries = industrySummary.slice(0, 8)

  if (!topIndustries.length) {
    chartOption.value = {
      title: {
        text: 'Industry Leaders Overview',
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
          text: 'No industry-level data available for the selected period.',
          fontSize: 18,
          fill: '#666666'
        }
      }
    }
    loading.value = false
    return
  }

  const firstYearValues = topIndustries.map((item) => item.avgFirstYear)
  const minFirstYear = Math.min(...firstYearValues)
  const maxFirstYear = Math.max(...firstYearValues)

  const interpolateColor = (value) => {
    if (maxFirstYear === minFirstYear) {
      return '#43a047'
    }
    const ratio = (value - minFirstYear) / (maxFirstYear - minFirstYear)
    const start = [165, 214, 167]
    const end = [67, 160, 71]
    const channel = (idx) => Math.round(start[idx] + (end[idx] - start[idx]) * ratio)
    return `rgb(${channel(0)}, ${channel(1)}, ${channel(2)})`
  }

  chartOption.value = {
    backgroundColor: '#ffffff',
    title: {
      text: 'Which Industries Lead Wage Growth?',
      subtext: 'Average annual % adjustment (2023-2025)',
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
          <strong style="font-size: 16px;">${data.industry}</strong><br/>
          Avg Annual Adjustment: <strong>${data.avgAnnual}%</strong><br/>
          Avg First-Year Adjustment: <strong>${data.avgFirstYear}%</strong><br/>
          Latest Year Observed: <strong>${data.latestYear || 'n/a'}</strong><br/>
          Employees Covered (2023-2025): <strong>${data.employeeTotal.toLocaleString()}</strong>
        `
      }
    },
    grid: {
      left: '5%',
      right: '8%',
      bottom: '12%',
      top: '28%',
      containLabel: true
    },
    xAxis: {
      type: 'value',
      min: 0,
      max: Math.ceil(Math.max(...topIndustries.map((item) => item.avgAnnual)) + 1),
      name: 'Average Annual % Adjustment',
      nameLocation: 'middle',
      nameGap: 50,
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
    yAxis: {
      type: 'category',
      data: topIndustries.map((item) => item.industry),
      name: 'Industry',
      nameLocation: 'end',
      nameGap: 15,
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
        fontSize: 15,
        color: '#2c3e50',
        fontWeight: '500'
      },
      axisTick: {
        show: false
      }
    },
    visualMap: null,
    series: [
      {
        type: 'bar',
        data: topIndustries.map((item) => ({
          value: item.avgAnnual,
          industry: item.industry,
          avgAnnual: item.avgAnnual,
          avgFirstYear: item.avgFirstYear,
          latestYear: item.latestYear,
          latestAnnual: item.latestAnnual,
          employeeTotal: item.employeeTotal,
          itemStyle: {
            color: interpolateColor(item.avgFirstYear)
          }
        })),
        realtimeSort: true,
        barMaxWidth: 38,
        itemStyle: {
          borderRadius: [0, 10, 10, 0]
        },
        label: {
          show: true,
          position: 'right',
          formatter: '{c}%',
          fontSize: 15,
          fontWeight: 'bold',
          color: '#2c3e50'
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 12,
            shadowColor: 'rgba(0, 0, 0, 0.25)'
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
