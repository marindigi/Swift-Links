import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Download, Palette, Image as ImageIcon, Settings2, Trash2, Upload, Loader2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { uploadFile, getSignedUrl, deleteFile } from '../lib/storage';
import { auth } from '../lib/firebase';
import { toast } from 'react-hot-toast';

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
  const [fgColor, setFgColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [signedLogoUrl, setSignedLogoUrl] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [logoSize, setLogoSize] = useState(40);
  const [activeTab, setActiveTab] = useState<'colors' | 'logo' | 'settings'>('colors');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownload = () => {
    const svg = document.getElementById('qr-code-svg');
    if (svg) {
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.onload = () => {
        // Use higher resolution for download
        const scale = 4;
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        if (ctx) {
          ctx.fillStyle = bgColor;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        }
        const pngFile = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.href = pngFile;
        downloadLink.download = `qrcode-${Date.now()}.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      };
      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingLogo(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Authentication required');

      // Extract ID from URL if possible
      const urlId = url?.split('/').pop() || 'temp';

      // Delete old logo if it exists
      if (logoUrl) {
        await deleteFile(logoUrl);
      }

      const path = await uploadFile({
        featureName: 'qr-logos',
        itemId: urlId,
        file,
        userId: user.uid
      });

      setLogoUrl(path);
      const signedUrl = await getSignedUrl(path);
      setSignedLogoUrl(signedUrl);
      toast.success('Logo uploaded');
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload logo');
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const removeLogo = async () => {
    if (logoUrl) {
      try {
        await deleteFile(logoUrl);
      } catch (e) {}
    }
    setLogoUrl(null);
    setSignedLogoUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
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
              "relative w-full max-w-4xl rounded-[40px] shadow-2xl border overflow-hidden flex flex-col md:flex-row",
              theme === 'dark' ? "bg-[#0a0a0a] border-white/10" : "bg-white border-gray-100"
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Left Side: Preview */}
            <div className={cn(
              "flex-1 p-8 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r",
              theme === 'dark' ? "bg-white/5 border-white/10" : "bg-gray-50 border-gray-100"
            )}>
              <div className="p-8 bg-white rounded-[32px] shadow-2xl inline-block border border-gray-100 relative group">
                <QRCodeSVG
                  id="qr-code-svg"
                  value={url}
                  size={240}
                  level="H"
                  includeMargin={true}
                  fgColor={fgColor}
                  bgColor={bgColor}
                  imageSettings={signedLogoUrl ? {
                    src: signedLogoUrl,
                    x: undefined,
                    y: undefined,
                    height: logoSize,
                    width: logoSize,
                    excavate: true,
                  } : undefined}
                />
              </div>
              <p className="mt-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Live Preview</p>
            </div>

            {/* Right Side: Controls */}
            <div className="flex-1 p-8 flex flex-col h-[600px] md:h-auto overflow-y-auto">
              <div className="flex items-center justify-between mb-8">
                <h3 className={cn("text-2xl font-display font-bold", theme === 'dark' ? "text-white" : "text-gray-900")}>
                  QR Designer
                </h3>
                <button
                  onClick={onClose}
                  className={cn(
                    "p-2 rounded-xl transition-colors",
                    theme === 'dark' ? "hover:bg-white/5 text-gray-500 hover:text-white" : "hover:bg-gray-100 text-gray-400 hover:text-gray-900"
                  )}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex gap-2 mb-8 p-1 bg-gray-100 dark:bg-white/5 rounded-2xl">
                {[
                  { id: 'colors', icon: Palette, label: 'Colors' },
                  { id: 'logo', icon: ImageIcon, label: 'Logo' },
                  { id: 'settings', icon: Settings2, label: 'Settings' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                      activeTab === tab.id
                        ? "bg-brand text-white shadow-lg shadow-brand/20"
                        : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
                    )}
                  >
                    <tab.icon size={14} />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                ))}
              </div>

              <div className="flex-1 space-y-8">
                {activeTab === 'colors' && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Foreground Color</label>
                      <div className="flex items-center gap-4">
                        <input 
                          type="color" 
                          value={fgColor} 
                          onChange={(e) => setFgColor(e.target.value)}
                          className="w-12 h-12 rounded-xl border-none cursor-pointer bg-transparent"
                        />
                        <input 
                          type="text" 
                          value={fgColor} 
                          onChange={(e) => setFgColor(e.target.value)}
                          className={cn(
                            "flex-1 px-4 py-3 rounded-xl border font-mono text-sm focus:outline-none focus:ring-2 focus:ring-brand/50",
                            theme === 'dark' ? "bg-black/40 border-white/10 text-white" : "bg-gray-50 border-gray-200"
                          )}
                        />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Background Color</label>
                      <div className="flex items-center gap-4">
                        <input 
                          type="color" 
                          value={bgColor} 
                          onChange={(e) => setBgColor(e.target.value)}
                          className="w-12 h-12 rounded-xl border-none cursor-pointer bg-transparent"
                        />
                        <input 
                          type="text" 
                          value={bgColor} 
                          onChange={(e) => setBgColor(e.target.value)}
                          className={cn(
                            "flex-1 px-4 py-3 rounded-xl border font-mono text-sm focus:outline-none focus:ring-2 focus:ring-brand/50",
                            theme === 'dark' ? "bg-black/40 border-white/10 text-white" : "bg-gray-50 border-gray-200"
                          )}
                        />
                      </div>
                    </div>
                    <div className="pt-4 flex flex-wrap gap-2">
                      {['#000000', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'].map(color => (
                        <button
                          key={color}
                          onClick={() => setFgColor(color)}
                          className="w-8 h-8 rounded-full border border-white/10 shadow-sm transition-transform hover:scale-110"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}

                {activeTab === 'logo' && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                    <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Center Logo</label>
                      {logoUrl ? (
                        <div className={cn(
                          "p-4 rounded-2xl border flex items-center justify-between gap-4",
                          theme === 'dark' ? "bg-white/5 border-white/10" : "bg-gray-50 border-gray-100"
                        )}>
                          <div className="flex items-center gap-3">
                            {signedLogoUrl && <img src={signedLogoUrl} alt="Logo" className="w-10 h-10 rounded-lg object-cover border border-white/10" />}
                            <span className="text-xs font-bold text-gray-500">Custom Logo Active</span>
                          </div>
                          <button 
                            onClick={removeLogo}
                            className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploadingLogo}
                          className={cn(
                            "w-full py-8 rounded-3xl border-2 border-dashed flex flex-col items-center justify-center gap-3 transition-all group",
                            theme === 'dark' ? "border-white/10 hover:border-brand/50 hover:bg-brand/5" : "border-gray-200 hover:border-brand/50 hover:bg-brand/5"
                          )}
                        >
                          <div className="w-12 h-12 rounded-2xl bg-brand/10 text-brand flex items-center justify-center group-hover:scale-110 transition-transform">
                            {isUploadingLogo ? <Loader2 className="animate-spin" size={24} /> : <Upload size={24} />}
                          </div>
                          <span className="text-xs font-bold text-gray-500">
                            {isUploadingLogo ? 'Uploading...' : 'Click to upload logo'}
                          </span>
                        </button>
                      )}
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleLogoUpload} 
                        accept="image/*" 
                        className="hidden" 
                      />
                    </div>

                    {logoUrl && (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Logo Size</label>
                          <span className="text-[10px] font-mono text-brand font-bold">{logoSize}px</span>
                        </div>
                        <input 
                          type="range" 
                          min="20" 
                          max="80" 
                          value={logoSize} 
                          onChange={(e) => setLogoSize(parseInt(e.target.value))}
                          className="w-full h-1.5 bg-gray-200 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-brand"
                        />
                      </div>
                    )}
                  </motion.div>
                )}

                {activeTab === 'settings' && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                    <div className="p-6 rounded-3xl bg-brand/5 border border-brand/10">
                      <h4 className="text-xs font-black uppercase tracking-widest text-brand mb-2">Pro Tip</h4>
                      <p className="text-[11px] text-gray-500 leading-relaxed">
                        High contrast between foreground and background colors ensures better scanability. Always test your custom QR code before sharing.
                      </p>
                    </div>
                    
                    <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Error Correction</label>
                      <div className="grid grid-cols-2 gap-3">
                        {['L', 'M', 'Q', 'H'].map(level => (
                          <button
                            key={level}
                            className={cn(
                              "py-3 rounded-xl text-xs font-bold border transition-all",
                              level === 'H' ? "bg-brand/10 border-brand text-brand" : "border-white/10 text-gray-500 opacity-50 cursor-not-allowed"
                            )}
                            disabled={level !== 'H'}
                          >
                            Level {level}
                          </button>
                        ))}
                      </div>
                      <p className="text-[9px] text-gray-500 italic">Level H (High) is recommended when using logos.</p>
                    </div>
                  </motion.div>
                )}
              </div>

              <div className="mt-8 pt-8 border-t border-gray-100 dark:border-white/10">
                <button
                  onClick={handleDownload}
                  className="w-full py-4 bg-brand text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] hover:bg-brand-hover transition-all shadow-lg shadow-brand/20 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Download size={18} />
                  Download High-Res PNG
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
