import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Download, Upload, Image as ImageIcon, Palette, Settings2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface QrCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string | null;
  theme: 'light' | 'dark';
}

type ErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H';

export const QrCodeModal: React.FC<QrCodeModalProps> = ({ isOpen, onClose, url, theme }) => {
  const [logo, setLogo] = useState<string | null>(null);
  const [fgColor, setFgColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [errorCorrectionLevel, setErrorCorrectionLevel] = useState<ErrorCorrectionLevel>('H');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDownload = () => {
    const svg = document.getElementById('qr-code-svg');
    if (svg) {
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
        const pngFile = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.href = pngFile;
        downloadLink.download = `qrcode-${Date.now()}.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      };
      img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
    }
  };

  if (!isOpen || !url) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className={cn(
            "relative w-full max-w-md p-8 rounded-[32px] shadow-2xl border overflow-hidden flex flex-col max-h-[90vh]",
            theme === 'dark' ? "bg-[#0a0a0a] border-white/10" : "bg-white border-gray-100"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className={cn(
              "absolute top-4 right-4 p-2 rounded-xl transition-colors z-10",
              theme === 'dark' ? "hover:bg-white/5 text-gray-500 hover:text-white" : "hover:bg-gray-100 text-gray-400 hover:text-gray-900"
            )}
          >
            <X size={20} />
          </button>

          <h3 className={cn("text-2xl font-display font-bold mb-6 text-center shrink-0", theme === 'dark' ? "text-white" : "text-gray-900")}>
            Customize QR Code
          </h3>

          <div className="flex-1 overflow-y-auto pr-2 -mr-2 space-y-8 pb-4">
            <div className="flex justify-center">
              <div className="p-6 bg-white rounded-3xl shadow-lg inline-block border border-gray-100">
                <QRCodeSVG
                  id="qr-code-svg"
                  value={url}
                  size={200}
                  level={errorCorrectionLevel}
                  includeMargin={true}
                  fgColor={fgColor}
                  bgColor={bgColor}
                  imageSettings={logo ? {
                    src: logo,
                    x: undefined,
                    y: undefined,
                    height: 40,
                    width: 40,
                    excavate: true,
                  } : undefined}
                />
              </div>
            </div>

            <div className="space-y-6">
              {/* Logo Upload */}
              <div className="space-y-3">
                <label className="text-[10px] text-gray-500 uppercase font-bold tracking-widest block">Logo</label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                    id="logo-upload"
                  />
                  <label
                    htmlFor="logo-upload"
                    className={cn(
                      "w-full py-3 rounded-xl font-bold border-2 border-dashed transition-all flex items-center justify-center gap-2 cursor-pointer",
                      theme === 'dark' 
                        ? "border-white/20 text-gray-400 hover:border-brand hover:text-brand hover:bg-white/5" 
                        : "border-gray-200 text-gray-500 hover:border-brand hover:text-brand hover:bg-gray-50"
                    )}
                  >
                    {logo ? (
                      <>
                        <ImageIcon size={18} />
                        <span>Change Logo</span>
                      </>
                    ) : (
                      <>
                        <Upload size={18} />
                        <span>Add Logo</span>
                      </>
                    )}
                  </label>
                </div>
                {logo && (
                  <div className="flex justify-center">
                    <button
                      onClick={() => setLogo(null)}
                      className="text-xs text-red-500 hover:text-red-600 font-medium"
                    >
                      Remove Logo
                    </button>
                  </div>
                )}
              </div>

              {/* Colors */}
              <div className="space-y-3">
                <label className="text-[10px] text-gray-500 uppercase font-bold tracking-widest flex items-center gap-2">
                  <Palette size={12} />
                  Colors
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className={cn("text-xs font-medium", theme === 'dark' ? "text-gray-400" : "text-gray-600")}>Foreground</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={fgColor}
                        onChange={(e) => setFgColor(e.target.value)}
                        className="w-8 h-8 rounded cursor-pointer border-0 p-0 bg-transparent"
                      />
                      <input
                        type="text"
                        value={fgColor}
                        onChange={(e) => setFgColor(e.target.value)}
                        className={cn(
                          "flex-1 px-3 py-1.5 rounded-lg text-sm border font-mono uppercase",
                          theme === 'dark' ? "bg-black/40 border-white/10 text-white" : "bg-gray-50 border-gray-200 text-gray-900"
                        )}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className={cn("text-xs font-medium", theme === 'dark' ? "text-gray-400" : "text-gray-600")}>Background</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={bgColor}
                        onChange={(e) => setBgColor(e.target.value)}
                        className="w-8 h-8 rounded cursor-pointer border-0 p-0 bg-transparent"
                      />
                      <input
                        type="text"
                        value={bgColor}
                        onChange={(e) => setBgColor(e.target.value)}
                        className={cn(
                          "flex-1 px-3 py-1.5 rounded-lg text-sm border font-mono uppercase",
                          theme === 'dark' ? "bg-black/40 border-white/10 text-white" : "bg-gray-50 border-gray-200 text-gray-900"
                        )}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Advanced Settings Toggle */}
              <div>
                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className={cn(
                    "flex items-center gap-2 text-xs font-bold transition-colors",
                    theme === 'dark' ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-gray-900"
                  )}
                >
                  <Settings2 size={14} />
                  {showAdvanced ? 'Hide Advanced Settings' : 'Show Advanced Settings'}
                </button>
              </div>

              {/* Advanced Settings */}
              <AnimatePresence>
                {showAdvanced && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-2 space-y-3">
                      <label className="text-[10px] text-gray-500 uppercase font-bold tracking-widest block">Error Correction Level</label>
                      <div className="grid grid-cols-4 gap-2">
                        {(['L', 'M', 'Q', 'H'] as ErrorCorrectionLevel[]).map((level) => (
                          <button
                            key={level}
                            onClick={() => setErrorCorrectionLevel(level)}
                            className={cn(
                              "py-2 rounded-lg text-xs font-bold border transition-all",
                              errorCorrectionLevel === level
                                ? "bg-brand border-brand text-white"
                                : theme === 'dark'
                                  ? "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
                                  : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                            )}
                          >
                            {level}
                          </button>
                        ))}
                      </div>
                      <p className="text-[10px] text-gray-500">
                        Higher levels allow the QR code to be read even if it is partially obscured or damaged. Level H is recommended when using a logo.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="pt-6 mt-auto shrink-0 border-t border-gray-100 dark:border-white/10">
            <button
              onClick={handleDownload}
              className="w-full py-4 bg-brand text-white rounded-2xl font-bold hover:bg-brand-hover transition-all shadow-lg shadow-brand/20 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Download size={20} />
              Download PNG
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
