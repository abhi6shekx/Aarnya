export const uploadToCloudinary = async (file, uploadPreset) => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', uploadPreset)

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    )

    if (!response.ok) {
      throw new Error('Upload failed')
    }

    const data = await response.json()
    
    // Return both URL and public_id for deletion later
    return {
      url: data.secure_url,
      publicId: data.public_id
    }
  } catch (error) {
    console.error('Cloudinary upload error:', error)
    throw new Error('Failed to upload image')
  }
}

// Free hosted delete service (secure, no API keys needed)
export const deleteFromCloudinary = async (publicId) => {
  try {
    const response = await fetch('https://cloudinary-delete-api.vercel.app/api/delete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        publicId,
        cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD 
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to delete image from Cloudinary')
    }

    return await response.json()
  } catch (error) {
    console.error('Cloudinary delete error:', error)
    // Don't throw error - continue with database deletion even if image delete fails
    return { success: false, error: error.message }
  }
}
