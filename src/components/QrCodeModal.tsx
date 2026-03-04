import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Download, Upload, Image as ImageIcon } from 'lucide-react';
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

export const QrCodeModal: React.FC<QrCodeModalProps> = ({ isOpen, onClose, url, theme }) => {
  const [logo, setLogo] = useState<string | null>(null);

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

  return (
    <AnimatePresence>
      {isOpen && url && (
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
              "relative w-full max-w-sm p-8 rounded-[32px] shadow-2xl text-center border overflow-hidden",
              theme === 'dark' ? "bg-[#0a0a0a] border-white/10" : "bg-white border-gray-100"
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className={cn(
                "absolute top-4 right-4 p-2 rounded-xl transition-colors",
                theme === 'dark' ? "hover:bg-white/5 text-gray-500 hover:text-white" : "hover:bg-gray-100 text-gray-400 hover:text-gray-900"
              )}
            >
              <X size={20} />
            </button>

            <h3 className={cn("text-2xl font-display font-bold mb-8", theme === 'dark' ? "text-white" : "text-gray-900")}>
              QR Code
            </h3>

            <div className="flex flex-col items-center justify-center space-y-8">
              <div className="p-6 bg-white rounded-3xl shadow-lg inline-block border border-gray-100">
                <QRCodeSVG
                  id="qr-code-svg"
                  value={url}
                  size={200}
                  level="H"
                  includeMargin={true}
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

              <div className="w-full space-y-3">
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
                  <button
                    onClick={() => setLogo(null)}
                    className="text-xs text-red-500 hover:text-red-600 font-medium"
                  >
                    Remove Logo
                  </button>
                )}
              </div>

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
      )}
    </AnimatePresence>
  );
};
