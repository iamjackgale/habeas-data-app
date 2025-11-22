'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface ColorPickerProps {
  label: string;
  value?: string;
  onChange?: (value: string) => void;
}

// Convert HEX to HSV
function hexToHsv(hex: string): { h: number; s: number; v: number } {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  let h = 0;
  if (delta !== 0) {
    if (max === r) {
      h = ((g - b) / delta) % 6;
    } else if (max === g) {
      h = (b - r) / delta + 2;
    } else {
      h = (r - g) / delta + 4;
    }
  }
  h = Math.round(h * 60);
  if (h < 0) h += 360;

  const s = max === 0 ? 0 : Math.round((delta / max) * 100);
  const v = Math.round(max * 100);

  return { h, s, v };
}

// Convert HSV to HEX
function hsvToHex(h: number, s: number, v: number): string {
  s /= 100;
  v /= 100;

  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;

  let r = 0, g = 0, b = 0;

  if (h >= 0 && h < 60) {
    r = c; g = x; b = 0;
  } else if (h >= 60 && h < 120) {
    r = x; g = c; b = 0;
  } else if (h >= 120 && h < 180) {
    r = 0; g = c; b = x;
  } else if (h >= 180 && h < 240) {
    r = 0; g = x; b = c;
  } else if (h >= 240 && h < 300) {
    r = x; g = 0; b = c;
  } else if (h >= 300 && h < 360) {
    r = c; g = 0; b = x;
  }

  r = Math.round((r + m) * 255);
  g = Math.round((g + m) * 255);
  b = Math.round((b + m) * 255);

  return `#${[r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('')}`;
}

export function ColorPicker({ label, value = '#0088FE', onChange }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedColor, setSelectedColor] = useState<string>(value);
  const [customHex, setCustomHex] = useState<string>(value);
  const [openUpward, setOpenUpward] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0, width: 0 });
  const [hsv, setHsv] = useState(() => hexToHsv(value));
  const dropdownRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const gradientRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setSelectedColor(value);
    setCustomHex(value);
    setHsv(hexToHsv(value));
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      const isInsideDropdown = dropdownRef.current?.contains(target);
      const isInsideMenu = menuRef.current?.contains(target);
      
      // Don't close if clicking inside the dropdown button or the menu
      if (!isInsideDropdown && !isInsideMenu) {
        setIsOpen(false);
        isDragging.current = false;
      }
    }
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && dropdownRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect();
      const menuHeight = 240; // Updated for smaller dropdown
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      
      const shouldOpenUpward = spaceBelow < menuHeight && spaceAbove > menuHeight;
      setOpenUpward(shouldOpenUpward);
      
      // Calculate position based on whether we should open upward
      setMenuPosition({ 
        top: shouldOpenUpward ? rect.top - menuHeight - 4 : rect.bottom + 4, 
        left: rect.left, 
        width: rect.width 
      });
    }
  }, [isOpen]);

  const handleGradientClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!gradientRef.current) return;
    const rect = gradientRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    
    const newS = Math.round(x * 100);
    const newV = Math.round((1 - y) * 100);
    
    updateColor(hsv.h, newS, newV);
  };

  const handleGradientMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    isDragging.current = true;
    handleGradientClick(e);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging.current && gradientRef.current) {
      const rect = gradientRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
      
      const newS = Math.round(x * 100);
      const newV = Math.round((1 - y) * 100);
      
      updateColor(hsv.h, newS, newV);
    }
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const handleHueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newH = parseInt(e.target.value);
    updateColor(newH, hsv.s, hsv.v);
  };

  const updateColor = (h: number, s: number, v: number) => {
    const newHsv = { h, s, v };
    setHsv(newHsv);
    const hex = hsvToHex(h, s, v);
    setSelectedColor(hex);
    setCustomHex(hex);
    onChange?.(hex);
  };

  const handleCustomHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const hex = e.target.value;
    setCustomHex(hex);
    if (/^#[0-9A-Fa-f]{6}$/i.test(hex)) {
      const newHsv = hexToHsv(hex);
      setHsv(newHsv);
      setSelectedColor(hex);
      onChange?.(hex);
    }
  };

  // Create gradient that matches actual behavior:
  // Horizontal (X): left (0% saturation = grayscale) to right (100% saturation = full color)
  // Vertical (Y): bottom (0% value = black) to top (100% value = bright)
  const hueColor = hsvToHex(hsv.h, 100, 100);
  
  // Parse hue color to RGB
  const parseHex = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return { r, g, b };
  };
  
  const hueRgb = parseHex(hueColor);
  
  // Create proper S-V gradient using multiple background layers:
  // Base: horizontal gradient from white (left, 0% sat) to full color (right, 100% sat)
  // Overlay: vertical gradient from transparent (top, 100% value) to black (bottom, 0% value)
  const gradientBg = {
    background: `linear-gradient(to bottom, transparent 0%, rgba(0, 0, 0, 1) 100%),
                 linear-gradient(to right, rgb(255, 255, 255) 0%, rgb(${hueRgb.r}, ${hueRgb.g}, ${hueRgb.b}) 100%)`
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      <label className="text-foreground text-sm font-medium">{label}</label>
      <div className="relative inline-block w-full" ref={dropdownRef}>
        <div
          onClick={() => setIsOpen(!isOpen)}
          className="border border-border px-4 py-2.5 bg-background text-foreground cursor-pointer rounded-xl flex justify-between items-center hover:bg-accent transition-colors"
        >
          <div className="flex items-center gap-3 flex-1">
            <div
              className="w-6 h-6 rounded border border-border flex-shrink-0"
              style={{ backgroundColor: selectedColor }}
            />
            <span className="text-left truncate">{selectedColor.toUpperCase()}</span>
          </div>
          {isOpen ? (
            <ChevronUp className="h-5 w-5 ml-2 flex-shrink-0" />
          ) : (
            <ChevronDown className="h-5 w-5 ml-2 flex-shrink-0" />
          )}
        </div>
        {isOpen && mounted && createPortal(
          <div 
            ref={menuRef}
            className="fixed border border-border bg-background text-foreground rounded-xl z-[9999] shadow-lg p-3"
            style={{
              top: `${menuPosition.top}px`,
              left: `${menuPosition.left}px`,
              width: `${menuPosition.width}px`,
            }}
          >
            <div className="flex flex-col gap-3">
              {/* Gradient area */}
              <div className="relative">
                <div
                  ref={gradientRef}
                  className="w-full h-32 rounded-lg cursor-crosshair relative overflow-hidden border border-border"
                  style={gradientBg}
                  onClick={handleGradientClick}
                  onMouseDown={handleGradientMouseDown}
                >
                  {/* Cursor indicator */}
                  <div
                    className="absolute w-3 h-3 border-2 border-white rounded-full shadow-lg pointer-events-none"
                    style={{
                      left: `${hsv.s}%`,
                      top: `${100 - hsv.v}%`,
                      transform: 'translate(-50%, -50%)',
                    }}
                  />
                </div>
              </div>

              {/* Hue slider */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium">Hue</label>
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={hsv.h}
                  onChange={handleHueChange}
                  className="w-full h-2 bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-cyan-500 via-blue-500 via-purple-500 to-red-500 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: 'linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)',
                  }}
                />
              </div>

              {/* Hex input */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium">Hex Color</label>
                <input
                  type="text"
                  value={customHex}
                  onChange={handleCustomHexChange}
                  placeholder="#000000"
                  pattern="^#[0-9A-Fa-f]{6}$"
                  className="w-full px-3 py-1.5 text-sm border border-border bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-primary uppercase"
                />
              </div>
            </div>
          </div>,
          document.body
        )}
      </div>
    </div>
  );
}
