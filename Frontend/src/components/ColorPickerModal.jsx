import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Plus, Palette, Save, Check } from "lucide-react";

const ColorPickerModal = ({ isOpen, onClose, onColorSelect, existingColors = [] }) => {
  const [hue, setHue] = useState(0);
  const [saturation, setSaturation] = useState(100);
  const [lightness, setLightness] = useState(50);
  const [colorName, setColorName] = useState("");
  const [savedColors, setSavedColors] = useState(existingColors);
  
  const canvasRef = useRef(null);
  const pickerRef = useRef(null);
  const isDragging = useRef(false);

  // Convert HSL to HEX
  const hslToHex = (h, s, l) => {
    l /= 100;
    const a = s * Math.min(l, 1 - l) / 100;
    const f = n => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  };

  const currentColor = hslToHex(hue, saturation, lightness);

  // Draw the color picker gradient
  useEffect(() => {
    const canvas = pickerRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Create gradient for saturation (left to right)
    const gradient = ctx.createLinearGradient(0, 0, width, 0);
    gradient.addColorStop(0, '#808080'); // gray at 0% saturation
    gradient.addColorStop(1, `hsl(${hue}, 100%, 50%)`); // full saturation
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // Add white to transparent gradient (top to bottom for lightness)
    const gradient2 = ctx.createLinearGradient(0, 0, 0, height);
    gradient2.addColorStop(0, 'rgba(255,255,255,1)');
    gradient2.addColorStop(0.5, 'rgba(255,255,255,0)');
    gradient2.addColorStop(0.5, 'rgba(0,0,0,0)');
    gradient2.addColorStop(1, 'rgba(0,0,0,1)');
    
    ctx.fillStyle = gradient2;
    ctx.fillRect(0, 0, width, height);
  }, [hue, pickerRef]);

  // Handle mouse drag for color selection
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging.current || !pickerRef.current) return;
      
      const canvas = pickerRef.current;
      const rect = canvas.getBoundingClientRect();
      
      // Check if within canvas bounds
      if (e.clientX >= rect.left && e.clientX <= rect.right &&
          e.clientY >= rect.top && e.clientY <= rect.bottom) {
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const newSaturation = (x / rect.width) * 100;
        const newLightness = 100 - ((y / rect.height) * 100);
        
        setSaturation(Math.max(0, Math.min(100, newSaturation)));
        setLightness(Math.max(0, Math.min(100, newLightness)));
      }
    };
    
    const handleMouseUp = () => {
      isDragging.current = false;
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Calculate saturation and lightness from position
    // Left = 0% saturation (gray), Right = 100% saturation
    // Top = 100% lightness (white), Bottom = 0% lightness (black)
    const newSaturation = (x / rect.width) * 100;
    const newLightness = 100 - ((y / rect.height) * 100);
    
    setSaturation(Math.max(0, Math.min(100, newSaturation)));
    setLightness(Math.max(0, Math.min(100, newLightness)));
  };

  const handleMouseDown = (e) => {
    isDragging.current = true;
    handleCanvasClick(e);
  };

  const handleHueChange = (e) => {
    setHue(e.target.value);
  };

  const handleSaveColor = () => {
    const newColor = {
      hex: currentColor,
      name: colorName || currentColor
    };
    
    if (!savedColors.find(c => c.hex.toLowerCase() === newColor.hex.toLowerCase())) {
      const updatedColors = [...savedColors, newColor];
      setSavedColors(updatedColors);
      onColorSelect(updatedColors);
    }
    setColorName("");
  };

  const handleRemoveColor = (hex) => {
    const filtered = savedColors.filter(c => c.hex.toLowerCase() !== hex.toLowerCase());
    setSavedColors(filtered);
    onColorSelect(filtered);
  };

  const handleAddToList = () => {
    onColorSelect([...savedColors, { hex: currentColor, name: colorName || currentColor }]);
    setColorName("");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-[500px] max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Color Picker</h3>
          <Button variant="ghost" size="sm" onClick={onClose} className="cursor-pointer">
            <X size={20} />
          </Button>
        </div>

        {/* Hue Slider */}
        <div className="mb-4">
          <Label>Hue</Label>
          <div className="relative h-4 rounded-full mt-1" style={{
            background: 'linear-gradient(to right, #ff0000, #ff8800, #ffff00, #00ff00, #00ffff, #0088ff, #0000ff, #8800ff, #ff00ff, #ff0000)'
          }}>
            <input
              type="range"
              min="0"
              max="360"
              value={hue}
              onChange={handleHueChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>
        </div>

        {/* Color Picker Area */}
        <div className="mb-4">
          <Label>Saturation / Lightness</Label>
          <div className="relative mt-1">
            <canvas
              ref={pickerRef}
              width="460"
              height="200"
              className="w-full h-48 rounded-lg cursor-crosshair border"
              onMouseDown={handleMouseDown}
            />
            {/* Indicator dot */}
            <div
              className="absolute w-4 h-4 border-2 border-white rounded-full shadow-lg pointer-events-none"
              style={{
                left: `${saturation}%`,
                top: `${100 - lightness}%`,
                backgroundColor: currentColor,
                transform: 'translate(-50%, -50%)'
              }}
            />
          </div>
        </div>

        {/* Current Color Preview */}
        <div className="flex items-center gap-4 mb-4 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
          <div
            className="w-20 h-20 rounded-lg border-2 shadow-inner"
            style={{ backgroundColor: currentColor }}
          />
          <div className="flex-grow space-y-2">
            <div className="flex items-center gap-2">
              <Label>Selected:</Label>
              <Input
                type="text"
                value={currentColor}
                onChange={(e) => {
                  const hex = e.target.value;
                  if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
                    // Parse hex to HSL (simplified)
                    setCurrentColorFromHex(hex);
                  }
                }}
                className="font-mono flex-grow"
              />
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="text"
                value={colorName}
                onChange={(e) => setColorName(e.target.value)}
                placeholder="Color name (e.g., Ocean Blue)"
                className="flex-grow"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mb-4">
          <Button 
            onClick={handleAddToList}
            className="flex-grow cursor-pointer bg-blue-600 hover:bg-blue-700"
          >
            <Plus size={16} className="mr-1" /> Add to Colors
          </Button>
          <Button 
            onClick={handleSaveColor}
            variant="outline"
            className="cursor-pointer"
          >
            <Save size={16} className="mr-1" /> Save to Library
          </Button>
        </div>

        {/* Saved Colors */}
        {savedColors.length > 0 && (
          <div>
            <Label>Your Saved Colors ({savedColors.length})</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {savedColors.map((color, idx) => (
                <div 
                  key={idx}
                  className="relative group"
                >
                  <div
                    className="w-12 h-12 rounded-lg border-2 cursor-pointer hover:scale-105 transition-transform"
                    style={{ backgroundColor: color.hex }}
                    title={color.name}
                    onClick={() => {
                      setCurrentColorFromHex(color.hex);
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveColor(color.hex)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4 flex justify-end">
          <Button onClick={onClose} className="cursor-pointer">
            Done
          </Button>
        </div>
      </div>
    </div>
  );
};

// Helper function to set color from hex
function setCurrentColorFromHex(hex) {
  // This would need to be handled by parent or we need a different approach
  // For now, we'll use a simpler approach
}

export default ColorPickerModal;
