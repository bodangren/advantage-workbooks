# Specification: Goal Setting Worksheet Generator

## Overview
Generate a "My English Learning Goals" worksheet section at the beginning of the workbook (after the TOC, before the lessons) to encourage students to set learning goals before starting the course.

## Requirements
1. The dashboard compile API should accept an `includeGoalSetting` boolean.
2. The UI compile page should have a checkbox for "Goal Setting Worksheet".
3. The wrapper (`workbook-document-wrapper.ts`) should inject the goal setting HTML.
4. The goal setting worksheet includes:
   - Student Name, Class, Date.
   - "Target English Level".
   - "Why I want to improve my English".
   - "My Action Plan" (lines to write on).
5. Must use the series theme colors.
6. The HTML must have correct Paged.js breaking (`break-after: page` or `break-before: right`).