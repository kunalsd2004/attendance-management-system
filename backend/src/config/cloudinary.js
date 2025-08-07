const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Storage configuration for different file types
const createStorage = (folder, allowedFormats = ['jpg', 'jpeg', 'png', 'pdf']) => {
  return new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: `lms/${folder}`,
      allowed_formats: allowedFormats,
      resource_type: 'auto',
      transformation: [
        { width: 1000, height: 1000, crop: 'limit' }
      ]
    },
  });
};

// Multer configurations for different upload types
const profileImageUpload = multer({
  storage: createStorage('profiles', ['jpg', 'jpeg', 'png']),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

const documentUpload = multer({
  storage: createStorage('documents', ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png']),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// Helper functions
const deleteFile = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    throw new Error(`Failed to delete file: ${error.message}`);
  }
};

const getOptimizedUrl = (publicId, options = {}) => {
  return cloudinary.url(publicId, {
    width: options.width || 'auto',
    height: options.height || 'auto',
    crop: options.crop || 'scale',
    quality: options.quality || 'auto:good',
    format: options.format || 'auto',
    ...options
  });
};

module.exports = {
  cloudinary,
  profileImageUpload,
  documentUpload,
  deleteFile,
  getOptimizedUrl
}; 