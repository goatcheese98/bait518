# Development Checklist

Use this checklist to track your progress as you complete the project.

## Phase 1: Setup ✅ COMPLETE

- [x] Create Vue.js project with Vite
- [x] Install ECharts and dependencies
- [x] Set up Swiper.js for navigation
- [x] Create 5 chart component files
- [x] Implement Chart 1 with real data
- [x] Test dev server runs successfully

**Status**: ✅ All scaffolding complete! Ready for development.

---

## Phase 2: Data Loading 🔄 IN PROGRESS

### Chart 2: Geographic Comparison
- [ ] Copy `TABLEAU_jurisdiction_year.csv` to `public/data/`
- [ ] Update `Chart2GeographicComparison.vue` to load CSV
- [ ] Process data to extract Federal vs Provincial stats
- [ ] Configure chart options (grouped bar chart)
- [ ] Test and verify chart displays correctly
- [ ] Add meaningful chart annotations

### Chart 3: Sector Deep Dive
- [ ] Copy `TABLEAU_sector_industry.csv` to `public/data/`
- [ ] Update `Chart3SectorDeepDive.vue` to load CSV
- [ ] Filter data for major industries
- [ ] Create diverging bar chart (public left, private right)
- [ ] Test and verify chart displays correctly
- [ ] Add industry labels and insights

### Chart 4: COLA Adoption
- [ ] Copy `TABLEAU_cola_year.csv` to `public/data/`
- [ ] Update `Chart4COLAAdoption.vue` to load CSV
- [ ] Calculate percentage with/without COLA by year
- [ ] Configure stacked bar chart
- [ ] Test and verify chart displays correctly
- [ ] Highlight recent COLA adoption trends

### Chart 5: Duration vs Wages
- [ ] Copy appropriate CSV files to `public/data/`
- [ ] Update `Chart5DurationVsWages.vue` to load CSV
- [ ] Extract duration and wage adjustment data
- [ ] Configure scatter plot with bubble sizes
- [ ] Add trend line or annotations
- [ ] Test and verify chart displays correctly

---

## Phase 3: Styling & Polish 🎨

### Visual Consistency
- [ ] Choose consistent color scheme (public/private colors)
- [ ] Apply colors consistently across all charts
- [ ] Ensure all titles are clear and descriptive
- [ ] Add subtitles where needed
- [ ] Verify all axis labels are readable

### User Experience
- [ ] Test keyboard navigation (arrows, space)
- [ ] Test mouse navigation (click arrows, dots)
- [ ] Verify slide counter updates correctly
- [ ] Check responsive design on different screen sizes
- [ ] Ensure smooth transitions between slides

### Content Quality
- [ ] Add chart annotations for key insights
- [ ] Write meaningful descriptions in chart notes
- [ ] Verify all data is displaying correctly
- [ ] Check for any data loading errors
- [ ] Test with real data scenarios

---

## Phase 4: Presentation Preparation 📸

### Screenshots
- [ ] Set browser to full-screen mode (F11)
- [ ] Take screenshot of Chart 1
- [ ] Take screenshot of Chart 2
- [ ] Take screenshot of Chart 3
- [ ] Take screenshot of Chart 4
- [ ] Take screenshot of Chart 5
- [ ] Take screenshot of title slide
- [ ] Save all as high-quality PNGs (1920x1080)

### PowerPoint Backup
- [ ] Create PowerPoint presentation
- [ ] Insert all chart screenshots
- [ ] Add title slide with project info
- [ ] Add data source citation
- [ ] Add key insights for each chart
- [ ] Number slides (1/5, 2/5, etc.)
- [ ] Add speaker notes
- [ ] Practice presentation timing (7 mins)

### Presentation Content
- [ ] Write introduction (30 seconds)
- [ ] Prepare talking points for each chart (1 min each)
- [ ] Prepare conclusion with key takeaways (30 seconds)
- [ ] Create Q&A preparation notes
- [ ] Practice transitions between charts
- [ ] Rehearse full presentation 2-3 times

---

## Phase 5: Documentation & Submission 📝

### Code Documentation
- [ ] Add comments to complex code sections
- [ ] Update README.md with final status
- [ ] Document any custom modifications
- [ ] List all data sources used
- [ ] Note any AI tools used (ChatGPT, Claude, etc.)

### Project Files
- [ ] Ensure all CSV files are included or linked
- [ ] Check all code files are saved
- [ ] Test build process (`npm run build`)
- [ ] Create deployment package if needed
- [ ] Organize all submission files

### Final Checks
- [ ] Verify application runs without errors
- [ ] Test on different browsers (Chrome, Firefox)
- [ ] Check all charts display data correctly
- [ ] Verify all navigation works smoothly
- [ ] Do final presentation rehearsal
- [ ] Prepare backup plan (screenshots ready)

---

## Submission Checklist (BAIT518)

**Due Date**: October 23, 2025 at 11:59 PM

- [ ] **PDF Report**: Main documentation (concise, critical info only)
- [ ] **Data Files**: CSV files or link to data
- [ ] **Code Files**: All Vue.js source code
- [ ] **Tableau Files**: If used (N/A for this project)
- [ ] **Prompt History**: If using AI tools
- [ ] **Presentation Materials**: PowerPoint backup slides
- [ ] **Screenshots**: All chart visualizations
- [ ] **README**: Project documentation

---

## Time Estimates

| Phase | Estimated Time | Priority |
|-------|---------------|----------|
| Implement Chart 2 | 30-45 mins | HIGH |
| Implement Chart 3 | 30-45 mins | HIGH |
| Implement Chart 4 | 30-45 mins | HIGH |
| Implement Chart 5 | 45-60 mins | MEDIUM |
| Styling & Polish | 45-60 mins | MEDIUM |
| Take Screenshots | 15-20 mins | HIGH |
| Create PowerPoint | 30-45 mins | HIGH |
| Practice Presentation | 30-60 mins | HIGH |
| Documentation | 20-30 mins | MEDIUM |

**Total Estimated Time**: 4-6 hours

---

## Tips for Efficiency

1. **Focus on Charts 2-4 first** - These are simpler to implement
2. **Reuse Chart 1 code** - Copy the data loading pattern
3. **Test incrementally** - Don't wait until all charts are done
4. **Use placeholders** - If stuck, use mock data to keep moving
5. **Time box tasks** - Don't spend more than 1 hour on any single chart
6. **Ask for help early** - Don't struggle alone for too long

---

## Emergency Backup Plan

If running short on time:

### Minimum Viable Product (MVP)
- Chart 1 ✅ Already done
- Chart 2 (Geographic) - **Priority 1**
- Chart 4 (COLA) - **Priority 2**
- Charts 3 & 5 can use placeholder data if needed

### Quick Wins
- Focus on getting 3-4 charts working with real data
- Use placeholder data for remaining charts
- Take screenshots of working charts
- Prepare solid talking points for what you have

---

## Questions to Answer During Development

As you build each chart, ask yourself:

1. **What insight does this chart reveal?**
2. **Is the data accurate and correctly displayed?**
3. **Are the labels clear and readable?**
4. **Does the chart tell a story?**
5. **What will I say during the presentation?**

---

## Notes & Ideas

Use this space for quick notes as you work:

```
Chart 2 Ideas:
-

Chart 3 Ideas:
-

Chart 4 Ideas:
-

Chart 5 Ideas:
-

Presentation Notes:
-
```

---

**Current Status**: 🟢 Scaffolding complete, ready to implement charts
**Next Action**: Copy CSV files and implement Chart 2
**Deadline**: October 23, 2025 at 11:59 PM

**Good luck!** 🚀
