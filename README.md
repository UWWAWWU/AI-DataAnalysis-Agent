<div align="center">

<img src="public/favicon.svg" alt="AI Data Analysis Agent" width="72" />

# AI Data Analysis Agent

**From raw data to clear insights.**

Upload a dataset, let AI investigate it, and explore the results through an interactive dashboard.

[Open the application](https://aiagent.wawutriambodo.my.id/)

</div>

## Overview

AI Data Analysis Agent turns CSV and Excel files into useful metrics, charts and explanations. The agent examines the available columns, chooses analyses, checks the results and builds a dashboard suited to the dataset.

You can explore the dashboard, ask questions, request additional calculations and review proposed data changes before applying them.

## Features

| Feature | What you can do |
| --- | --- |
| Dataset upload | Open CSV or XLSX files up to 40 MB and select an Excel sheet. |
| Automatic analysis | Let AI choose quality checks, statistics, comparisons, distributions, correlations and Python investigations. |
| Interactive dashboard | Explore KPI cards and charts on a 16:9 canvas with clear labels, observation counts and zoom controls. |
| Flexible layout | Move and resize charts, align them to the grid or arrange them automatically. |
| Chart controls | Choose compatible chart types and adjust titles, axes, labels, legends and colors. Inspect the figures behind a chart. |
| Filters | Explore supported categories and date ranges. Click a category in a linked chart to filter the dashboard. |
| AI conversation | Ask about results, add or revise charts, change filters and request further analysis. |
| Data details | Inspect column types, missing values, exact duplicates, source rows, AI analysis decisions and methodology. |
| Data review | Review affected rows and before and after values for duplicates, missing values and potential outliers. Apply changes or keep the data. |
| Downloads | Export the dashboard as HTML or PDF, download CSV data or save analysis results as JSON. Download the original dataset from Data review. |
| Session recovery | Restore the dataset, filters, dashboard and conversation when refreshing the same tab. Continue an interrupted analysis from its saved checkpoint. |
| Language settings | Choose English or Indonesian. The selection is retained when refreshing the same tab. |

Supported charts include bar, horizontal bar, line, area, pie, donut, treemap, histogram, scatter and box plots. Available controls depend on the chart and dataset.

## How it works

1. Upload a CSV or XLSX file.
2. The application profiles the data and prepares unambiguous numeric values and surrounding whitespace.
3. The agent chooses investigations, reads their results and decides what to examine next.
4. Python calculates the metrics and chart data from a validated dashboard specification.
5. The agent evaluates the results and prepares an analysis brief.
6. Explore the dashboard or ask the AI assistant to continue the investigation.

The agent asks for clarification when an essential definition is missing. Model failures retain the dataset and analysis checkpoint so the work can be retried.

## Data review

Exact duplicates match across every column. Different timestamps remain distinct records.

Proposed cleaning is staged for review. **Apply changes** updates the working dataset and dashboard. Duplicate removal retains one copy of each identical row. Missing numeric values can be filled with a mean or median, or affected rows can be removed when supported.

Potential outliers are flagged using the IQR method. A flag does not establish that a record is invalid. Original data remains available for download.

## Export formats

| Format | Contents |
| --- | --- |
| HTML | Interactive dashboard with filters, tooltips and zoom that works offline. |
| PDF | One landscape page matching the current dashboard canvas and filters. |
| CSV | The working dataset with applied cleaning. Data details also offers an export of the selected data. |
| JSON | Analysis results, dashboard configuration and investigation evidence. |

The HTML export includes aggregates for supported filter selections. AI chat and new calculations require the online application.

## Example requests

> Add a monthly Quantity chart. Keep the existing charts.

> Change the country comparison to a horizontal bar chart.

> Show exact duplicate rows in Data review. Keep the complete InvoiceDate timestamp and do not delete anything yet.

> Explain the main findings for the current filters in Indonesian.

## Available models

Gemini, DeepSeek, GPT, GLM, Kimi, Claude, Gemma, Grok, HY, OSS, MiniMax, Muse and Qwen.

Choose a model in Settings. The current selection depends on model availability.

## Technology

| Area | Technology |
| --- | --- |
| Application | Next.js, React, TypeScript |
| Interface | Tailwind CSS, Radix UI |
| Charts | Recharts |
| Files | SheetJS, Web Workers |
| Calculations | Python, Pandas, NumPy |
| Isolated execution | E2B Code Interpreter |
| PDF export | jsPDF |

## Analytical scope

Metrics depend on the available columns and analysis definitions. Correlations describe associations and do not establish causation. Statistical methods selected by AI still require judgment about their suitability.

Scatter and box plots may sample up to 1,000 rows per filter partition, with a notice in the chart. KPI calculations use all selected rows. Box plots show quartiles and minimum and maximum whiskers.

Custom Python investigations can support explanations and additional statistics. Dashboard charts use the supported specification and existing dataset columns.

Session recovery stores working data in the browser. A new tab starts a new session, and closing the tab stops active analysis.
