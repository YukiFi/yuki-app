/**
 * Profile Image Upload API
 * 
 * Handles avatar and banner uploads with server-side processing.
 * Uses UTApi for direct server-side uploads.
 * Authentication via x-wallet-address header.
 */

import { NextRequest, NextResponse } from 'next/server';
import { UTApi } from 'uploadthing/server';

const utapi = new UTApi();

// Max file sizes
const MAX_AVATAR_SIZE = 4 * 1024 * 1024; // 4MB
const MAX_BANNER_SIZE = 8 * 1024 * 1024; // 8MB

export async function POST(request: NextRequest) {
  try {
    // Verify authentication via wallet address header
    const walletAddress = request.headers.get('x-wallet-address');
    if (!walletAddress || !walletAddress.match(/^0x[a-fA-F0-9]{40}$/i)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const type = formData.get('type') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!type || !['avatar', 'banner'].includes(type)) {
      return NextResponse.json({ error: 'Invalid type. Must be "avatar" or "banner"' }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
    }

    // Validate file size
    const maxSize = type === 'avatar' ? MAX_AVATAR_SIZE : MAX_BANNER_SIZE;
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: `File too large. Max size: ${maxSize / 1024 / 1024}MB` 
      }, { status: 400 });
    }

    // Upload to UploadThing
    console.log(`[Upload API] Uploading ${type} for wallet:`, walletAddress);
    
    const response = await utapi.uploadFiles(file);
    
    if (response.error) {
      console.error('[Upload API] Upload failed:', response.error);
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }

    const url = response.data?.ufsUrl || response.data?.url;
    console.log('[Upload API] Upload successful, URL:', url);

    return NextResponse.json({ 
      success: true, 
      url,
      key: response.data?.key,
    });
  } catch (error) {
    console.error('[Upload API] Error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Upload failed' 
    }, { status: 500 });
  }
}
