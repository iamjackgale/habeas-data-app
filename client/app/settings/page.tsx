'use client';

import { useState, useEffect } from 'react';
import { DashboardFooter } from '@/components/dashboard-footer';
import { ColorPicker } from '@/components/settings/color-picker';
import { PaymentToggle } from '@/components/settings/payment-toggle';
import { ChevronDown, ChevronUp, ChevronRight } from 'lucide-react';
import { useCategories, getCategoryDisplayName } from '@/hooks/use-categories';

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
  const [favicon, setFavicon] = useState<string | null>(null);
  const [uploadingFavicon, setUploadingFavicon] = useState<boolean>(false);
  const [syncingCategories, setSyncingCategories] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [syncMessage, setSyncMessage] = useState<string>('');
  const [addressesTableOpen, setAddressesTableOpen] = useState(false);
  const [categoriesTableOpen, setCategoriesTableOpen] = useState(false);
  const [editedCategoryNames, setEditedCategoryNames] = useState<Record<string, string>>({});
  const [savingCategories, setSavingCategories] = useState(false);
  const [categoriesSaveStatus, setCategoriesSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [requireX402Payments, setRequireX402Payments] = useState<boolean>(false);
  
  // Load categories from config
  const categoriesConfig = useCategories();

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
          if (config.settings?.requireX402Payments !== undefined) {
            setRequireX402Payments(config.settings.requireX402Payments);
          } else {
            // Default to false (payments not required)
            setRequireX402Payments(false);
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

  // Load existing favicon on mount
  useEffect(() => {
    const loadFavicon = async () => {
      try {
        const response = await fetch('/api/favicon');
        if (response.ok) {
          const data = await response.json();
          setFavicon(data.favicon);
        }
      } catch (error) {
        console.error('Error loading favicon:', error);
      }
    };
    loadFavicon();
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

  const handleFaviconUpload = async (file: File) => {
    setUploadingFavicon(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/favicon/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setFavicon(data.path);
        setSaveStatus('success');
        setTimeout(() => setSaveStatus('idle'), 3000);
      } else {
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 3000);
      }
    } catch (error) {
      console.error('Error uploading favicon:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } finally {
      setUploadingFavicon(false);
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
            requireX402Payments,
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

  const handleSyncCategories = async () => {
    setSyncingCategories(true);
    setSyncStatus('idle');
    setSyncMessage('');

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${API_URL}/api/octav/categories/sync`, {
        method: 'GET',
      });

      if (response.ok) {
        const data = await response.json();
        setSyncStatus('success');
        setSyncMessage(
          data.newCategories?.length > 0
            ? `Successfully synced ${data.newCategories.length} new categories. Total: ${data.totalCategories} categories from ${data.totalTransactions} transactions.`
            : `No new categories found. Total: ${data.totalCategories} categories from ${data.totalTransactions} transactions.`
        );
        // Reload the page after 2 seconds to refresh categories
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        const errorData = await response.json().catch(() => ({}));
        setSyncStatus('error');
        setSyncMessage(errorData.message || 'Failed to sync categories');
        setTimeout(() => {
          setSyncStatus('idle');
          setSyncMessage('');
        }, 5000);
      }
    } catch (error) {
      console.error('Error syncing categories:', error);
      setSyncStatus('error');
      setSyncMessage(error instanceof Error ? error.message : 'Failed to sync categories');
      setTimeout(() => {
        setSyncStatus('idle');
        setSyncMessage('');
      }, 5000);
    } finally {
      setSyncingCategories(false);
    }
  };

  const handleSaveCategoryNames = async () => {
    setSavingCategories(true);
    setCategoriesSaveStatus('idle');

    try {
      // Read current config
      const response = await fetch('/api/settings');
      if (!response.ok) {
        throw new Error('Failed to load current config');
      }
      const currentConfig = await response.json();

      // Update category names in the config
      const updatedCategories = { ...currentConfig.settings.categories };
      Object.entries(editedCategoryNames).forEach(([categoryKey, newName]) => {
        if (updatedCategories[categoryKey]) {
          updatedCategories[categoryKey] = {
            ...updatedCategories[categoryKey],
            category_name: newName,
          };
        }
      });

      // Save updated config
      const saveResponse = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          settings: {
            ...currentConfig.settings,
            categories: updatedCategories,
          },
        }),
      });

      if (saveResponse.ok) {
        setCategoriesSaveStatus('success');
        setEditedCategoryNames({});
        // Reload categories after a short delay
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        setCategoriesSaveStatus('error');
        setTimeout(() => {
          setCategoriesSaveStatus('idle');
        }, 3000);
      }
    } catch (error) {
      console.error('Error saving category names:', error);
      setCategoriesSaveStatus('error');
      setTimeout(() => {
        setCategoriesSaveStatus('idle');
      }, 3000);
    } finally {
      setSavingCategories(false);
    }
  };

  const handleCategoryNameChange = (categoryKey: string, newName: string) => {
    setEditedCategoryNames(prev => ({
      ...prev,
      [categoryKey]: newName,
    }));
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
              <label htmlFor="organizationName" className="text-lg font-semibold">
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
                className="w-1/4 px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Organization Description */}
            <div className="flex flex-col gap-2">
              <label htmlFor="organizationDescription" className="text-lg font-semibold">
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
                className="w-1/2 px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-y"
              />
            </div>

            {/* Dark Mode Logo */}
            <div className="flex flex-col gap-2">
              <label htmlFor="darkLogo" className="text-lg font-semibold">
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
              <label htmlFor="lightLogo" className="text-lg font-semibold">
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

            {/* Site Favicon */}
            <div className="flex flex-col gap-2">
              <label htmlFor="favicon" className="text-lg font-semibold">
                Site Favicon
              </label>
              <div className="flex items-center gap-4">
                <label
                  htmlFor="favicon"
                  className={`px-4 py-2 border border-border rounded-lg bg-background text-foreground cursor-pointer hover:bg-accent transition-colors ${
                    uploadingFavicon ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {uploadingFavicon ? 'Uploading...' : 'Choose File'}
                </label>
                <input
                  id="favicon"
                  type="file"
                  accept="image/*,.ico"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleFaviconUpload(file);
                    }
                  }}
                  disabled={uploadingFavicon}
                  className="hidden"
                />
                {favicon && (
                  <div className="flex items-center gap-2">
                    <img
                      src={favicon}
                      alt="Site favicon"
                      className="h-8 w-8 object-contain border border-border rounded"
                    />
                    <span className="text-xs text-muted-foreground">Current</span>
                  </div>
                )}
              </div>
            </div>

            {/* x402 Payments */}
            <div className="flex flex-col gap-2">
              <label className="text-lg font-semibold">
                x402 Payments
              </label>
              <PaymentToggle
                value={requireX402Payments}
                onChange={(value) => {
                  setRequireX402Payments(value);
                  setSaveStatus('idle');
                }}
              />
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
              <button
                onClick={() => setAddressesTableOpen(!addressesTableOpen)}
                className="w-full flex items-center gap-2 mb-2"
              >
                {addressesTableOpen ? (
                  <ChevronDown className="h-5 w-5" />
                ) : (
                  <ChevronRight className="h-5 w-5" />
                )}
                <h3 className="text-lg font-semibold">Pro Addresses</h3>
              </button>
              <p className="text-foreground mb-4">
                List of configured addresses available for queries.
              </p>
            </div>
            
            {addressesTableOpen && (
              <>
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
              </>
            )}
          </div>
        </CollapsibleSection>

        {/* Categories Section */}
        <CollapsibleSection title="Categories">
          <div className="flex flex-col gap-6">
            {/* Categories List */}
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setCategoriesTableOpen(!categoriesTableOpen)}
                className="w-full flex items-center gap-2"
              >
                {categoriesTableOpen ? (
                  <ChevronDown className="h-5 w-5" />
                ) : (
                  <ChevronRight className="h-5 w-5" />
                )}
                <h3 className="text-lg font-semibold">Categories</h3>
              </button>
              <p className="text-foreground text-sm">
                List of all detected categories utilised in reviewed Octav data.
              </p>
              
              {categoriesTableOpen && (
                <>
                  {Object.keys(categoriesConfig).length > 0 ? (
                    <div className="border border-border rounded-lg overflow-hidden mt-2">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b border-border bg-accent/30">
                            <th className="p-3 text-left font-semibold">Raw Category</th>
                            <th className="p-3 text-left font-semibold">Category Name</th>
                            <th className="p-3 text-left font-semibold">Type</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(categoriesConfig)
                            .sort(([a], [b]) => a.localeCompare(b))
                            .map(([categoryName, config]) => {
                              const displayName = getCategoryDisplayName(categoryName, categoriesConfig);
                              const type = config.category_type || 'None';
                              const color = config.category_colour || '#808080';
                              
                              // Calculate text color based on background color brightness
                              const hexToRgb = (hex: string) => {
                                const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
                                return result ? {
                                  r: parseInt(result[1], 16),
                                  g: parseInt(result[2], 16),
                                  b: parseInt(result[3], 16)
                                } : { r: 128, g: 128, b: 128 };
                              };
                              
                              const rgb = hexToRgb(color);
                              const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
                              const textColor = brightness > 128 ? '#000000' : '#ffffff';
                              
                              const editedName = editedCategoryNames[categoryName];
                              const currentDisplayName = editedName !== undefined ? editedName : displayName;
                              const hasChanges = editedName !== undefined && editedName !== displayName;
                              
                              return (
                                <tr key={categoryName} className="border-b border-border hover:bg-accent/20 transition-colors">
                                  <td className="p-3">
                                    <span className="font-mono text-sm">{categoryName}</span>
                                  </td>
                                  <td className="p-3">
                                    <input
                                      type="text"
                                      value={currentDisplayName}
                                      onChange={(e) => handleCategoryNameChange(categoryName, e.target.value)}
                                      className={`w-full px-2 py-1 border border-border rounded bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary ${
                                        hasChanges ? 'ring-2 ring-yellow-500' : ''
                                      }`}
                                    />
                                  </td>
                                  <td className="p-3">
                                    <span 
                                      className="px-2 py-1 rounded text-xs font-semibold inline-flex items-center gap-2"
                                      style={{
                                        backgroundColor: color,
                                        color: textColor
                                      }}
                                    >
                                      {type}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                      {Object.keys(editedCategoryNames).length > 0 && (
                        <div className="p-4 border-t border-border flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">
                            {Object.keys(editedCategoryNames).length} category name(s) modified
                          </span>
                          <div className="flex items-center gap-2">
                            {categoriesSaveStatus === 'success' && (
                              <span className="text-sm text-green-600 dark:text-green-400">Saved!</span>
                            )}
                            {categoriesSaveStatus === 'error' && (
                              <span className="text-sm text-red-600 dark:text-red-400">Error saving</span>
                            )}
                            <button
                              onClick={handleSaveCategoryNames}
                              disabled={savingCategories}
                              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              {savingCategories ? 'Saving...' : 'Save Changes'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-4 border border-border rounded-lg mt-2">
                      <p className="text-muted-foreground">No categories configured</p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Sync Categories */}
            <div className="flex flex-col gap-2">
              <h3 className="text-lg font-semibold">Pull new categories from cached data</h3>
              <div className="flex items-center gap-4">
                <button
                  onClick={handleSyncCategories}
                  disabled={syncingCategories}
                  className={`px-4 py-2 border border-border rounded-lg bg-background text-foreground cursor-pointer hover:bg-accent transition-colors ${
                    syncingCategories ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {syncingCategories ? 'Syncing...' : 'Sync Categories'}
                </button>
                {syncStatus === 'success' && (
                  <span className="text-sm text-green-600">{syncMessage}</span>
                )}
                {syncStatus === 'error' && (
                  <span className="text-sm text-red-600">{syncMessage}</span>
                )}
              </div>
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

