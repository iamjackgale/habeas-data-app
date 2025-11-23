import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const LOGOS_DARK_PATH = path.join(process.cwd(), 'public', 'org-logos', 'dark');
const LOGOS_LIGHT_PATH = path.join(process.cwd(), 'public', 'org-logos', 'light');

// GET: Check for existing logos
export async function GET() {
  try {
    // Ensure directories exist
    await fs.mkdir(LOGOS_DARK_PATH, { recursive: true });
    await fs.mkdir(LOGOS_LIGHT_PATH, { recursive: true });

    // Read files from both directories
    const darkFiles = await fs.readdir(LOGOS_DARK_PATH);
    const lightFiles = await fs.readdir(LOGOS_LIGHT_PATH);

    // Filter out non-image files and get the first one (top file)
    const imageExtensions = ['.svg', '.png', '.jpg', '.jpeg', '.gif', '.webp'];
    const darkLogo = darkFiles
      .filter(file => imageExtensions.some(ext => file.toLowerCase().endsWith(ext)))
      .sort()[0] || null;
    
    const lightLogo = lightFiles
      .filter(file => imageExtensions.some(ext => file.toLowerCase().endsWith(ext)))
      .sort()[0] || null;

    return NextResponse.json({
      dark: darkLogo ? `/org-logos/dark/${darkLogo}` : null,
      light: lightLogo ? `/org-logos/light/${lightLogo}` : null,
    });
  } catch (error) {
    console.error('Error reading logos:', error);
    return NextResponse.json(
      { error: 'Failed to read logos' },
      { status: 500 }
    );
  }
}

