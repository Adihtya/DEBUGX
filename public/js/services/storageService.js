/**
// ==============================================================================
// DEBUGX — SUPABASE STORAGE SERVICE
// Manages screenshot & camera uploads in the 'debugx-uploads' bucket
// ==============================================================================
*/

class StorageService {
  constructor() {
    this.bucketName = 'debugx-uploads';
  }

  /**
   * Upload an image file or blob to Supabase Storage
   * File path follows the RLS isolated structure: {userId}/{timestamp}_{filename}
   */
  async uploadScreenshot(fileOrBlob, userId, filename = 'capture.png') {
    const client = window.supabaseManager?.getClient();
    if (!client || !window.supabaseManager.isLiveConnected || !userId) {
      console.info('[StorageService] Mock storage path returned in demo mode.');
      return { path: `demo/${Date.now()}_${filename}`, url: null };
    }

    try {
      const sanitizedName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
      const storagePath = `${userId}/${Date.now()}_${sanitizedName}`;

      const { data, error } = await client.storage
        .from(this.bucketName)
        .upload(storagePath, fileOrBlob, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      // Generate a temporary signed URL (valid for 2 hours)
      const { data: signedData, error: signError } = await client.storage
        .from(this.bucketName)
        .createSignedUrl(storagePath, 7200);

      return {
        path: storagePath,
        url: signedData?.signedUrl || null
      };
    } catch (err) {
      console.warn('[StorageService] uploadScreenshot error:', err);
      return { path: null, url: null, error: err.message };
    }
  }

  /**
   * Delete a screenshot from storage
   */
  async deleteScreenshot(storagePath) {
    const client = window.supabaseManager?.getClient();
    if (!client || !window.supabaseManager.isLiveConnected || !storagePath) return;

    try {
      await client.storage.from(this.bucketName).remove([storagePath]);
    } catch (err) {
      console.warn('[StorageService] deleteScreenshot error:', err);
    }
  }
}

window.storageService = new StorageService();
