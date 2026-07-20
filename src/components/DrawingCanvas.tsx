import React, { useRef, useState, useEffect } from 'react';
import { Palette, Trash2, Check, X, Brush } from 'lucide-react';

interface DrawingCanvasProps {
  initialDataUrl?: string;
  onSave: (dataUrl: string) => void;
  onCancel: () => void;
}

export default function DrawingCanvas({ initialDataUrl, onSave, onCancel }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#4f46e5'); // default purple-indigo
  const [brushSize, setBrushSize] = useState(5);

  const colors = [
    '#000000', // Black
    '#ef4444', // Red
    '#f97316', // Orange
    '#f59e0b', // Yellow
    '#10b981', // Green
    '#3b82f6', // Blue
    '#4f46e5', // Indigo
    '#a855f7', // Purple
    '#ec4899', // Pink
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Use specific client dimension to avoid canvas scaling issues
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    const context = canvas.getContext('2d');
    if (!context) return;

    context.scale(2, 2);
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.strokeStyle = color;
    context.lineWidth = brushSize;
    contextRef.current = context;

    // Draw solid white background so image export is clean
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, rect.width, rect.height);

    // Load initial drawing if exists
    if (initialDataUrl) {
      const image = new Image();
      image.onload = () => {
        context.drawImage(image, 0, 0, rect.width, rect.height);
      };
      image.src = initialDataUrl;
    }
  }, []);

  // Update stroke style when color or brush size changes
  useEffect(() => {
    if (contextRef.current) {
      contextRef.current.strokeStyle = color;
      contextRef.current.lineWidth = brushSize;
    }
  }, [color, brushSize]);

  const startDrawing = ({ nativeEvent }: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    let offsetX, offsetY;
    const canvas = canvasRef.current;
    if (!canvas) return;

    if ('touches' in nativeEvent) {
      const touch = nativeEvent.touches[0];
      const rect = canvas.getBoundingClientRect();
      offsetX = touch.clientX - rect.left;
      offsetY = touch.clientY - rect.top;
    } else {
      offsetX = nativeEvent.offsetX;
      offsetY = nativeEvent.offsetY;
    }

    if (contextRef.current) {
      contextRef.current.beginPath();
      contextRef.current.moveTo(offsetX, offsetY);
      setIsDrawing(true);
    }
  };

  const draw = ({ nativeEvent }: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    
    let offsetX, offsetY;
    const canvas = canvasRef.current;
    if (!canvas) return;

    if ('touches' in nativeEvent) {
      const touch = nativeEvent.touches[0];
      const rect = canvas.getBoundingClientRect();
      offsetX = touch.clientX - rect.left;
      offsetY = touch.clientY - rect.top;
      // Prevent scrolling while drawing on touch devices
      if (nativeEvent.cancelable) nativeEvent.preventDefault();
    } else {
      offsetX = nativeEvent.offsetX;
      offsetY = nativeEvent.offsetY;
    }

    if (contextRef.current) {
      contextRef.current.lineTo(offsetX, offsetY);
      contextRef.current.stroke();
    }
  };

  const stopDrawing = () => {
    if (contextRef.current) {
      contextRef.current.closePath();
    }
    setIsDrawing(false);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    const context = contextRef.current;
    if (!canvas || !context) return;

    const rect = canvas.getBoundingClientRect();
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, rect.width, rect.height);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Save as standard png base64
    const dataUrl = canvas.toDataURL('image/png');
    onSave(dataUrl);
  };

  return (
    <div className="flex flex-col bg-[#F9F7F2] border border-[#E2DCC8] rounded-2xl overflow-hidden shadow-xs h-full font-sans" dir="rtl">
      {/* Canvas Toolbars */}
      <div className="flex flex-wrap items-center justify-between p-3 bg-white border-b border-[#E2DCC8] gap-2">
        {/* Colors Palette */}
        <div className="flex items-center space-x-1.5 space-x-reverse overflow-x-auto pb-1 max-w-full">
          <Palette className="w-4 h-4 text-gray-400 mr-1 shrink-0" />
          {colors.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={`w-6 h-6 rounded-full border shrink-0 transition-transform ${
                color === c ? 'scale-125 border-[#5A5A40] shadow-xs' : 'border-gray-200'
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>

        {/* Brush Size Slider */}
        <div className="flex items-center space-x-2 space-x-reverse">
          <Brush className="w-4 h-4 text-[#8B9D83]" />
          <input
            type="range"
            min="1"
            max="20"
            value={brushSize}
            onChange={(e) => setBrushSize(parseInt(e.target.value))}
            className="w-20 h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-[#8B9D83]"
          />
          <span className="text-xs font-mono text-gray-500 w-4 text-center">{brushSize}</span>
        </div>
      </div>

      {/* Actual Drawing Board */}
      <div className="relative flex-grow bg-white min-h-[300px]">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full h-full block touch-none cursor-crosshair"
        />
      </div>

      {/* Bottom Actions */}
      <div className="flex items-center justify-between p-3 bg-[#F0EDE4] border-t border-[#E2DCC8]">
        <button
          onClick={handleClear}
          className="flex items-center space-x-1 space-x-reverse px-3 py-1.5 text-xs font-medium text-[#D4A373] hover:bg-[#FAEDCD] rounded-lg transition-colors cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>مسح اللوحة</span>
        </button>

        <div className="flex items-center space-x-2 space-x-reverse">
          <button
            onClick={onCancel}
            className="flex items-center space-x-1 space-x-reverse px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-[#E2DCC8] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>إلغاء</span>
          </button>
          
          <button
            onClick={handleSave}
            className="flex items-center space-x-1 space-x-reverse px-4 py-1.5 text-xs font-semibold text-white bg-[#8B9D83] hover:bg-[#5A5A40] shadow-xs rounded-lg transition-colors cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            <span>حفظ الرسمة</span>
          </button>
        </div>
      </div>
    </div>
  );
}
