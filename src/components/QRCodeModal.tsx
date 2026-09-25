import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Copy, Download, Maximize2, Minimize2, X, Check, ExternalLink, QrCode as QrIcon } from 'lucide-react';
import { storage } from '../services/storage';
import { generateTaskDirectUrl, generateGameDirectUrl } from '../services/taskLink';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  type: 'task' | 'game' | 'class';
  codeId: string;
  classNameLabel?: string;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  type,
  codeId,
  classNameLabel,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [isProjectorMode, setIsProjectorMode] = useState(false);

  // Generate target URL containing exact task data
  const targetTask = type === 'task' ? storage.getTaskById(codeId) : null;
  const targetUrl = type === 'game' 
    ? generateGameDirectUrl(codeId) 
    : generateTaskDirectUrl(codeId, targetTask);

  useEffect(() => {
    if (isOpen && targetUrl) {
      QRCode.toDataURL(targetUrl, {
        width: 480,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('Error generating QR', err));
    }
  }, [isOpen, targetUrl]);

  if (!isOpen) return null;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(targetUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback prompt
      window.prompt('Sao chép đường dẫn tham gia:', targetUrl);
    }
  };

  const handleDownloadQR = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    const cleanTitle = title.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30);
    a.download = `QR_${type}_${cleanTitle}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm transition-all duration-200 ${isProjectorMode ? 'p-0' : ''}`}>
      <div 
        className={`bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden transition-all duration-300 flex flex-col ${
          isProjectorMode 
            ? 'w-full h-full max-w-none rounded-none justify-between p-8 bg-gradient-to-b from-slate-900 via-slate-900 to-indigo-950 text-white' 
            : 'max-w-md w-full'
        }`}
      >
        {/* Header */}
        <div className={`flex items-start justify-between p-5 border-b ${isProjectorMode ? 'border-slate-800' : 'border-slate-100'}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${isProjectorMode ? 'bg-indigo-500/20 text-indigo-300' : 'bg-indigo-50 text-indigo-600'}`}>
              <QrIcon className="w-6 h-6" />
            </div>
            <div>
              <h3 className={`font-display font-bold leading-tight ${isProjectorMode ? 'text-2xl text-white' : 'text-lg text-slate-900'}`}>
                {type === 'game' ? 'Mã QR Trò Chơi Củng Cố' : 'Mã QR Nhiệm Vụ Học Tập'}
              </h3>
              <p className={`text-xs mt-0.5 ${isProjectorMode ? 'text-indigo-200 text-sm' : 'text-slate-500'}`}>
                {classNameLabel ? `Dành cho: ${classNameLabel}` : 'Quét bằng camera điện thoại hoặc Zalo'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsProjectorMode(!isProjectorMode)}
              className={`p-2 rounded-lg transition-colors text-xs flex items-center gap-1 font-medium ${
                isProjectorMode 
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white' 
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
              title={isProjectorMode ? 'Thu nhỏ cửa sổ' : 'Phóng to chiếu lên bảng/máy chiếu'}
            >
              {isProjectorMode ? (
                <>
                  <Minimize2 className="w-4 h-4" />
                  <span>Thu nhỏ</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Chiếu bảng</span>
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors ${
                isProjectorMode ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-800'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className={`p-6 flex flex-col items-center text-center ${isProjectorMode ? 'my-auto py-2' : ''}`}>
          <div className="mb-3 max-w-sm">
            <h4 className={`font-semibold ${isProjectorMode ? 'text-3xl font-display text-white mb-2' : 'text-base text-slate-800'}`}>
              {title}
            </h4>
            {subtitle && (
              <p className={`text-xs mt-1 ${isProjectorMode ? 'text-slate-300 text-base max-w-xl mx-auto' : 'text-slate-500'}`}>
                {subtitle}
              </p>
            )}
          </div>

          {/* QR Code Container */}
          <div className={`p-4 bg-white rounded-2xl shadow-md border flex items-center justify-center my-3 transition-transform ${
            isProjectorMode 
              ? 'p-6 shadow-2xl scale-110 border-indigo-400/30 ring-8 ring-indigo-500/20' 
              : 'border-slate-200'
          }`}>
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="QR Code Lớp Học Số"
                className={`aspect-square object-contain ${isProjectorMode ? 'w-72 h-72 md:w-84 md:h-84' : 'w-56 h-56'}`}
              />
            ) : (
              <div className="w-56 h-56 flex items-center justify-center text-slate-400">
                Đang tạo mã QR...
              </div>
            )}
          </div>

          {/* Student Instructions */}
          <div className={`mt-2 py-2 px-4 rounded-xl max-w-md ${
            isProjectorMode 
              ? 'bg-white/10 backdrop-blur border border-white/10 text-emerald-300 text-lg font-medium' 
              : 'bg-emerald-50 text-emerald-800 text-xs font-medium border border-emerald-100'
          }`}>
            👉 MỞ LINK/QUÉT QR → NHẬP TÊN + LỚP → BẮT ĐẦU
            <div className={`text-[11px] font-normal mt-0.5 ${isProjectorMode ? 'text-slate-300 text-sm' : 'text-emerald-700'}`}>
              Không yêu cầu tài khoản hay đăng nhập Google
            </div>
          </div>

          {/* Direct Link Display */}
          {!isProjectorMode && (
            <div className="w-full mt-4 flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs">
              <span className="text-slate-400 shrink-0 font-medium">Link:</span>
              <span className="truncate text-slate-700 font-mono text-[11px] text-left flex-1 select-all">
                {targetUrl}
              </span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className={`p-4 border-t flex flex-wrap items-center justify-between gap-3 ${
          isProjectorMode ? 'border-slate-800 bg-slate-900/60' : 'border-slate-100 bg-slate-50/50'
        }`}>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>Đã sao chép link!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Sao chép Link</span>
                </>
              )}
            </button>

            <button
              onClick={handleDownloadQR}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                isProjectorMode 
                  ? 'border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200' 
                  : 'border-slate-200 bg-white hover:bg-slate-100 text-slate-700 shadow-xs'
              }`}
            >
              <Download className="w-4 h-4" />
              <span>Tải ảnh QR</span>
            </button>
          </div>

          <a
            href={targetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-1 text-xs font-medium transition-colors hover:underline ${
              isProjectorMode ? 'text-indigo-300 hover:text-indigo-200' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Mở trang học sinh</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};
