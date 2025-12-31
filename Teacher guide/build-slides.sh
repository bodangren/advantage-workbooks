#!/bin/bash

# Build script for Reading Advantage Training Slides (English)
# Generates PDF presentation from markdown

echo "Building Reading Advantage Training Slides (English)..."

# Define the Teacher guide directory
GUIDE_DIR="/home/daniel-bo/Downloads/Workbooks/Teacher guide"

# Change to the guide directory
cd "$GUIDE_DIR"

# Check if marp-cli is available
if command -v marp &> /dev/null; then
    echo "Using Marp CLI to generate PDF..."

    # Generate PDF using Marp
    marp training-slides.md \
        --pdf \
        --allow-local-files \
        --theme slides-theme.css \
        --output training-slides.pdf

    if [ $? -eq 0 ]; then
        echo "✓ PDF generated successfully: training-slides.pdf"
    else
        echo "✗ Marp PDF generation failed"
        exit 1
    fi

else
    echo "Marp CLI not found. Using pandoc + wkhtmltopdf fallback..."

    # Check if pandoc is available
    if ! command -v pandoc &> /dev/null; then
        echo "✗ Error: pandoc is not installed"
        echo "Install with: sudo apt install pandoc"
        exit 1
    fi

    # Generate HTML with Pandoc
    echo "Generating HTML..."
    pandoc training-slides.md \
        -o training-slides.html \
        --standalone \
        --css=slides-theme.css \
        --metadata title="Reading Advantage Training" \
        --self-contained \
        -V slidy-url=https://www.w3.org/Talks/Tools/Slidy2 \
        -t slidy

    if [ $? -ne 0 ]; then
        echo "✗ HTML generation failed"
        exit 1
    fi

    echo "✓ HTML generated: training-slides.html"

    # Generate PDF if wkhtmltopdf is available
    if command -v wkhtmltopdf &> /dev/null; then
        echo "Generating PDF..."
        wkhtmltopdf \
            --enable-local-file-access \
            --print-media-type \
            --margin-top 0 \
            --margin-bottom 0 \
            --margin-left 0 \
            --margin-right 0 \
            --page-size A4 \
            --orientation Landscape \
            training-slides.html \
            training-slides.pdf

        if [ $? -eq 0 ]; then
            echo "✓ PDF generated: training-slides.pdf"
        else
            echo "✗ PDF generation failed"
            exit 1
        fi
    else
        echo "✗ wkhtmltopdf not found. Only HTML generated."
        echo "Install with: sudo apt install wkhtmltopdf"
        echo "Or install Marp CLI with: npm install -g @marp-team/marp-cli"
    fi
fi

echo ""
echo "Build complete!"
echo ""
echo "Output files:"
if command -v marp &> /dev/null; then
    echo "  - training-slides.pdf (PDF presentation)"
else
    echo "  - training-slides.html (HTML presentation)"
    if command -v wkhtmltopdf &> /dev/null; then
        echo "  - training-slides.pdf (PDF presentation)"
    fi
fi
echo ""
echo "Recommendation: Install Marp CLI for best results:"
echo "  npm install -g @marp-team/marp-cli"
