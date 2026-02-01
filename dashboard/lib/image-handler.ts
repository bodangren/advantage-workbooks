import fs from 'fs/promises';
import path from 'path';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

/**
 * Gets the workbooks root directory
 */
function getWorkbooksRoot(): string {
  return process.env.WORKBOOKS_ROOT || path.resolve(process.cwd(), '..');
}

export interface UploadedImage {
  filename: string;
  path: string;
  url: string;
}

export interface ImageInfo {
  filename: string;
  url: string;
  size: number;
}

/**
 * Validates filename to prevent directory traversal attacks
 */
function validateFilename(filename: string): void {
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    throw new Error('Invalid filename: path traversal detected');
  }
}

/**
 * Validates file extension
 */
function validateExtension(filename: string): void {
  const ext = path.extname(filename).toLowerCase().slice(1);
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    throw new Error(`Invalid file type. Allowed types: ${ALLOWED_EXTENSIONS.join(', ')}`);
  }
}

/**
 * Generates a unique filename by appending timestamp
 */
function generateUniqueFilename(originalFilename: string): string {
  const ext = path.extname(originalFilename);
  const basename = path.basename(originalFilename, ext);
  const timestamp = Date.now();
  return `${basename}-${timestamp}${ext}`;
}

/**
 * Uploads an image to the project's images folder
 */
export async function uploadImage(
  projectId: string,
  imageBuffer: Buffer,
  originalFilename: string
): Promise<UploadedImage> {
  // Validate file size
  if (imageBuffer.length > MAX_FILE_SIZE) {
    throw new Error(`File size exceeds maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024}MB`);
  }

  // Validate filename and extension
  validateFilename(originalFilename);
  validateExtension(originalFilename);

  // Create images directory if it doesn't exist
  const workbooksRoot = getWorkbooksRoot();
  const projectPath = path.join(workbooksRoot, projectId);
  const imagesPath = path.join(projectPath, 'images');
  await fs.mkdir(imagesPath, { recursive: true });

  // Generate unique filename
  const uniqueFilename = generateUniqueFilename(originalFilename);
  const filePath = path.join(imagesPath, uniqueFilename);

  // Write the file
  await fs.writeFile(filePath, imageBuffer);

  return {
    filename: uniqueFilename,
    path: filePath,
    url: `images/${uniqueFilename}`,
  };
}

/**
 * Deletes an image from the project's images folder
 */
export async function deleteImage(projectId: string, filename: string): Promise<void> {
  // Validate filename to prevent directory traversal
  validateFilename(filename);

  const workbooksRoot = getWorkbooksRoot();
  const projectPath = path.join(workbooksRoot, projectId);
  const filePath = path.join(projectPath, 'images', filename);

  try {
    await fs.unlink(filePath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new Error(`Image '${filename}' not found in project '${projectId}'`);
    }
    throw error;
  }
}

/**
 * Lists all images in the project's images folder
 */
export async function listImages(projectId: string): Promise<ImageInfo[]> {
  const workbooksRoot = getWorkbooksRoot();
  const projectPath = path.join(workbooksRoot, projectId);
  const imagesPath = path.join(projectPath, 'images');

  try {
    const files = await fs.readdir(imagesPath);

    const imageFiles = files.filter((file) => {
      const ext = path.extname(file).toLowerCase().slice(1);
      return ALLOWED_EXTENSIONS.includes(ext) && !file.startsWith('.');
    });

    const imageInfos = await Promise.all(
      imageFiles.map(async (filename) => {
        const filePath = path.join(imagesPath, filename);
        const stats = await fs.stat(filePath);
        return {
          filename,
          url: `images/${filename}`,
          size: stats.size,
        };
      })
    );

    return imageInfos;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}
