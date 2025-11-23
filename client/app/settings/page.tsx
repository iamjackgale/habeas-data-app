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

interface AddressEntry {
  address: string;
  label: string;
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
  const [proAddresses, setProAddresses] = useState<Record<string, AddressEntry>>({});
  const [organizationName, setOrganizationName] = useState<string>('');
  const [organizationDescription, setOrganizationDescription] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [darkLogo, setDarkLogo] = useState<string | null>(null);
  const [lightLogo, setLightLogo] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState<'dark' | 'light' | null>(null);

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
          if (config.settings?.addresses) {
            console.log('Loaded addresses from config:', config.settings.addresses);
            console.log('Type of addresses:', typeof config.settings.addresses);
            console.log('Is object:', typeof config.settings.addresses === 'object');
            console.log('Keys:', Object.keys(config.settings.addresses));
            setProAddresses(config.settings.addresses);
          } else {
            console.log('No addresses found in config. Config structure:', config);
          }
          if (config.settings?.organizationName) {
            setOrganizationName(config.settings.organizationName);
          }
          if (config.settings?.organizationDescription) {
            setOrganizationDescription(config.settings.organizationDescription);
          }
        }
      } catch (error) {
        console.error('Error loading config:', error);
      }
    };
    loadConfig();
  }, []);

  // Load existing logos on mount
  useEffect(() => {
    const loadLogos = async () => {
      try {
        const response = await fetch('/api/logos');
        if (response.ok) {
          const data = await response.json();
          setDarkLogo(data.dark);
          setLightLogo(data.light);
        }
      } catch (error) {
        console.error('Error loading logos:', error);
      }
    };
    loadLogos();
  }, []);

  // Debug: Log proAddresses when it changes
  useEffect(() => {
    console.log('proAddresses state updated:', proAddresses);
    console.log('Number of addresses:', Object.keys(proAddresses).length);
  }, [proAddresses]);

  const handleColorChange = (index: number, color: string) => {
    const newColors = [...widgetColors];
    newColors[index] = color;
    setWidgetColors(newColors);
    setSaveStatus('idle'); // Reset save status when colors change
  };

  const handleLogoUpload = async (file: File, mode: 'dark' | 'light') => {
    setUploadingLogo(mode);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('mode', mode);

      const response = await fetch('/api/logos/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        if (mode === 'dark') {
          setDarkLogo(data.path);
        } else {
          setLightLogo(data.path);
        }
        setSaveStatus('success');
        setTimeout(() => setSaveStatus('idle'), 3000);
      } else {
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 3000);
      }
    } catch (error) {
      console.error('Error uploading logo:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } finally {
      setUploadingLogo(null);
    }
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
            organizationName,
            organizationDescription,
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

        {/* Account Section */}
        <CollapsibleSection title="Account">
          <div className="flex flex-col gap-4">
            {/* Organization Name */}
            <div className="flex flex-col gap-2">
              <label htmlFor="organizationName" className="text-sm font-semibold">
                Organization Name
              </label>
              <input
                id="organizationName"
                type="text"
                value={organizationName}
                onChange={(e) => {
                  setOrganizationName(e.target.value);
                  setSaveStatus('idle');
                }}
                placeholder="Enter organization name"
                className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Organization Description */}
            <div className="flex flex-col gap-2">
              <label htmlFor="organizationDescription" className="text-sm font-semibold">
                Organization Description
              </label>
              <textarea
                id="organizationDescription"
                value={organizationDescription}
                onChange={(e) => {
                  setOrganizationDescription(e.target.value);
                  setSaveStatus('idle');
                }}
                placeholder="Enter organization description"
                rows={4}
                className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-y"
              />
            </div>

            {/* Dark Mode Logo */}
            <div className="flex flex-col gap-2">
              <label htmlFor="darkLogo" className="text-sm font-semibold">
                Dark Mode Logo
              </label>
              <div className="flex items-center gap-4">
                <label
                  htmlFor="darkLogo"
                  className={`px-4 py-2 border border-border rounded-lg bg-background text-foreground cursor-pointer hover:bg-accent transition-colors ${
                    uploadingLogo === 'dark' ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {uploadingLogo === 'dark' ? 'Uploading...' : 'Choose File'}
                </label>
                <input
                  id="darkLogo"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleLogoUpload(file, 'dark');
                    }
                  }}
                  disabled={uploadingLogo === 'dark'}
                  className="hidden"
                />
                {darkLogo && (
                  <div className="flex items-center gap-2">
                    <img
                      src={darkLogo}
                      alt="Dark mode logo"
                      className="h-12 w-auto object-contain border border-border rounded bg-black"
                    />
                    <span className="text-xs text-muted-foreground">Current</span>
                  </div>
                )}
              </div>
            </div>

            {/* Light Mode Logo */}
            <div className="flex flex-col gap-2">
              <label htmlFor="lightLogo" className="text-sm font-semibold">
                Light Mode Logo
              </label>
              <div className="flex items-center gap-4">
                <label
                  htmlFor="lightLogo"
                  className={`px-4 py-2 border border-border rounded-lg bg-background text-foreground cursor-pointer hover:bg-accent transition-colors ${
                    uploadingLogo === 'light' ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {uploadingLogo === 'light' ? 'Uploading...' : 'Choose File'}
                </label>
                <input
                  id="lightLogo"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleLogoUpload(file, 'light');
                    }
                  }}
                  disabled={uploadingLogo === 'light'}
                  className="hidden"
                />
                {lightLogo && (
                  <div className="flex items-center gap-2">
                    <img
                      src={lightLogo}
                      alt="Light mode logo"
                      className="h-12 w-auto object-contain border border-border rounded bg-white"
                    />
                    <span className="text-xs text-muted-foreground">Current</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CollapsibleSection>

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

        {/* Addresses Section */}
        <CollapsibleSection title="Addresses">
          <div className="flex flex-col gap-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Pro Addresses</h3>
              <p className="text-foreground mb-4">
                List of configured addresses available for queries.
              </p>
            </div>
            
            {Object.keys(proAddresses).length > 0 ? (
              <div className="border border-border rounded-lg overflow-hidden">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-accent/30">
                      <th className="p-3 text-left font-semibold">Address</th>
                      <th className="p-3 text-left font-semibold">Label</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(proAddresses).map(([chain, entry]) => {
                      // Ensure entry is an object with address and label
                      const addressEntry = entry as AddressEntry;
                      return (
                        <tr key={chain} className="border-b border-border hover:bg-accent/20 transition-colors">
                          <td className="p-3 font-mono text-sm">{addressEntry?.address || entry?.address || 'N/A'}</td>
                          <td className="p-3">{addressEntry?.label || entry?.label || 'N/A'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-4 border border-border rounded-lg">
                <p className="text-muted-foreground">No addresses configured</p>
                <p className="text-xs text-muted-foreground mt-2">Debug: proAddresses keys: {Object.keys(proAddresses).length}</p>
              </div>
            )}
          </div>
        </CollapsibleSection>

        {/* Save Button */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`px-6 py-2.5 rounded-xl font-semibold transition-all ${
              isSaving
                ? 'bg-gray-400 cursor-not-allowed text-foreground'
                : saveStatus === 'success'
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : saveStatus === 'error'
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-[#347745] hover:bg-[#2a5f37] text-white'
            }`}
          >
            {isSaving ? 'Saving...' : saveStatus === 'success' ? 'Saved!' : saveStatus === 'error' ? 'Error' : 'Save Settings'}
          </button>
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

