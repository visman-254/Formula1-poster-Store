import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";

const ColorPicker = ({ onColorSelect, existingColors = [] }) => {
  const [selectedColor, setSelectedColor] = useState("#000000");
  const [colorName, setColorName] = useState("");
  const [savedColors, setSavedColors] = useState(existingColors);

  const presetColors = [
    "#000000", "#FFFFFF", "#FF0000", "#00FF00", "#0000FF", "#FFFF00",
    "#FF00FF", "#00FFFF", "#FFA500", "#8000CB", "#A080", "#FFC52A2A",
    "#808080", "#FFD700", "#C0C0C0", "#008080", "#4B0082", "#E6E6FA"
  ];

  const handleSaveColor = () => {
    const newColor = {
      hex: selectedColor,
      name: colorName || selectedColor
    };
    
    // Check if color already exists
    if (!savedColors.find(c => c.hex === newColor.hex)) {
      setSavedColors([...savedColors, newColor]);
      onColorSelect([...savedColors, newColor]);
    }
    setColorName("");
  };

  const handleRemoveColor = (hex) => {
    const filtered = savedColors.filter(c => c.hex !== hex);
    setSavedColors(filtered);
    onColorSelect(filtered);
  };

  const handlePresetClick = (color) => {
    setSelectedColor(color);
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-white dark:bg-gray-800">
      <div className="space-y-2">
        <Label>Choose Color</Label>
        
        {/* Color Input and Preview */}
        <div className="flex gap-2 items-center">
          <Input
            type="color"
            value={selectedColor}
            onChange={(e) => setSelectedColor(e.target.value)}
            className="h-12 w-20 p-1 cursor-pointer"
          />
          <Input
            type="text"
            value={selectedColor}
            onChange={(e) => setSelectedColor(e.target.value)}
            className="flex-grow font-mono"
            placeholder="#000000"
          />
          <div 
            className="h-12 w-12 border-2 rounded"
            style={{ backgroundColor: selectedColor }}
          />
        </div>
      </div>

      {/* Preset Colors */}
      <div className="space-y-2">
        <Label>Preset Colors</Label>
        <div className="flex flex-wrap gap-2">
          {presetColors.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => handlePresetClick(color)}
              className={`w-8 h-8 rounded-full border-2 hover:scale-110 transition-transform ${
                selectedColor === color ? "border-blue-500 ring-2 ring-blue-300" : "border-gray-300"
              }`}
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
      </div>

      {/* Save Custom Color */}
      <div className="space-y-2">
        <Label>Save Custom Color</Label>
        <div className="flex gap-2">
          <Input
            type="text"
            value={colorName}
            onChange={(e) => setColorName(e.target.value)}
            placeholder="Color name (e.g., Midnight Blue)"
            className="flex-grow"
          />
          <Button 
            type="button" 
            onClick={handleSaveColor}
            className="cursor-pointer"
          >
            Add
          </Button>
        </div>
      </div>

      {/* Saved Colors */}
      {savedColors.length > 0 && (
        <div className="space-y-2">
          <Label>Your Saved Colors</Label>
          <div className="flex flex-wrap gap-2">
            {savedColors.map((color, idx) => (
              <div 
                key={idx}
                className="relative group"
              >
                <div
                  className="w-10 h-10 rounded-full border-2 cursor-pointer border-gray-300"
                  style={{ backgroundColor: color.hex }}
                  title={color.name}
                  onClick={() => setSelectedColor(color.hex)}
                />
                <button
                  type="button"
                  onClick={() => handleRemoveColor(color.hex)}
                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={12} />
                </button>
                <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-xs whitespace-nowrap">
                  {color.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ColorPicker;
