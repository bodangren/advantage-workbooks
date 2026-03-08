import fs from 'fs/promises';
import path from 'path';
import os from 'os';

export async function teardown() {
  const tmpDir = os.tmpdir();

  try {
    const entries = await fs.readdir(tmpDir, { withFileTypes: true });
    const testDirs = entries.filter(
      (entry) =>
        entry.isDirectory() &&
        (entry.name.startsWith('test-e2e-') ||
          entry.name.startsWith('test-project-') ||
          entry.name.startsWith('test-workbooks-'))
    );

    for (const dir of testDirs) {
      try {
        await fs.rm(path.join(tmpDir, dir.name), { recursive: true, force: true });
      } catch {
        // Ignore cleanup errors for individual directories
      }
    }
  } catch {
    // Ignore errors reading tmpdir
  }
}
