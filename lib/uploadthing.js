import { createUploadthing } from 'uploadthing/next';
import { auth } from '@/auth';

const f = createUploadthing();

// Maximum file sizes by type (in bytes)
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB
const MAX_OTHER_SIZE = 20 * 1024 * 1024; // 20MB

export const ourFileRouter = {
  editorUploader: f(['image', 'text', 'blob', 'pdf', 'video', 'audio'])
    .middleware(async ({ req }) => {
      // Require authentication for all uploads
      const session = await auth();
      
      if (!session?.user?.id) {
        throw new Error('Unauthorized: Authentication required');
      }
      
      // Return user context for onUploadComplete
      return { 
        userId: session.user.id,
        userEmail: session.user.email,
      };
    })
    .onUploadComplete(({ file, metadata }) => {
      // Log upload for audit trail (without sensitive data)
      console.log(`[Upload] User ${metadata.userId} uploaded: ${file.name} (${file.size} bytes)`);
      
      return {
        key: file.key,
        name: file.name,
        size: file.size,
        type: file.type,
        url: file.ufsUrl,
        uploadedBy: metadata.userId,
      };
    })
};
