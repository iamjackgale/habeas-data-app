import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import { copyFile } from 'fs/promises';
import path from 'path';

const FAVICON_PATH = path.join(process.cwd(), 'public', 'org-logos', 'logo', 'favicon.ico');
const DEFAULT_FAVICON_PATH = path.join(process.cwd(), 'public', 'habeas-logos', 'logo', 'habeas-favicon.ico');
const APP_FAVICON_PATH = path.join(process.cwd(), 'app', 'favicon.ico');

// GET: Check for existing favicon and sync app/favicon.ico
export async function GET() {
  try {
    // Check if org favicon exists
    try {
      await fs.access(FAVICON_PATH);
      // Sync to app/favicon.ico for Next.js build
      try {
        await copyFile(FAVICON_PATH, APP_FAVICON_PATH);
      } catch (error) {
        console.error('Error syncing favicon to app directory:', error);
      }
      return NextResponse.json({
        favicon: '/org-logos/logo/favicon.ico',
        exists: true,
      });
    } catch {
      // If org favicon doesn't exist, use default and sync to app/favicon.ico
      try {
        await fs.access(DEFAULT_FAVICON_PATH);
        await copyFile(DEFAULT_FAVICON_PATH, APP_FAVICON_PATH);
      } catch (error) {
        console.error('Error syncing default favicon to app directory:', error);
      }
      return NextResponse.json({
        favicon: '/habeas-logos/logo/habeas-favicon.ico',
        exists: false,
      });
    }
  } catch (error) {
    console.error('Error reading favicon:', error);
    return NextResponse.json(
      { error: 'Failed to read favicon' },
      { status: 500 }
    );
  }
}

