# Workbook Production Dashboard

A professional Next.js-based dashboard for creating and managing CEFR-aligned English learning workbooks. This application provides a user-friendly interface for non-technical users to create, edit, and compile workbook content.

## Features

### 📝 Content Management
- **Form-Based Editor:** Edit lesson content through intuitive forms (no JSON editing required)
- **Schema Validation:** Real-time validation using Zod ensures data integrity
- **Project Organization:** Manage multiple workbook projects from a centralized dashboard

### 🖼️ Asset Management
- **Direct Image Upload:** Upload images directly to project folders (max 5MB)
- **Supported Formats:** JPG, JPEG, PNG, GIF, WebP
- **Automatic Path Management:** Image URLs are automatically updated in lesson data
- **Image Preview:** See uploaded images before saving

### 👁️ Live Preview & Compilation
- **Live Preview:** Real-time preview of lessons using Paged.js
- **Batch Compilation:** Compile all lessons in a project into a single document
- **Print-Ready Output:** Generate PDF-ready layouts with proper pagination

### 📱 Modern Interface
- **Mobile Responsive:** Works on desktop, tablet, and mobile devices
- **Tailwind CSS:** Clean, professional design
- **shadcn/ui Components:** Consistent UI component library

## Getting Started

### Prerequisites
- Node.js 18+ installed
- npm, yarn, pnpm, or bun package manager

### Installation

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Run the Development Server:**
   ```bash
   npm run dev
   ```

3. **Open Your Browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Environment Variables

The dashboard uses the following environment variable (optional):

```bash
WORKBOOKS_ROOT=/path/to/your/workbooks
```

If not set, it defaults to the parent directory of the dashboard.

## Usage Guide

### Creating a New Project

1. Click "New Project" on the home page
2. Enter a project name (e.g., "Origins Level 1")
3. The system creates a new directory with your project

### Adding a Lesson

1. Navigate to your project
2. Click "Add Lesson"
3. Fill in the lesson details:
   - Basic info (lesson number, title, CEFR level)
   - Article content and paragraphs
   - Vocabulary items
   - Comprehension questions
   - Writing prompts

### Uploading Images

1. Open a lesson for editing
2. In the "Article Image" section, click "Upload"
3. Select an image file (< 5MB)
4. The image is automatically saved to the project's `images/` folder
5. The relative path is automatically added to your lesson data

### Previewing Lessons

1. While editing a lesson, click "Show Preview"
2. The live preview renders your content using Paged.js
3. See exactly how the lesson will appear in print

### Compiling a Workbook

1. Navigate to your project page
2. Click "Compile All Lessons"
3. View the compiled workbook with all lessons
4. Use your browser's print function (Ctrl+P or Cmd+P) to save as PDF
5. Ensure "Background graphics" is enabled in print settings

## Project Structure

```
dashboard/
├── app/                      # Next.js app directory
│   ├── api/                 # API routes
│   │   ├── projects/       # Project management APIs
│   │   └── render/         # Template rendering API
│   ├── projects/           # Project pages
│   └── layout.tsx          # Root layout
├── components/              # React components
│   ├── ui/                 # shadcn/ui components
│   ├── image-upload.tsx    # Image upload component
│   └── lesson-preview.tsx  # Lesson preview component
├── lib/                     # Utility libraries
│   ├── filesystem.ts       # File system operations
│   ├── image-handler.ts    # Image upload/management
│   ├── template-renderer.ts # Handlebars rendering
│   └── workbook-schema.ts  # Zod validation schemas
└── __tests__/              # Test suites
    ├── filesystem-integration.test.ts
    ├── image-upload.test.ts
    ├── e2e-integration.test.ts
    └── responsive-design.test.ts
```

## Testing

Run the test suite:

```bash
npm test
```

Run tests with coverage:

```bash
npm test -- --coverage
```

Current test coverage: **91.42%**

## Technology Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui (Radix UI)
- **Validation:** Zod
- **Templating:** Handlebars
- **PDF Layout:** Paged.js
- **Testing:** Vitest

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm test` - Run test suite
- `npm run lint` - Run ESLint

### Code Quality

- **Type Safety:** Full TypeScript coverage
- **Testing:** Comprehensive test suite (55 tests)
- **Code Coverage:** >90% coverage
- **Linting:** ESLint configured

## API Routes

### Projects
- `GET /api/projects` - List all projects
- `POST /api/projects` - Create new project
- `GET /api/projects/[projectId]/lessons` - List lessons in project
- `GET /api/projects/[projectId]/lessons/[lessonId]` - Get lesson data
- `PUT /api/projects/[projectId]/lessons/[lessonId]` - Update lesson data
- `GET /api/projects/[projectId]/compile` - Compile all lessons

### Images
- `POST /api/projects/[projectId]/images` - Upload image
- `GET /api/projects/[projectId]/images` - List images
- `DELETE /api/projects/[projectId]/images/[filename]` - Delete image

### Rendering
- `POST /api/render` - Render lesson with Handlebars template

## Contributing

This project follows the Conductor development workflow. See `/conductor/workflow.md` for details on:
- Test-Driven Development (TDD)
- Commit guidelines
- Quality gates
- Code review process

## License

This project is part of the Reading Advantage workbook production system.

## Support

For issues or questions, please refer to the project documentation in `/conductor/`.
