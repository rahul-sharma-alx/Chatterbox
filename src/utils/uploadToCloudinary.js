// utils/uploadToCloudinary.js
const CLOUDINARY_UPLOAD_PRESET = 'chatterbox_preset';
const CLOUDINARY_CLOUD_NAME = 'dw8nrffhv';

export const uploadToCloudinary = async (file) => {
  const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`;

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

  try {
    const res = await fetch(url, {
      method: 'POST',
      body: formData
    });

    const data = await res.json();
    return data.secure_url;
  } catch (err) {
    console.error('Upload failed:', err);
    throw new Error('Upload failed');
  }
};
