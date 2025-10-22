# Getting Started - Quick Guide

## 🎯 What You Have Now

Your Vue.js + ECharts visualization project is ready to use! Here's what's set up:

### ✅ Completed Setup
- Vue 3 project with Vite (fast build tool)
- ECharts charting library installed and configured
- Swiper.js for PowerPoint-style navigation
- 5 chart components created
- Sample data loaded (Chart 1 uses real data)
- Beautiful slideshow interface

### 📂 Project Location
```
/Users/rohanjasani/Desktop/Data Viz/WagesViz/wages-viz-app/
```

## 🚀 Running Your Application

### Step 1: Open Terminal
Navigate to your project folder:
```bash
cd /Users/rohanjasani/Desktop/Data\ Viz/WagesViz/wages-viz-app
```

### Step 2: Start Development Server
```bash
npm run dev
```

### Step 3: Open Browser
Visit: **http://localhost:5173/**

You should see:
- A nice header with your project title
- A slideshow with 5 slides
- Navigation arrows and dots
- Chart 1 showing real wage data

## 📊 Your 5 Visualizations

1. **Chart 1: Time Series Wage Trends** ✅ WORKING
   - Shows Public vs Private sector wage trends 2016-2024
   - Uses real data from `TABLEAU_sector_year.csv`
   - Line chart with dual axes

2. **Chart 2: Geographic Comparison** 🚧 PLACEHOLDER
   - Federal vs Provincial comparison
   - Bar chart ready for data

3. **Chart 3: Sector Deep Dive** 🚧 PLACEHOLDER
   - Public vs Private by industry
   - Horizontal bar chart

4. **Chart 4: COLA Adoption** 🚧 PLACEHOLDER
   - Cost of Living Adjustment trends
   - Stacked bar chart

5. **Chart 5: Duration vs Wages** 🚧 PLACEHOLDER
   - Contract length vs wage increase relationship
   - Scatter plot

## 🎨 Navigation Features

- **Left/Right Arrow Keys** - Move between slides
- **Space Bar** - Go to next slide
- **Click arrows** on sides - Navigate manually
- **Click dots** at bottom - Jump to specific slide
- **Slide counter** - Shows current position (e.g., "Slide 1 of 5")

## 📸 Creating Your Presentation Screenshots

### Method 1: Browser Screenshot
1. Start your app (`npm run dev`)
2. Navigate to each slide
3. Press F12 to open DevTools
4. Press Cmd+Shift+P (Mac) or Ctrl+Shift+P (Windows)
5. Type "screenshot" and select "Capture screenshot"

### Method 2: OS Screenshot
- **Mac**: Cmd+Shift+4 (select area to capture)
- **Windows**: Windows+Shift+S

### Tips for Best Screenshots
- Use full-screen mode (F11)
- Hide browser toolbars
- Capture just the white chart area for clean slides
- Take screenshots at 1920x1080 for best quality

## 🔧 Next Steps to Complete Your Project

### Phase 1: Add More Data (Easy)
```bash
# Copy more CSV files to public/data/
cp ../cleaned_data/2_Wage_Settlements_by_Jurisdiction/TABLEAU_jurisdiction_year.csv public/data/
cp ../cleaned_data/3_Wage_Settlements_by_COLA/TABLEAU_cola_year.csv public/data/
```

### Phase 2: Implement Charts 2-5 (Medium)
Follow the pattern in `Chart1TimeSeriesWages.vue`:
1. Load CSV with `fetch()` and `Papa.parse()`
2. Process data into arrays
3. Update `chartOption` with your data
4. Test and refine

### Phase 3: Customize Styles (Easy)
Edit `App.vue` to change:
- Colors (search for `#667eea`, `#764ba2`)
- Title text
- Fonts and sizes

### Phase 4: Polish for Presentation (Medium)
- Add insights/annotations to charts
- Adjust color schemes for consistency
- Test all navigation works smoothly
- Take final screenshots

## 🆘 Common Issues & Solutions

### Charts not showing?
**Problem**: Blank slide or "Loading data..." forever
**Solution**:
- Check browser console (F12) for errors
- Verify CSV files are in `public/data/` folder
- Check data format matches expected structure

### Dev server won't start?
**Problem**: Error when running `npm run dev`
**Solution**:
```bash
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Navigation not working?
**Problem**: Can't click arrows or use keyboard
**Solution**:
- Refresh the page
- Check if Swiper CSS is loading (look in browser DevTools)
- Ensure no JavaScript errors in console

### Slides look wrong?
**Problem**: Layout is broken or overlapping
**Solution**:
- Try different browser (Chrome/Firefox)
- Clear cache and refresh
- Check window size (works best on larger screens)

## 📚 Learning Resources

### ECharts Documentation
- Official: https://echarts.apache.org/en/index.html
- Examples: https://echarts.apache.org/examples/en/index.html

### Vue 3 Documentation
- Official: https://vuejs.org/
- Guide: https://vuejs.org/guide/introduction.html

### Swiper Documentation
- Official: https://swiperjs.com/
- Vue: https://swiperjs.com/vue

## 💡 Tips for Your Presentation

1. **Keep it simple**: Focus on 2-3 key insights per chart
2. **Tell a story**: Connect the charts with a narrative
3. **Practice navigation**: Know how to quickly jump between slides
4. **Have backup**: Take screenshots in case live demo has issues
5. **Time yourself**: 7 minutes goes fast - rehearse!

## 🎓 Project Submission Checklist

For your BAIT518 course project:

- [ ] All 5 visualizations implemented (or at least 4)
- [ ] Charts have clear titles and labels
- [ ] Data is accurate and properly displayed
- [ ] Screenshots taken for PowerPoint backup
- [ ] Presentation rehearsed (7 mins)
- [ ] README.md documents your work
- [ ] Code is clean and commented
- [ ] Data sources are cited

## 📞 Need Help?

1. **Check the README.md** - Main documentation
2. **Look at Chart1TimeSeriesWages.vue** - Example of working chart
3. **Browser Console** (F12) - Check for error messages
4. **VS Code** - Hover over code for type hints

---

## 🎉 You're Ready to Go!

Your scaffolding is complete. Now you can:
1. ✅ Run the app and see Chart 1 working
2. 🔄 Implement the remaining charts with your data
3. 🎨 Customize styles to match your preferences
4. 📸 Take screenshots for your presentation
5. 🎤 Prepare your 7-minute presentation

**Good luck with your BAIT518 project!** 🚀
