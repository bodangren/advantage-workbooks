#!/bin/bash

# Build script for Reading Advantage Teacher's Manual
# Combines all markdown files and generates PDF with proper formatting

echo "Building Reading Advantage Teacher's Manual..."

# Define the Teacher guide directory
GUIDE_DIR="/home/daniel-bo/Downloads/Workbooks/Teacher guide"

# Change to the guide directory
cd "$GUIDE_DIR"

# Step 1: Concatenate all markdown files in the correct order
echo "Combining markdown files..."
cat title-page.md \
    preface.md \
    quick-reference.md \
    complete-plan.md \
    step-1.md \
    step-2.md \
    step-3.md \
    step-4.md \
    step-5.md \
    step-6.md \
    step-7.md \
    step-8.md \
    step-9-10.md \
    step-11-12.md \
    step-13.md \
    step-14.md \
    trainers-guide.md \
    > teachers-manual-compiled.md

echo "Combined markdown file created: teachers-manual-compiled.md"

# Step 2: Generate HTML with Pandoc (no TOC)
echo "Generating HTML..."
pandoc teachers-manual-compiled.md \
    -o teachers-manual-content.html \
    --standalone \
    --css=print-style.css \
    --metadata title="Reading Advantage Teacher's Manual" \
    --self-contained

echo "HTML generated: teachers-manual-content.html"

# Step 3: Generate content PDF (if wkhtmltopdf is available)
if command -v wkhtmltopdf &> /dev/null; then
    echo "Generating content PDF with margins..."
    wkhtmltopdf \
        --enable-local-file-access \
        --print-media-type \
        --margin-top 30mm \
        --margin-bottom 30mm \
        --margin-left 30mm \
        --margin-right 30mm \
        --footer-center "Page [page] of [toPage]" \
        --footer-font-size 9 \
        --footer-spacing 5 \
        teachers-manual-content.html \
        teachers-manual-content.pdf

    # Step 4: Merge PDFs (using pre-made cover.pdf)
    if command -v pdfunite &> /dev/null; then
        echo "Merging cover and content PDFs..."
        pdfunite cover.pdf teachers-manual-content.pdf teachers-manual.pdf
        echo "PDF generated: teachers-manual.pdf"
    else
        echo "pdfunite not found. Install with: sudo apt install poppler-utils"
        echo "Copying content PDF as final output..."
        cp teachers-manual-content.pdf teachers-manual.pdf
    fi
else
    echo "wkhtmltopdf not found. Skipping PDF generation."
    echo "Install with: sudo apt install wkhtmltopdf"
fi

echo "Build complete!"
echo ""
echo "Output files:"
echo "  - teachers-manual-compiled.md (combined markdown)"
echo "  - teachers-manual.html (HTML with TOC)"
if command -v wkhtmltopdf &> /dev/null; then
    echo "  - teachers-manual.pdf (PDF)"
fi
