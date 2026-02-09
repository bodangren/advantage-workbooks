/**
 * Migration script: Move existing projects into secondary/ subdirectory
 * with structured naming convention.
 *
 * Usage: npx tsx scripts/migrate-to-multi-series.ts [--dry-run]
 */

import fs from 'fs/promises';
import path from 'path';

const WORKBOOKS_ROOT = process.env.WORKBOOKS_ROOT || path.resolve(process.cwd(), '..');
const DRY_RUN = process.argv.includes('--dry-run');

interface MigrationEntry {
  source: string;
  dest: string;
  projectId: string;
}

// Known project mappings: source directory name → metadata for generating new name
const PROJECT_MAPPINGS: Record<string, { seriesName: string; levelNumber: string; cefrLevel: string }> = {
  'Origins 3.1': { seriesName: 'Origins', levelNumber: '3.1', cefrLevel: 'A1' },
};

function generateProjectId(metadata: { seriesName: string; levelNumber: string; cefrLevel: string }): string {
  const series = metadata.seriesName.toLowerCase().replace(/\s+/g, '-');
  const level = metadata.levelNumber.toLowerCase();
  const cefr = metadata.cefrLevel.toLowerCase();
  return `${series}-${level}-${cefr}`;
}

async function migrate() {
  console.log(`Migration: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`);
  console.log(`Workbooks root: ${WORKBOOKS_ROOT}\n`);

  // Ensure target directories exist
  const secondaryDir = path.join(WORKBOOKS_ROOT, 'secondary');
  const primaryDir = path.join(WORKBOOKS_ROOT, 'primary');

  if (!DRY_RUN) {
    await fs.mkdir(secondaryDir, { recursive: true });
    await fs.mkdir(primaryDir, { recursive: true });
  }
  console.log(`Created: secondary/ and primary/ directories\n`);

  // Build migration plan
  const migrations: MigrationEntry[] = [];

  for (const [sourceName, metadata] of Object.entries(PROJECT_MAPPINGS)) {
    const sourcePath = path.join(WORKBOOKS_ROOT, sourceName);
    const projectId = generateProjectId(metadata);
    const destPath = path.join(secondaryDir, projectId);

    try {
      await fs.stat(sourcePath);
      migrations.push({ source: sourcePath, dest: destPath, projectId });
    } catch {
      console.log(`SKIP: ${sourceName} (not found)`);
    }
  }

  // Execute migrations
  for (const { source, dest, projectId } of migrations) {
    console.log(`MOVE: ${path.basename(source)} → secondary/${projectId}/`);

    if (!DRY_RUN) {
      // Move the directory
      await fs.rename(source, dest);

      // Update project.json with type field
      const metadataPath = path.join(dest, 'project.json');
      try {
        const content = await fs.readFile(metadataPath, 'utf-8');
        const metadata = JSON.parse(content);
        metadata.type = 'secondary';
        await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf-8');
        console.log(`  Updated project.json with type: "secondary"`);
      } catch (err) {
        console.error(`  WARNING: Could not update project.json: ${err}`);
      }
    }
  }

  // Verify migration
  if (!DRY_RUN && migrations.length > 0) {
    console.log('\nVerification:');
    for (const { dest, projectId } of migrations) {
      try {
        const entries = await fs.readdir(dest);
        const jsonFiles = entries.filter(f => f.endsWith('.json'));
        console.log(`  ${projectId}: ${entries.length} files (${jsonFiles.length} JSON)`);
      } catch (err) {
        console.error(`  ${projectId}: FAILED - ${err}`);
      }
    }
  }

  console.log(`\nMigration ${DRY_RUN ? 'plan' : 'complete'}: ${migrations.length} project(s) processed`);
}

migrate().catch(console.error);
