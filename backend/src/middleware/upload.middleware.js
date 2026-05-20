import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import cloudinary from '../config/cloudinary.js';
import ApiError from '../utils/apiError.js';
import logger from '../config/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer to store files in memory buffers
const storage = multer.memoryStorage();

// File check helper for avatars (max 2MB, png/jpeg/webp)
const avatarFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedMimeTypes.includes(file.mimetype)) {
    return cb(new ApiError(400, 'Only JPEG, PNG and WebP images are allowed for avatars.', 'INVALID_AVATAR_FORMAT'), false);
  }
  cb(null, true);
};

// File check helper for resumes (max 5MB, pdf only)
const resumeFilter = (req, file, cb) => {
  if (file.mimetype !== 'application/pdf') {
    return cb(new ApiError(400, 'Only PDF files are accepted for resumes.', 'INVALID_RESUME_FORMAT'), false);
  }
  cb(null, true);
};

export const uploadAvatar = multer({
  storage,
  fileFilter: avatarFilter,
  limits: { fileSize: 2 * 1024 * 1024 } // 2 MB
});

export const uploadResume = multer({
  storage,
  fileFilter: resumeFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5 MB
});

/**
 * Upload a file buffer to Cloudinary, or store it locally in public/uploads if Cloudinary is not configured.
 */
export const uploadFileToProvider = async (fileBuffer, folder, originalName, mimeType) => {
  const isCloudinaryConfigured = 
    process.env.CLOUDINARY_CLOUD_NAME && 
    process.env.CLOUDINARY_API_KEY && 
    process.env.CLOUDINARY_API_SECRET;

  if (isCloudinaryConfigured) {
    logger.info(`Streaming buffer to Cloudinary folder: ${folder}`);
    return new Promise((resolve, reject) => {
      const uploadOptions = {
        folder: `job-board/${folder}`,
        resource_type: 'auto',
      };
      
      const stream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
        if (error) {
          logger.error(`Cloudinary upload stream failed: ${error.message}`);
          reject(error);
        } else {
          resolve({
            url: result.secure_url,
            publicId: result.public_id
          });
        }
      });
      stream.end(fileBuffer);
    });
  } else {
    // Local File System Fallback
    logger.info('Cloudinary not configured. Storing file in local container storage.');
    
    // Create path: backend/public/uploads/{folder}
    const uploadDir = path.join(__dirname, '..', '..', 'public', 'uploads', folder);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const fileExt = path.extname(originalName) || (mimeType === 'application/pdf' ? '.pdf' : '.png');
    const uniqueFileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${fileExt}`;
    const filePath = path.join(uploadDir, uniqueFileName);

    await fs.promises.writeFile(filePath, fileBuffer);
    
    // Return a relative path that we serve via express.static
    const serverUrl = process.env.NODE_ENV === 'production' 
      ? `/uploads/${folder}/${uniqueFileName}`
      : `http://localhost:5000/uploads/${folder}/${uniqueFileName}`;

    logger.info(`Saved upload locally to: ${filePath}`);
    return {
      url: serverUrl,
      publicId: uniqueFileName
    };
  }
};

/**
 * Delete a file by public ID on Cloudinary, or delete from the filesystem if stored locally.
 */
export const deleteFileFromProvider = async (publicId, folder) => {
  const isCloudinaryConfigured = 
    process.env.CLOUDINARY_CLOUD_NAME && 
    process.env.CLOUDINARY_API_KEY && 
    process.env.CLOUDINARY_API_SECRET;

  if (isCloudinaryConfigured) {
    logger.info(`Deleting asset from Cloudinary: ${publicId}`);
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (err) {
      logger.error(`Failed to delete Cloudinary asset ${publicId}: ${err.message}`);
    }
  } else {
    // Local File System Fallback deletion
    logger.info(`Deleting asset from local storage: ${publicId}`);
    const filePath = path.join(__dirname, '..', '..', 'public', 'uploads', folder, publicId);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        logger.error(`Failed to delete local file ${filePath}: ${err.message}`);
      }
    }
  }
};
