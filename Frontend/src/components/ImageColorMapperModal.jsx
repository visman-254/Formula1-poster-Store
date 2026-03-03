import { useState, useEffect, useMemo } from "react";
import { X, Upload, Check, Wand2, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ImageColorMapperModal = ({ 
  isOpen, 
  onClose, 
  images = [], 
  colors = [], 
  storages = [],
  rams = [],
  onMappingSave 
}) => {
  // Generate all combinations: colors × storages × rams
  const combinations = useMemo(() => {
    const result = [];
    const colorList = colors.length > 0 ? colors : [{ hex: '#000000', name: 'Default' }];
    const storageList = storages.length > 0 ? storages : [''];
    const ramList = rams.length > 0 ? rams : [''];
    
    colorList.forEach((color, colorIdx) => {
      storageList.forEach((storage, storageIdx) => {
        ramList.forEach((ram, ramIdx) => {
          result.push({
            id: `${colorIdx}-${storageIdx}-${ramIdx}`,
            color,
            storage,
            ram,
            colorIdx,
            storageIdx,
            ramIdx
          });
        });
      });
    });
    return result;
  }, [colors, storages, rams]);

  // Each combination gets an image index assigned (-1 = no image)
  const [mapping, setMapping] = useState({});
  
  // Initialize mapping - auto-assign images in order
  useEffect(() => {
    if (!isOpen) return;
    
    const initialMapping = {};
    combinations.forEach((combo, idx) => {
      initialMapping[combo.id] = idx < images.length ? idx : -1;
    });
    setMapping(initialMapping);
  }, [combinations, images, isOpen]);

  if (!isOpen) return null;

  const handleImageSelect = (comboId, imageIdx) => {
    setMapping(prev => ({
      ...prev,
      [comboId]: imageIdx
    }));
  };

  // Auto-match by color name similarity
  const autoMatch = () => {
    const newMapping = {};
    combinations.forEach((combo) => {
      const colorName = (combo.color.name || combo.color.hex || '').toLowerCase();
      const storageStr = (combo.storage || '').toLowerCase();
      const ramStr = (combo.ram || '').toLowerCase();
      
      let bestMatch = -1;
      let bestScore = 0;
      
      images.forEach((img, imgIdx) => {
        const imgName = (img.name || '').toLowerCase();
        let score = 0;
        
        // Match by color name
        if (colorName.includes(imgName) || imgName.includes(colorName.replace('#', ''))) {
          score = 100;
        }
        // Match by color + storage
        if (score === 0 && (colorName.includes('black') || colorName.includes('white') || colorName.includes('silver'))) {
          if (imgName.includes(colorName.split(' ')[0]) || imgName.includes(colorName.replace('#', '').substring(0, 3))) {
            score = 80;
          }
        }
        // Match just by storage in image name
        if (storageStr && imgName.includes(storageStr.replace('gb', '').replace('tb', 't'))) {
          score = Math.max(score, 50);
        }
        
        if (score > bestScore) {
          bestScore = score;
          bestMatch = imgIdx;
        }
      });
      
      newMapping[combo.id] = bestMatch;
    });
    setMapping(newMapping);
  };

  // Assign images in sequential order (1-to-1 mapping)
  const sequentialAssign = () => {
    const newMapping = {};
    combinations.forEach((combo, idx) => {
      newMapping[combo.id] = idx < images.length ? idx : -1;
    });
    setMapping(newMapping);
  };

  const handleSave = () => {
    // Convert mapping to array format keyed by combination id
    const mappingResult = {};
    combinations.forEach((combo) => {
      const imgIdx = mapping[combo.id];
      if (imgIdx >= 0 && images[imgIdx]) {
        mappingResult[combo.id] = images[imgIdx];
      }
    });
    onMappingSave(mappingResult);
    onClose();
  };

  const expectedCount = combinations.length;
  const assignedCount = Object.values(mapping).filter(idx => idx >= 0).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[85vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h3 className="text-lg font-semibold">Map Images to Variants</h3>
            <p className="text-sm text-gray-500">
              {expectedCount} variants • {images.length} images uploaded • {assignedCount} assigned
            </p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4 overflow-y-auto max-h-[60vh]">
          {expectedCount === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No variants defined. Add colors, storage, and RAM first.
            </div>
          ) : images.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No images uploaded. Upload {expectedCount} images (one per variant) first.
            </div>
          ) : (
            <>
              {/* Action buttons */}
              <div className="flex justify-between gap-2 mb-4">
                <div className="flex gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={sequentialAssign}
                    className="cursor-pointer"
                    title="Assign images in order"
                  >
                    <Image className="w-4 h-4 mr-2" />
                    Sequential
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={autoMatch}
                    className="cursor-pointer"
                  >
                    <Wand2 className="w-4 h-4 mr-2" />
                    Auto-Match
                  </Button>
                </div>
                <p className="text-xs text-gray-500 self-center">
                  Click an image to assign it to each variant
                </p>
              </div>
              
              {/* Variant list with image selection */}
              <div className="space-y-2">
                {combinations.map((combo, comboIdx) => {
                  const currentImgIdx = mapping[combo.id] ?? -1;
                  const currentImg = currentImgIdx >= 0 ? images[currentImgIdx] : null;
                  
                  return (
                    <div 
                      key={combo.id} 
                      className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      {/* Variant info */}
                      <div className="flex items-center gap-3 min-w-[200px]">
                        <div 
                          className="w-8 h-8 rounded border flex-shrink-0"
                          style={{ backgroundColor: combo.color.hex || '#000000' }}
                        />
                        <div>
                          <p className="font-medium text-sm">
                            {combo.color.name || combo.color.hex || 'Default'}
                            {combo.storage && ` • ${combo.storage}`}
                            {combo.ram && ` • ${combo.ram}`}
                          </p>
                          <p className="text-xs text-gray-500">
                            #{comboIdx + 1}
                          </p>
                        </div>
                      </div>
                      
                      {/* Arrow */}
                      <div className="text-gray-400">→</div>
                      
                      {/* Image selection */}
                      <div className="flex gap-1 flex-wrap flex-1">
                        <button
                          onClick={() => handleImageSelect(combo.id, -1)}
                          className={`w-12 h-12 rounded border-2 flex items-center justify-center text-xs transition-colors ${
                            currentImgIdx === -1 
                              ? 'border-red-500 bg-red-50 text-red-500' 
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                          title="No image"
                        >
                          ✕
                        </button>
                        {images.map((img, imgIdx) => (
                          <button
                            key={imgIdx}
                            onClick={() => handleImageSelect(combo.id, imgIdx)}
                            className={`w-12 h-12 rounded border-2 overflow-hidden transition-all ${
                              currentImgIdx === imgIdx 
                                ? 'border-green-500 ring-2 ring-green-200 scale-105' 
                                : 'border-gray-300 hover:border-gray-400'
                            }`}
                            title={`Image ${imgIdx + 1}`}
                          >
                            <img 
                              src={img.preview} 
                              alt={`Img ${imgIdx + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
        
        <div className="flex justify-between items-center p-4 border-t">
          <p className="text-sm text-gray-500">
            {assignedCount} of {expectedCount} variants have images
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="cursor-pointer">
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              className="cursor-pointer"
              disabled={assignedCount === 0}
            >
              <Check className="w-4 h-4 mr-2" />
              Save Mapping
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageColorMapperModal;
