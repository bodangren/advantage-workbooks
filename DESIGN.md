---
version: 1.0.0
name: Reading Advantage Workbook Dashboard Design System
colors:
  background: "#FFFFFF"
  foreground: "#252525"
  primary: "#343434"
  secondary: "#F7F7F7"
  destructive: "#B91C1C"
  muted: "#F7F7F7"
  border: "#EBEBEB"
  accent: "#F7F7F7"
typography:
  h1:
    fontFamily: "Geist"
    fontSize: 30px
    fontWeight: 700
    lineHeight: 1.2
  h2:
    fontFamily: "Geist"
    fontSize: 24px
    fontWeight: 600
    lineHeight: 1.3
  h3:
    fontFamily: "Geist"
    fontSize: 20px
    fontWeight: 600
    lineHeight: 1.4
  body-base:
    fontFamily: "Geist"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.5
  body-sm:
    fontFamily: "Geist"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.4
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
rounded:
  sm: 6px
  md: 8px
  lg: 10px
  xl: 14px
---

# Design System

## Overview
The Reading Advantage Workbook Dashboard uses a clean, professional design system focused on legibility and ease of use for content creators. The system is built on Tailwind CSS v4 and Geist fonts.

## Colors
The color palette uses a monochromatic foundation with high-contrast elements for clarity. Colors are defined using OKLCH in the implementation for better perceptual uniformity.

### Core Palette
- **Background:** `#FFFFFF` - Main application background.
- **Foreground:** `#252525` - Primary text color.
- **Primary:** `#343434` - Main brand and action color.
- **Secondary:** `#F7F7F7` - Surface color for secondary elements.

### Feedback & Utility
- **Destructive:** `#B91C1C` - Error states and dangerous actions.
- **Muted:** `#F7F7F7` - Background for less prominent information.
- **Border:** `#EBEBEB` - Standard UI borders and separators.

## Typography
We use the Geist font family for its excellent legibility on screens.

### Typefaces
- **Sans-serif:** Geist - Used for all interface text and content.
- **Monospace:** Geist Mono - Used for code snippets, metadata, and technical data.

### Hierarchy
- **H1:** 30px, Bold - Page titles.
- **H2:** 24px, Semi-bold - Section headings.
- **H3:** 20px, Semi-bold - Subsection headings.
- **Body Base:** 16px, Regular - Standard content text.
- **Body Small:** 14px, Regular - Labels, secondary text, and descriptions.

## Spacing
Our spacing system is based on a 4px grid.

- **XS (4px):** Tight grouping.
- **SM (8px):** Related elements.
- **MD (16px):** Standard component padding and element gap.
- **LG (24px):** Section spacing.
- **XL (32px):** Page section breaks.

## Roundness
Rounded corners are used to give the UI a modern and approachable feel.

- **Small (6px):** Small components like badges or checkbox indicators.
- **Medium (8px):** Standard buttons and inputs.
- **Large (10px):** Cards and dialog containers.
- **Extra Large (14px):** Large UI containers.

## Components

### Buttons
Buttons use the primary color for default actions and the destructive color for critical actions. They feature a subtle transition and a medium (8px) corner radius.

### Cards
Cards are used to group related content. They feature a border and a large (10px) corner radius.

### Inputs
Form inputs use the standard border color and have a large (10px) base radius, often adjusted to medium (8px) for consistency with buttons.

## Do's and Don'ts
- **Do** use high contrast for text legibility.
- **Do** stick to the defined spacing scale for layout consistency.
- **Don't** use arbitrary hex codes outside the defined palette.
- **Don't** mix multiple font families unnecessarily.
