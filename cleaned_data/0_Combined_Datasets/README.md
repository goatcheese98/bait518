# Combined Datasets

This folder contains aggregated datasets combining multiple related files for easier analysis.

## Files

### Master Combined Files

1. **COMBINED_sector.csv** (1,773 rows)
   - All wage settlements data organized by sector
   - Includes industry, jurisdiction, month, quarter, and year breakdowns
   - Combines all 5 sector-related datasets

2. **COMBINED_jurisdiction.csv** (1,025 rows)
   - All wage settlements data organized by jurisdiction
   - Includes federal, provincial, and territorial data
   - Combines all 5 jurisdiction-related datasets

3. **COMBINED_cola.csv** (525 rows)
   - All Cost of Living Adjustment (COLA) data
   - Includes administration, industry, and time-based breakdowns
   - Combines all 5 COLA-related datasets

4. **COMBINED_listing.csv** (529 rows)
   - Complete listings of major settlements reached
   - Includes all combinations of COLA, industry, sector, and jurisdiction
   - Combines all 6 listing-related datasets

### Summary File

5. **_DATA_SUMMARY.csv**
   - Statistical summary of all datasets
   - Includes row counts, column counts, and coverage information
   - Useful for understanding data completeness

## Use Cases

- **Quick analysis** across multiple dimensions
- **Trend identification** over time
- **Comparative analysis** between sectors/jurisdictions
- **Data exploration** before diving into specific subsets

## Data Fields

All combined files include:
- Original data metrics (agreements, employees, adjustments, etc.)
- Metadata: `page_source`, `section`, `extraction_date`
- Standardized column names (lowercase, underscored)

## Notes

- All numeric fields have been cleaned and converted
- Missing data represented as NaN (originally '–')
- Multi-index columns have been flattened for easier use
