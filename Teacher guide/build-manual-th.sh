#!/bin/bash

# Build script for Reading Advantage Teacher's Manual (Thai Version)
# Combines all Thai markdown files and generates PDF with proper formatting

echo "Building Reading Advantage Teacher's Manual (Thai Version)..."
echo "กำลังสร้างคู่มือครูสำหรับ Reading Advantage (ฉบับภาษาไทย)..."

# Define the Teacher guide directory
GUIDE_DIR="/home/daniel-bo/Downloads/Workbooks/Teacher guide"

# Change to the guide directory
cd "$GUIDE_DIR"

# Step 1: Concatenate all Thai markdown files in the correct order
echo "Combining Thai markdown files..."
echo "กำลังรวมไฟล์ markdown ภาษาไทย..."
cat title-page-th.md \
    preface-th.md \
    quick-reference-th.md \
    complete-plan-th.md \
    step-1-th.md \
    step-2-th.md \
    step-3-th.md \
    step-4-th.md \
    step-5-th.md \
    step-6-th.md \
    step-7-th.md \
    step-8-th.md \
    step-9-10-th.md \
    step-11-12-th.md \
    step-13-th.md \
    step-14-th.md \
    trainers-guide-th.md \
    > teachers-manual-compiled-th.md

echo "Combined Thai markdown file created: teachers-manual-compiled-th.md"
echo "สร้างไฟล์ markdown รวมเรียบร้อย: teachers-manual-compiled-th.md"

# Step 2: Generate HTML with Pandoc (no TOC)
echo "Generating HTML..."
echo "กำลังสร้างไฟล์ HTML..."
pandoc teachers-manual-compiled-th.md \
    -o teachers-manual-th-content.html \
    --standalone \
    --css=print-style.css \
    --metadata title="คู่มือครูสำหรับ Reading Advantage" \
    --self-contained

echo "HTML generated: teachers-manual-th-content.html"
echo "สร้างไฟล์ HTML เรียบร้อย: teachers-manual-th-content.html"

# Step 3: Generate content PDF (if wkhtmltopdf is available)
if command -v wkhtmltopdf &> /dev/null; then
    echo "Generating content PDF with margins..."
    echo "กำลังสร้างไฟล์ PDF เนื้อหา..."
    wkhtmltopdf \
        --enable-local-file-access \
        --print-media-type \
        --encoding UTF-8 \
        --margin-top 30mm \
        --margin-bottom 30mm \
        --margin-left 30mm \
        --margin-right 30mm \
        --footer-center "หน้า [page] จาก [toPage]" \
        --footer-font-size 9 \
        --footer-spacing 5 \
        teachers-manual-th-content.html \
        teachers-manual-th-content.pdf

    # Step 4: Merge PDFs (using pre-made cover.pdf)
    if command -v pdfunite &> /dev/null; then
        echo "Merging cover and content PDFs..."
        echo "กำลังรวมไฟล์ PDF ปกและเนื้อหา..."
        pdfunite cover.pdf teachers-manual-th-content.pdf teachers-manual-th.pdf
        echo "PDF generated: teachers-manual-th.pdf"
        echo "สร้างไฟล์ PDF เรียบร้อย: teachers-manual-th.pdf"
    else
        echo "pdfunite not found. Install with: sudo apt install poppler-utils"
        echo "ไม่พบ pdfunite กรุณาติดตั้งโดยใช้คำสั่ง: sudo apt install poppler-utils"
        echo "Copying content PDF as final output..."
        cp teachers-manual-th-content.pdf teachers-manual-th.pdf
    fi
else
    echo "wkhtmltopdf not found. Skipping PDF generation."
    echo "ไม่พบ wkhtmltopdf กรุณาติดตั้งโดยใช้คำสั่ง: sudo apt install wkhtmltopdf"
fi

echo ""
echo "Build complete! / สร้างเอกสารเรียบร้อย!"
echo ""
echo "Output files / ไฟล์ผลลัพธ์:"
echo "  - teachers-manual-compiled-th.md (combined Thai markdown)"
echo "  - teachers-manual-th.html (HTML with TOC / HTML พร้อมสารบัญ)"
if command -v wkhtmltopdf &> /dev/null; then
    echo "  - teachers-manual-th.pdf (PDF)"
fi
