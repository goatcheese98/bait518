# Canadian Wage Settlements Visualization

A Vue.js application for visualizing Canadian wage settlement data from 2016-2024.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Then open http://localhost:5173/ in your browser.

## 📊 Features

- **Interactive Slideshow**: Navigate through 5 different visualizations using Swiper.js
- **ECharts Integration**: Beautiful, professional charts powered by Apache ECharts
- **Responsive Design**: Works on desktop and mobile devices
- **Keyboard Navigation**: Use arrow keys or spacebar to navigate between slides
- **Data-Driven**: Loads real CSV data from Canadian wage settlement datasets

## 📈 Visualizations

1. **Time Series Wage Trends** - Public vs Private sector wage adjustments over time (✅ Implemented)
2. **Geographic Comparison** - Federal vs Provincial jurisdiction analysis (🚧 Placeholder)
3. **Sector Deep Dive** - Industry-by-industry public/private wage comparison (🚧 Placeholder)
4. **COLA Adoption** - Cost of Living Adjustment trends over time (🚧 Placeholder)
5. **Duration vs Wages** - Scatter plot showing relationship between contract length and wage increases (🚧 Placeholder)

## 🛠️ Tech Stack

- **Vue 3** - Progressive JavaScript framework
- **Vite** - Lightning-fast build tool
- **Apache ECharts** - Professional charting library
- **vue-echarts** - Vue wrapper for ECharts
- **Swiper.js** - Modern touch slider
- **PapaParser** - CSV parsing library

## 🗂️ Project Structure

```
wages-viz-app/
├── src/
│   ├── components/
│   │   └── charts/
│   │       ├── Chart1TimeSeriesWages.vue      ✅ Working with real data
│   │       ├── Chart2GeographicComparison.vue  🚧 Placeholder
│   │       ├── Chart3SectorDeepDive.vue        🚧 Placeholder
│   │       ├── Chart4COLAAdoption.vue          🚧 Placeholder
│   │       └── Chart5DurationVsWages.vue       🚧 Placeholder
│   ├── App.vue               # Main slideshow container
│   └── main.ts              # App entry point with ECharts setup
├── public/
│   └── data/                # CSV data files
│       └── TABLEAU_sector_year.csv
└── package.json
```

## 📂 Adding Data

Place your CSV files in the `public/data/` directory.

To add more data files:

1. Copy CSV files from `../cleaned_data/` to `public/data/`
2. Update the corresponding chart component to load the data
3. Follow the pattern used in `Chart1TimeSeriesWages.vue`

Example:
```bash
# Copy data files
cp ../cleaned_data/2_Wage_Settlements_by_Jurisdiction/TABLEAU_jurisdiction_year.csv public/data/
```

## 🎨 Customization

### Changing Chart Colors

Edit the chart `itemStyle.color` properties in each component:

```javascript
itemStyle: {
  color: '#5470c6'  // Blue for Public Sector
  // color: '#ee6666'  // Red for Private Sector
}
```

### Modifying Slide Layout

Edit `App.vue` to change:
- Header title and subtitle (line 29-30)
- Slide dimensions (`.wages-swiper` height in styles)
- Navigation button styles (`:deep(.swiper-button-*)`)
- Background gradient colors (`#app` background)

## 📱 Keyboard Shortcuts

- **Arrow Left/Right** - Navigate between slides
- **Space** - Advance to next slide
- **Mouse Click** - Click pagination dots to jump to slide

## 📸 Taking Screenshots for Presentation

For your PowerPoint presentation:

1. Start the dev server: `npm run dev`
2. Navigate to each slide
3. Take screenshots:
   - **Mac**: Cmd+Shift+4 (select area)
   - **Windows**: Windows+Shift+S
   - **Browser**: F12 > Device toolbar > Screenshot icon

## 🔧 Next Steps for Development

1. **Implement remaining charts** - Copy the pattern from Chart1TimeSeriesWages.vue
2. **Add more CSV files** - Copy from `cleaned_data/` folders
3. **Enhance interactivity** - Add tooltips, zoom, filters
4. **Style refinements** - Adjust colors, fonts, spacing
5. **Add annotations** - Highlight key insights on charts

## 📊 Data Source

Data sourced from: [Employment and Social Development Canada - Wage Settlements](https://www.canada.ca/en/employment-social-development/services/collective-bargaining-data/wages.html)

## 🚀 Production Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

The `dist/` folder contains your production build ready for deployment.

## 🎓 Course Project

This is a course project for **BAIT518 Data Visualization** at UBC Sauder School of Business.

**Team Project Goals:**
- Create 4-5 insightful visualizations
- Present findings in 7-minute presentation
- Make data easily digestible and actionable

---

**Built with ❤️ using Vue.js and Apache ECharts**
