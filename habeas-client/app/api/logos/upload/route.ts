import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

const LOGOS_DARK_PATH = path.join(process.cwd(), 'public', 'org-logos', 'dark');
const LOGOS_LIGHT_PATH = path.join(process.cwd(), 'public', 'org-logos', 'light');

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const mode = formData.get('mode') as string; // 'dark' or 'light'

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!mode || (mode !== 'dark' && mode !== 'light')) {
      return NextResponse.json(
        { error: 'Invalid mode. Must be "dark" or "light"' },
        { status: 400 }
      );
    }

    // Determine target directory
    const targetDir = mode === 'dark' ? LOGOS_DARK_PATH : LOGOS_LIGHT_PATH;

    // Ensure directory exists
    await mkdir(targetDir, { recursive: true });

    // Get file extension
    const fileExtension = path.extname(file.name);
    const allowedExtensions = ['.svg', '.png', '.jpg', '.jpeg', '.gif', '.webp'];
    
    if (!allowedExtensions.includes(fileExtension.toLowerCase())) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: svg, png, jpg, jpeg, gif, webp' },
        { status: 400 }
      );
    }

    // Generate filename: org-logo-{mode}{extension}
    const filename = `org-logo-${mode}${fileExtension}`;
    const filePath = path.join(targetDir, filename);

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    return NextResponse.json({
      success: true,
      path: `/org-logos/${mode}/${filename}`,
    });
  } catch (error) {
    console.error('Error uploading logo:', error);
    return NextResponse.json(
      { error: 'Failed to upload logo' },
      { status: 500 }
    );
  }
}

