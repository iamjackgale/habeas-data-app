'use client';

import { useState, useEffect } from 'react';
import { DashboardFooter } from '@/components/dashboard-footer';
import { ColorPicker } from '@/components/settings/color-picker';
import { ChevronDown, ChevronUp } from 'lucide-react';

function CollapsibleSection({ 
  title, 
  children, 
  defaultOpen = true 
}: { 
  title: string; 
  children: React.ReactNode; 
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-border rounded-lg overflow-visible">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-card hover:bg-accent transition-colors rounded-t-lg"
      >
        <h2 className="text-lg font-semibold">{title}</h2>
        {isOpen ? (
          <ChevronUp className="h-5 w-5" />
        ) : (
          <ChevronDown className="h-5 w-5" />
        )}
      </button>
      {isOpen && (
        <div className="p-6 flex flex-col gap-6 rounded-b-lg">
          {children}
        </div>
      )}
    </div>
  );
}

export default function SettingsPage() {
  const [widgetColors, setWidgetColors] = useState<string[]>([
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
  ]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Load config on mount
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const response = await fetch('/api/settings');
        if (response.ok) {
          const config = await response.json();
          if (config.settings?.visuals?.widgetColors) {
            setWidgetColors(config.settings.visuals.widgetColors);
          }
        }
      } catch (error) {
        console.error('Error loading config:', error);
      }
    };
    loadConfig();
  }, []);

  const handleColorChange = (index: number, color: string) => {
    const newColors = [...widgetColors];
    newColors[index] = color;
    setWidgetColors(newColors);
    setSaveStatus('idle'); // Reset save status when colors change
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus('idle');

    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          settings: {
            visuals: {
              widgetColors,
            },
          },
        }),
      });

      if (response.ok) {
        setSaveStatus('success');
        setTimeout(() => setSaveStatus('idle'), 3000);
      } else {
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 3000);
      }
    } catch (error) {
      console.error('Error saving config:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-4">
      <h1 className="text-2xl font-bold">Settings</h1>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <p className="text-foreground">Admin-gated settings that allow organisations to configure your Habeas instance for public display.</p>
          <p className="text-foreground">Accessible when connected with a permitted admin account only</p>
        </div>

        {/* Visuals Section */}
        <CollapsibleSection title="Visuals">
          <div className="flex flex-col gap-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Widget Colours</h3>
              <p className="text-foreground mb-4">
                Select up to 10 colours to apply automatically and in order to widgets generated on Habeas.
              </p>
            </div>
            
            {/* Invisible table: 5 columns x 2 rows = 10 color pickers */}
            <div className="grid grid-cols-5 gap-4">
              {widgetColors.map((color, index) => (
                <ColorPicker
                  key={index}
                  label={`Colour ${index + 1}`}
                  value={color}
                  onChange={(newColor) => handleColorChange(index, newColor)}
                />
              ))}
            </div>
          </div>
        </CollapsibleSection>

        {/* Save Button */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`px-6 py-2.5 rounded-xl font-semibold transition-all ${
              isSaving
                ? 'bg-gray-400 cursor-not-allowed'
                : saveStatus === 'success'
                ? 'bg-green-600 hover:bg-green-700'
                : saveStatus === 'error'
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-[#347745] hover:bg-[#2a5f37]'
            } text-foreground`}
          >
            {isSaving ? 'Saving...' : saveStatus === 'success' ? 'Saved!' : saveStatus === 'error' ? 'Error' : 'Save Settings'}
          </button>
          {saveStatus === 'success' && (
            <span className="text-sm text-green-600">Saved!</span>
          )}
          {saveStatus === 'error' && (
            <span className="text-sm text-red-600">Failed to save settings</span>
          )}
        </div>
      </div>
      {/* Footer */}
      <DashboardFooter />
    </div>
  );
}

