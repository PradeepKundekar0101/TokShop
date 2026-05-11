import { getFirebaseStorage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export interface UploadImageResult {
  url: string;
  filename: string;
}

export async function uploadImagesToFirebase(
  files: File[],
  productId: string
): Promise<UploadImageResult[]> {
  const storage = getFirebaseStorage();
  const uploadPromises = files.map(async (file, index) => {
    try {
      const fileExtension = file.name.split('.').pop() || 'jpg';
      const filename = `${productId}_${index + 1}.${fileExtension}`;
      
      // Create Firebase storage reference with product ID
      const imageRef = ref(storage, `product-images/${filename}`);
      
      // Upload file to Firebase Storage
      const uploadResult = await uploadBytes(imageRef, file);
      
      // Get download URL
      const downloadURL = await getDownloadURL(uploadResult.ref);
      
      return {
        url: downloadURL,
        filename: filename
      };
    } catch (error) {
      console.error(`Error uploading ${file.name}:`, error);
      throw error;
    }
  });

  return Promise.all(uploadPromises);
}

export async function uploadShowThumbnail(
  file: File,
  showId: string
): Promise<string> {
  const storage = getFirebaseStorage();
  try {
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const filename = `${showId}_thumbnail.${fileExtension}`;
    
    // Create Firebase storage reference for show thumbnails
    const imageRef = ref(storage, `show-thumbnails/${filename}`);
    
    // Upload file to Firebase Storage
    const uploadResult = await uploadBytes(imageRef, file);
    
    // Get download URL
    const downloadURL = await getDownloadURL(uploadResult.ref);
    
    return downloadURL;
  } catch (error) {
    console.error(`Error uploading show thumbnail:`, error);
    throw error;
  }
}

export async function uploadGiveawayImage(
  file: File,
  giveawayId?: string
): Promise<string> {
  const storage = getFirebaseStorage();
  try {
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const timestamp = Date.now();
    const id = giveawayId || `new_${timestamp}`;
    const filename = `${id}_${timestamp}.${fileExtension}`;
    
    // Create Firebase storage reference for giveaway images
    const imageRef = ref(storage, `giveaway-images/${filename}`);
    
    // Upload file to Firebase Storage
    const uploadResult = await uploadBytes(imageRef, file);
    
    // Get download URL
    const downloadURL = await getDownloadURL(uploadResult.ref);
    
    return downloadURL;
  } catch (error) {
    console.error(`Error uploading giveaway image:`, error);
    throw error;
  }
}