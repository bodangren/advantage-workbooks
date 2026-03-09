import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { uploadImage, deleteImage, listImages } from '@/lib/image-handler';

describe('Image Upload Functionality', () => {
  let testProjectId: string;
  let testWorkbooksRoot: string;
  let testProjectPath: string;
  let testImagesPath: string;

  beforeEach(async () => {
    // Create unique test directory for each test to ensure isolation
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    testProjectId = `test-project-${timestamp}-${random}`;
    testWorkbooksRoot = path.join(os.tmpdir(), `test-workbooks-img-${timestamp}-${random}`);
    testProjectPath = path.join(testWorkbooksRoot, 'secondary', testProjectId);
    testImagesPath = path.join(testProjectPath, 'images');

    // Set up test environment
    process.env.WORKBOOKS_ROOT = testWorkbooksRoot;

    // Create test project directory structure under secondary/
    await fs.mkdir(testImagesPath, { recursive: true });
  });

  afterEach(async () => {
    // Clean up test directories
    try {
      await fs.rm(testWorkbooksRoot, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('uploadImage', () => {
    it('should upload an image to the project images folder', async () => {
      const imageBuffer = Buffer.from('fake-image-data');
      const originalFilename = 'test-image.jpg';

      const result = await uploadImage(testProjectId, imageBuffer, originalFilename);

      expect(result).toHaveProperty('filename');
      expect(result).toHaveProperty('path');
      expect(result).toHaveProperty('url');
      expect(result.filename).toMatch(/^test-image-\d+\.jpg$/);

      // Verify file was created
      const uploadedFilePath = path.join(testImagesPath, result.filename);
      const fileExists = await fs.access(uploadedFilePath)
        .then(() => true)
        .catch(() => false);
      expect(fileExists).toBe(true);
    });

    it('should generate unique filenames to avoid collisions', async () => {
      const imageBuffer = Buffer.from('fake-image-data');
      const originalFilename = 'duplicate.png';

      const result1 = await uploadImage(testProjectId, imageBuffer, originalFilename);
      // Add small delay to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 2));
      const result2 = await uploadImage(testProjectId, imageBuffer, originalFilename);

      expect(result1.filename).not.toBe(result2.filename);

      // Both files should exist
      const file1Exists = await fs.access(path.join(testImagesPath, result1.filename))
        .then(() => true)
        .catch(() => false);
      const file2Exists = await fs.access(path.join(testImagesPath, result2.filename))
        .then(() => true)
        .catch(() => false);

      expect(file1Exists).toBe(true);
      expect(file2Exists).toBe(true);
    });

    it('should validate file extensions (jpg, jpeg, png, gif, webp)', async () => {
      const validExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

      for (const ext of validExtensions) {
        const imageBuffer = Buffer.from('fake-image-data');
        const filename = `test.${ext}`;

        const result = await uploadImage(testProjectId, imageBuffer, filename);
        expect(result.filename).toMatch(new RegExp(`\\.${ext}$`));
      }
    });

    it('should reject invalid file extensions', async () => {
      const imageBuffer = Buffer.from('fake-image-data');
      const invalidFilename = 'test.exe';

      await expect(
        uploadImage(testProjectId, imageBuffer, invalidFilename)
      ).rejects.toThrow(/Invalid file type/);
    });

    it('should reject files exceeding size limit (5MB)', async () => {
      const largeBuffer = Buffer.alloc(6 * 1024 * 1024); // 6MB
      const filename = 'large-image.jpg';

      await expect(
        uploadImage(testProjectId, largeBuffer, filename)
      ).rejects.toThrow(/File size exceeds/);
    });

    it('should return relative URL path for the uploaded image', async () => {
      const imageBuffer = Buffer.from('fake-image-data');
      const originalFilename = 'test-url.jpg';

      const result = await uploadImage(testProjectId, imageBuffer, originalFilename);

      expect(result.url).toMatch(/^images\/test-url-\d+\.jpg$/);
    });
  });

  describe('deleteImage', () => {
    it('should delete an image from the project images folder', async () => {
      // First upload an image
      const imageBuffer = Buffer.from('fake-image-data');
      const uploadResult = await uploadImage(testProjectId, imageBuffer, 'to-delete.jpg');

      // Verify it exists
      const uploadedPath = path.join(testImagesPath, uploadResult.filename);
      let fileExists = await fs.access(uploadedPath)
        .then(() => true)
        .catch(() => false);
      expect(fileExists).toBe(true);

      // Delete the image
      await deleteImage(testProjectId, uploadResult.filename);

      // Verify it's gone
      fileExists = await fs.access(uploadedPath)
        .then(() => true)
        .catch(() => false);
      expect(fileExists).toBe(false);
    });

    it('should throw error if image does not exist', async () => {
      await expect(
        deleteImage(testProjectId, 'non-existent.jpg')
      ).rejects.toThrow(/Image.*not found/);
    });

    it('should prevent directory traversal attacks', async () => {
      await expect(
        deleteImage(testProjectId, '../../../etc/passwd')
      ).rejects.toThrow(/Invalid filename/);
    });
  });

  describe('listImages', () => {
    it('should return an empty array when no images exist', async () => {
      const images = await listImages(testProjectId);
      expect(images).toEqual([]);
    });

    it('should list all images in the project images folder', async () => {
      // Upload multiple images
      const imageBuffer = Buffer.from('fake-image-data');
      await uploadImage(testProjectId, imageBuffer, 'image1.jpg');
      await uploadImage(testProjectId, imageBuffer, 'image2.png');
      await uploadImage(testProjectId, imageBuffer, 'image3.gif');

      const images = await listImages(testProjectId);

      expect(images).toHaveLength(3);
      expect(images.every(img => img.filename && img.url && img.size)).toBe(true);
    });

    it('should only list valid image files', async () => {
      // Create images directory with mixed files
      await fs.writeFile(path.join(testImagesPath, 'valid.jpg'), 'data');
      await fs.writeFile(path.join(testImagesPath, 'valid.png'), 'data');
      await fs.writeFile(path.join(testImagesPath, 'invalid.txt'), 'data');
      await fs.writeFile(path.join(testImagesPath, '.hidden'), 'data');

      const images = await listImages(testProjectId);

      expect(images).toHaveLength(2);
      expect(images.every(img => /\.(jpg|png|gif|jpeg|webp)$/i.test(img.filename))).toBe(true);
    });
  });
});
