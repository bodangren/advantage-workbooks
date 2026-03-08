# Automated Answer Key Generation Specification

## Overview
As requested by the workbook generation product plan, an "Answer Key" is an essential piece of End Matter for each printed workbook. To save content creators time, we will automatically extract the answer keys encoded in the lesson JSON files and generate an Answer Key chapter.

## Requirements
1. **Extraction**: From each lesson in a compiled project, extract:
   - Multiple Choice Answers (`mc_answers` array)
   - Short Answer Hint/Key (`short_answer_hint`)
   - Vocab Match Answers (`vocab_match_answer_string`)
   - Vocab Fill Answers (`vocab_fill_answer_string`)
   - Sentence Order Answers (`sentence_order_answers`)
2. **Formatting**: Format the extracted data sequentially by lesson in a new `AnswerKeyEntry` structure.
3. **Rendering**: Append an "Answer Key" section to the printed document, following the Glossary section, matching the document's established design theme and layout.
4. **Validation**: Ensure that lessons without answer keys are handled gracefully and the Answer Key is only generated if answers exist.
