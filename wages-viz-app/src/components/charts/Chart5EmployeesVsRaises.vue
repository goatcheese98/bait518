<script setup>
import { ref, onMounted } from 'vue'
import Papa from 'papaparse'

const chartOption = ref({})
const loading = ref(true)

const PROVINCES = [
  'Alberta',
  'British Columbia',
  'Manitoba',
  'New Brunswick',
  'Newfoundland and Labrador',
  'Nova Scotia',
  'Ontario',
  'Prince Edward Island',
  'Quebec',
  'Saskatchewan',
  'Multi-provinces'
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
  const focusYears = Array.from({ length: 2025 - 2016 + 1 }, (_, i) => 2016 + i)

  const filtered = data.filter((row) => {
    return (
      row.Sector_Type === 'All Sectors' &&
      PROVINCES.includes(row.Industry) &&
      focusYears.includes(row.Year)
    )
  })

  const provinceData = PROVINCES.map((province) => {
    const rows = filtered.filter((row) => row.Industry === province)
    if (!rows.length) return null

    const annualAvg =
      rows.reduce((sum, row) => sum + (row.Annual_Pct_Adjustment_Avg || 0), 0) / rows.length
    const employeesTotal = rows.reduce((sum, row) => sum + (row.Number_of_Employees || 0), 0)
    const employees = employeesTotal / rows.length
    const agreements = rows.reduce((sum, row) => sum + (row.Number_of_Agreements || 0), 0)
    const firstYearAvg =
      rows.reduce((sum, row) => sum + (row.First_Year_Pct_Adjustment_Avg || 0), 0) / rows.length

    return {
      name: province,
      employees,
      employeesTotal,
      annualAvg,
      agreements,
      firstYearAvg
    }
  }).filter(Boolean)

  if (!provinceData.length) {
    chartOption.value = {
      title: {
        text: 'Employees vs. Wage Adjustments',
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
          text: 'No regional data available for the selected period.',
          fontSize: 18,
          fill: '#666666'
        }
      }
    }
    loading.value = false
    return
  }

  const employeeValues = provinceData.map((item) => item.employees)
  const annualValues = provinceData.map((item) => item.annualAvg)
  const employeeMin = Math.min(...employeeValues)
  const employeeMax = Math.max(...employeeValues)
  const annualMin = Math.min(...annualValues)
  const annualMax = Math.max(...annualValues)

  const symbolSize = (employees) => {
    const minSize = 18
    const maxSize = 70
    if (employeeMin === employeeMax) return maxSize
    return minSize + ((employees - employeeMin) / (employeeMax - employeeMin)) * (maxSize - minSize)
  }

  const highlightColors = {
    'British Columbia': '#1e88e5',
    'Ontario': '#43a047',
    'Quebec': '#f4511e',
    'Alberta': '#8e24aa'
  }

  const makeSeries = (label, color, items) => ({
    name: label,
    type: 'scatter',
    data: items.map((item) => ({
      name: item.name,
      value: [item.employees, Number(item.annualAvg.toFixed(2))],
      annualAvg: item.annualAvg,
      firstYearAvg: item.firstYearAvg,
      employees: item.employees,
      employeesTotal: item.employeesTotal,
      agreements: item.agreements,
      symbolSize: symbolSize(item.employees)
    })),
    itemStyle: {
      color,
      shadowBlur: 12,
      shadowColor: 'rgba(0, 0, 0, 0.18)'
    },
    emphasis: {
      focus: 'series'
    }
  })

  const highlightSeries = Object.entries(highlightColors)
    .map(([region, color]) => {
      const point = provinceData.find((item) => item.name === region)
      if (!point) return null
      return makeSeries(region, color, [point])
    })
    .filter(Boolean)

  const otherProvinces = provinceData.filter((item) => !(item.name in highlightColors))
  const otherSeries = otherProvinces.length ? makeSeries('Other provinces', '#90a4ae', otherProvinces) : null

  chartOption.value = {
    backgroundColor: '#ffffff',
    title: {
      text: 'Do Bigger Bargaining Units Win Bigger Raises?',
      subtext: 'Average annual % adjustment vs. employees represented (2016-2025)',
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
          Avg Annual Adjustment: <strong>${data.annualAvg.toFixed(2)}%</strong><br/>
          Avg First-Year Adjustment: <strong>${data.firstYearAvg.toFixed(2)}%</strong><br/>
          Avg Employees Covered (per year): <strong>${Math.round(data.employees).toLocaleString()}</strong><br/>
          Total Employees Across Deals: <strong>${Math.round(data.employeesTotal).toLocaleString()}</strong><br/>
          Agreements Signed (2016-2025): <strong>${Math.round(data.agreements).toLocaleString()}</strong>
        `
      }
    },
    legend: {
      data: [...highlightSeries.map((series) => series.name), ...(otherSeries ? ['Other provinces'] : [])],
      top: 85,
      textStyle: {
        color: '#2c3e50',
        fontSize: 16,
        fontWeight: '500'
      },
      itemGap: 26
    },
    grid: {
      left: '10%',
      right: '6%',
      bottom: '12%',
      top: '26%',
      containLabel: true
    },
    xAxis: {
      type: 'value',
      name: 'Average Employees Covered (per year)',
      nameLocation: 'middle',
      nameGap: 50,
      min: Math.max(Math.floor(employeeMin / 1000) * 1000 - 5000, 0),
      max: Math.ceil(employeeMax / 1000) * 1000 + 5000,
      axisLabel: {
      formatter: (value) => `${(value / 1000).toFixed(0)}k`,
        fontSize: 16,
        color: '#2c3e50',
        fontWeight: '500'
      },
      axisLine: {
        lineStyle: {
          color: '#333333',
          width: 2
        }
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
      min: Math.max(Math.floor(annualMin) - 1, 0),
      max: Math.ceil(annualMax + 1),
      axisLabel: {
        formatter: '{value}%',
        fontSize: 16,
        color: '#2c3e50',
        fontWeight: '500'
      },
      axisLine: {
        lineStyle: {
          color: '#333333',
          width: 2
        }
      },
      splitLine: {
        lineStyle: {
          color: '#e0e0e0',
          width: 1
        }
      }
    },
    series: otherSeries ? [...highlightSeries, otherSeries] : [...highlightSeries]
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
