import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const CONFIG_PATH = path.join(process.cwd(), 'config.json');

export async function GET() {
  try {
    const fileContents = await fs.readFile(CONFIG_PATH, 'utf8');
    const config = JSON.parse(fileContents);
    return NextResponse.json(config);
  } catch (error) {
    // If file doesn't exist, return default config
    const defaultConfig = {
      settings: {
        visuals: {
          widgetColors: [
            '#0088FE',
            '#00C49F',
            '#FFBB28',
            '#FF8042',
            '#8884d8',
            '#82ca9d',
            '#ffc658',
            '#ff7300',
            '#9c88ff',
            '#ff8c94',
          ],
        },
        addresses: {},
        widgetDefaults: {},
      },
    };
    return NextResponse.json(defaultConfig);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate the structure
    if (!body.settings) {
      return NextResponse.json(
        { error: 'Invalid config structure' },
        { status: 400 }
      );
    }

    // Validate widget colors if provided
    if (body.settings.visuals?.widgetColors) {
      // Ensure we have exactly 10 colors
      if (body.settings.visuals.widgetColors.length !== 10) {
        return NextResponse.json(
          { error: 'Must have exactly 10 widget colors' },
          { status: 400 }
        );
      }

      // Validate hex colors
      const hexPattern = /^#[0-9A-Fa-f]{6}$/;
      if (!body.settings.visuals.widgetColors.every((color: string) => hexPattern.test(color))) {
        return NextResponse.json(
          { error: 'All colors must be valid hex codes' },
          { status: 400 }
        );
      }
    }

    // Read existing config to preserve other settings
    let existingConfig: any = {};
    try {
      const fileContents = await fs.readFile(CONFIG_PATH, 'utf8');
      existingConfig = JSON.parse(fileContents);
    } catch (error) {
      // If file doesn't exist, start with empty config
      existingConfig = { settings: {} };
    }

    // Merge new settings with existing config
    const mergedConfig = {
      ...existingConfig,
      settings: {
        ...existingConfig.settings,
        ...body.settings,
        // Preserve addresses and widgetDefaults if they exist and weren't sent
        addresses: body.settings.addresses !== undefined ? body.settings.addresses : (existingConfig.settings?.addresses || {}),
        widgetDefaults: body.settings.widgetDefaults !== undefined ? body.settings.widgetDefaults : (existingConfig.settings?.widgetDefaults || {}),
        // Preserve categories if they exist and weren't sent
        categories: body.settings.categories !== undefined ? body.settings.categories : (existingConfig.settings?.categories || {}),
        // Preserve requireX402Payments if it exists and wasn't sent
        requireX402Payments: body.settings.requireX402Payments !== undefined ? body.settings.requireX402Payments : (existingConfig.settings?.requireX402Payments ?? false),
      },
    };

    // Write to config file
    await fs.writeFile(CONFIG_PATH, JSON.stringify(mergedConfig, null, 2), 'utf8');
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving config:', error);
    return NextResponse.json(
      { error: 'Failed to save config' },
      { status: 500 }
    );
  }
}

