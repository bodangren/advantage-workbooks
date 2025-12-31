#!/bin/bash

# Build script for Reading Advantage Observation Forms
# Converts markdown forms to PDF

echo "Building Reading Advantage Observation Forms..."

# Define the Teacher guide directory
GUIDE_DIR="/home/daniel-bo/Downloads/Workbooks/Teacher guide"

# Change to the guide directory
cd "$GUIDE_DIR"

# Generate Quarterly Observation Form PDF
echo "Generating Quarterly Observation Form PDF..."
if command -v pandoc &> /dev/null; then
    pandoc observation-form-quarterly.md \
        -o observation-form-quarterly.pdf \
        --pdf-engine=wkhtmltopdf \
        -V geometry:margin=1in \
        -V papersize=letter
    echo "✓ Quarterly form PDF created: observation-form-quarterly.pdf"
else
    echo "✗ pandoc not found. Install with: sudo apt install pandoc"
fi

# Generate Walkthrough Form PDF
echo "Generating Walkthrough Form PDF..."
if command -v pandoc &> /dev/null; then
    pandoc observation-form-walkthrough.md \
        -o observation-form-walkthrough.pdf \
        --pdf-engine=wkhtmltopdf \
        -V geometry:margin=1in \
        -V papersize=letter
    echo "✓ Walkthrough form PDF created: observation-form-walkthrough.pdf"
else
    echo "✗ pandoc not found. Skipping PDF generation."
fi

# Generate Thai Quarterly Observation Form PDF
echo "Generating Thai Quarterly Observation Form PDF..."
if command -v pandoc &> /dev/null; then
    pandoc observation-form-quarterly-th.md \
        -o observation-form-quarterly-th.pdf \
        --pdf-engine=wkhtmltopdf \
        -V geometry:margin=1in \
        -V papersize=letter
    echo "✓ Thai Quarterly form PDF created: observation-form-quarterly-th.pdf"
else
    echo "✗ pandoc not found. Skipping PDF generation."
fi

# Generate Thai Walkthrough Form PDF
echo "Generating Thai Walkthrough Form PDF..."
if command -v pandoc &> /dev/null; then
    pandoc observation-form-walkthrough-th.md \
        -o observation-form-walkthrough-th.pdf \
        --pdf-engine=wkhtmltopdf \
        -V geometry:margin=1in \
        -V papersize=letter
    echo "✓ Thai Walkthrough form PDF created: observation-form-walkthrough-th.pdf"
else
    echo "✗ pandoc not found. Skipping PDF generation."
fi

echo ""
echo "Build complete!"
echo ""
echo "English Output files:"
echo "  - observation-form-quarterly.md / .pdf"
echo "  - observation-form-walkthrough.md / .pdf"
echo ""
echo "Thai Output files:"
echo "  - observation-form-quarterly-th.md / .pdf"
echo "  - observation-form-walkthrough-th.md / .pdf"
