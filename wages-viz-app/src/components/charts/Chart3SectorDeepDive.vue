<script setup>
import { ref, onMounted } from 'vue'
import Papa from 'papaparse'

const chartOption = ref({})
const loading = ref(true)

onMounted(async () => {
  try {
    // Load CSV data
    const response = await fetch('/data/TABLEAU_sector_jurisdiction.csv')
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
  console.log('Raw data sample:', data.slice(0, 5))
  console.log('Total rows:', data.length)

  // Define Canadian provinces in geographic order (West to East)
  const provinces = [
    'British Columbia',
    'Alberta',
    'Saskatchewan',
    'Manitoba',
    'Ontario',
    'Quebec',
    'New Brunswick',
    'Nova Scotia',
    'Prince Edward Island',
    'Newfoundland and Labrador'
  ]

  // Filter for "All Sectors" and recent data (2024-2025)
  const recentData = data.filter(row => {
    if (!row || !row.Jurisdiction || !row.Sector_Type || !row.Month) {
      return false
    }

    const hasProvince = provinces.includes(row.Jurisdiction)
    const isAllSectors = row.Sector_Type === 'All Sectors'
    const monthStr = String(row.Month)
    const isRecent = monthStr.includes('2024') || monthStr.includes('2025')

    if (hasProvince && isAllSectors && isRecent) {
      console.log('Match found:', row.Jurisdiction, row.Month, row.Annual_Pct_Adjustment_Avg)
    }

    return hasProvince && isAllSectors && isRecent
  })

  console.log('Filtered data count:', recentData.length)

  // Aggregate data by province
  const provinceData = []

  provinces.forEach(province => {
    const provinceRows = recentData.filter(row => row.Jurisdiction === province)

    if (provinceRows.length > 0) {
      console.log(`${province}: ${provinceRows.length} rows`)

      // Calculate average wage adjustment for the province
      const totalAdjustment = provinceRows.reduce((sum, row) =>
        sum + (parseFloat(row.Annual_Pct_Adjustment_Avg) || 0), 0
      )
      const avgAdjustment = totalAdjustment / provinceRows.length

      // Calculate total employees affected
      const totalEmployees = provinceRows.reduce((sum, row) =>
        sum + (parseFloat(row.Number_of_Employees) || 0), 0
      )

      provinceData.push({
        name: province,
        value: parseFloat(avgAdjustment.toFixed(2)),
        employees: Math.round(totalEmployees)
      })
    }
  })

  console.log('Province data:', provinceData)
  console.log('Provinces with data:', provinceData.map(p => p.name))

  // If no data found, log warning but continue
  if (provinceData.length === 0) {
    console.warn('No province data found! Check filters and data structure.')
  }

  // Sort by value for better visualization
  provinceData.sort((a, b) => b.value - a.value)

  // Find min/max employees for size scaling
  const maxEmployees = Math.max(...provinceData.map(p => p.employees))
  const minEmployees = Math.min(...provinceData.map(p => p.employees))

  chartOption.value = {
    backgroundColor: '#ffffff',
    title: {
      text: 'Wage Settlements Across Canadian Provinces',
      subtext: 'Average annual wage adjustments by province (2024-2025)\nNote: Prince Edward Island excluded - no settlement data available for this period',
      left: 'center',
      top: 15,
      textStyle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#2c3e50'
      },
      subtextStyle: {
        fontSize: 15,
        color: '#666666',
        lineHeight: 22
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
        const data = params[0]
        return `<strong style="font-size: 16px;">${data.name}</strong><br/>
                Average Wage Adjustment: <strong>${data.value}%</strong><br/>
                Total Employees Affected: <strong>${data.data.employees.toLocaleString()}</strong>`
      }
    },
    grid: {
      left: '25%',
      right: '12%',
      bottom: '12%',
      top: '25%',
      containLabel: true
    },
    xAxis: {
      type: 'value',
      name: 'Average Annual Wage Adjustment (%)',
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
      data: provinceData.map(p => p.name),
      name: 'Province',
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
    visualMap: {
      min: 2.0,
      max: 5.0,
      text: ['High', 'Low'],
      orient: 'horizontal',
      left: 'center',
      bottom: '2%',
      inRange: {
        color: ['#4caf50', '#ffc107', '#ff9800', '#f44336', '#d32f2f']
      },
      textStyle: {
        color: '#2c3e50',
        fontSize: 14,
        fontWeight: '500'
      }
    },
    series: [
      {
        type: 'bar',
        data: provinceData,
        barMaxWidth: 40,
        itemStyle: {
          borderRadius: [0, 6, 6, 0]
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
            shadowBlur: 10,
            shadowColor: 'rgba(0, 0, 0, 0.3)'
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
