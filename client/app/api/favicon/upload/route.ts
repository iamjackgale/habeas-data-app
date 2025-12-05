import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir, copyFile } from 'fs/promises';
import path from 'path';

const FAVICON_PATH = path.join(process.cwd(), 'public', 'org-logos', 'logo', 'favicon.ico');
const APP_FAVICON_PATH = path.join(process.cwd(), 'app', 'favicon.ico');
const LOGO_DIR = path.join(process.cwd(), 'public', 'org-logos', 'logo');

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Get file extension
    const fileExtension = path.extname(file.name);
    const allowedExtensions = ['.ico', '.png', '.svg', '.jpg', '.jpeg', '.gif', '.webp'];
    
    if (!allowedExtensions.includes(fileExtension.toLowerCase())) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: ico, png, svg, jpg, jpeg, gif, webp' },
        { status: 400 }
      );
    }

    // Ensure directory exists
    await mkdir(LOGO_DIR, { recursive: true });

    // Convert file to buffer and save as favicon.ico
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Save to org-logos/logo/favicon.ico
    await writeFile(FAVICON_PATH, buffer);
    
    // Also copy to app/favicon.ico for Next.js build
    await copyFile(FAVICON_PATH, APP_FAVICON_PATH);

    return NextResponse.json({
      success: true,
      path: '/org-logos/logo/favicon.ico',
    });
  } catch (error) {
    console.error('Error uploading favicon:', error);
    return NextResponse.json(
      { error: 'Failed to upload favicon' },
      { status: 500 }
    );
  }
}

