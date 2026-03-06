import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { storage } from './firebase';

interface UploadFileOptions {
  featureName: string;
  itemId: string;
  file: File;
  userId: string;
}

export async function uploadFile({ featureName, itemId, file, userId }: UploadFileOptions): Promise<string> {
  const extension = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${extension}`;
  const path = `${userId}/${featureName}/${itemId}/${fileName}`;
  
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  
  return path;
}

export async function getSignedUrl(path: string): Promise<string> {
  if (!path) return '';
  
  // If it's already a full URL, return it
  if (path.startsWith('http')) return path;
  
  try {
    const storageRef = ref(storage, path);
    return await getDownloadURL(storageRef);
  } catch (error) {
    console.error('Error getting download URL:', error);
    return '';
  }
}

export async function deleteFile(path: string): Promise<void> {
  if (!path || path.startsWith('http')) return;
  
  try {
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
  } catch (error) {
    console.error('Error deleting file:', error);
  }
}
