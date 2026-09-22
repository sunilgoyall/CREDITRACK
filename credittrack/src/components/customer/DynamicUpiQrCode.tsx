import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { QrCode, Copy, Check, ExternalLink, Sparkles, Maximize2, X, AlertCircle } from 'lucide-react';
import { formatINR } from '../../lib/formatters';

interface DynamicUpiQrCodeProps {
  businessName: string;
  upiId?: string;
  amount: number;
  customerName: string;
  isOwner?: boolean;
  onUpdateUpiId?: (upiId: string) => Promise<void>;
}

export function DynamicUpiQrCode({
  businessName,
  upiId,
  amount,
  customerName,
  isOwner = false,
  onUpdateUpiId,
}: DynamicUpiQrCodeProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isEditingUpi, setIsEditingUpi] = useState(false);
  const [tempUpiId, setTempUpiId] = useState(upiId || '');
  const [isSavingUpi, setIsSavingUpi] = useState(false);

  // Active UPI ID
  const activeUpiId = (upiId || '').trim();

  // Construct UPI deep-link URI
  const encodedPn = encodeURIComponent(businessName || 'Merchant');
  const encodedTn = encodeURIComponent(`Udhaar settlement - ${customerName}`);
  const formattedAmount = amount > 0 ? amount.toFixed(2) : '';

  const upiUri = activeUpiId
    ? `upi://pay?pa=${encodeURIComponent(activeUpiId)}&pn=${encodedPn}${
        formattedAmount ? `&am=${formattedAmount}` : ''
      }&cu=INR&tn=${encodedTn}`
    : '';

  const handleCopyLink = () => {
    if (!upiUri) return;
    navigator.clipboard.writeText(upiUri);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyId = () => {
    if (!activeUpiId) return;
    navigator.clipboard.writeText(activeUpiId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleSaveUpi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempUpiId.trim() || !onUpdateUpiId) return;
    setIsSavingUpi(true);
    try {
      await onUpdateUpiId(tempUpiId.trim());
      setIsEditingUpi(false);
    } catch (err: any) {
      alert(err.message || 'Failed to update store UPI ID');
    } finally {
      setIsSavingUpi(false);
    }
  };

  return (
    <>
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                Instant UPI QR Code
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300">
                  Dynamic Balance
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Customer scans with GPay, PhonePe, Paytm or BHIM to pay instantly
              </p>
            </div>
          </div>

          {activeUpiId && (
            <button
              type="button"
              onClick={() => setIsFullscreen(true)}
              className="p-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white bg-slate-100 dark:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Show Fullscreen QR for Counter Display"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* If UPI ID is not configured yet */}
        {!activeUpiId ? (
          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 space-y-3">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs">
                <p className="font-bold text-amber-900 dark:text-amber-200">Store UPI ID Not Configured</p>
                <p className="text-amber-800/80 dark:text-amber-300/80 mt-0.5">
                  Set your store UPI ID (e.g. yourshop@okaxis or 9823411200@paytm) to enable automatic customer balance QR codes.
                </p>
              </div>
            </div>

            {isOwner && onUpdateUpiId && (
              <form onSubmit={handleSaveUpi} className="flex gap-2 pt-1">
                <input
                  type="text"
                  placeholder="Enter Store UPI ID (e.g. store@upi)"
                  value={tempUpiId}
                  onChange={(e) => setTempUpiId(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-800 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="submit"
                  disabled={isSavingUpi || !tempUpiId.trim()}
                  className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSavingUpi ? 'Saving...' : 'Set UPI ID'}
                </button>
              </form>
            )}
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 pt-1">
            {/* The QR Code Graphic */}
            <div
              onClick={() => setIsFullscreen(true)}
              className="p-3 bg-white rounded-2xl border-2 border-slate-200 dark:border-slate-700 shadow-sm cursor-pointer hover:border-emerald-500 transition-all shrink-0 flex flex-col items-center"
              title="Click to enlarge"
            >
              <QRCodeSVG
                value={upiUri}
                size={140}
                level="M"
                includeMargin={false}
              />
              <span className="text-[10px] font-bold text-slate-500 mt-2 flex items-center gap-1">
                <Maximize2 className="w-3 h-3" /> Tap to Enlarge
              </span>
            </div>

            {/* QR Metadata & Action Controls */}
            <div className="flex-1 space-y-3 w-full">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Embedded Amount
                  </span>
                  <span className="text-base font-black text-slate-900 dark:text-white block mt-0.5">
                    {amount > 0 ? formatINR(amount) : 'Any Amount'}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                      Payee UPI ID
                    </span>
                    {isOwner && onUpdateUpiId && !isEditingUpi && (
                      <button
                        type="button"
                        onClick={() => {
                          setTempUpiId(activeUpiId);
                          setIsEditingUpi(true);
                        }}
                        className="text-[10px] font-bold text-emerald-600 hover:underline cursor-pointer"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 truncate block mt-0.5">
                    {activeUpiId}
                  </span>
                </div>
              </div>

              {/* Edit UPI inline if requested */}
              {isEditingUpi && (
                <form onSubmit={handleSaveUpi} className="flex gap-2 p-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                  <input
                    type="text"
                    value={tempUpiId}
                    onChange={(e) => setTempUpiId(e.target.value)}
                    className="flex-1 px-2.5 py-1 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg"
                    placeholder="e.g. shopname@upi"
                  />
                  <button
                    type="submit"
                    disabled={isSavingUpi}
                    className="px-2.5 py-1 text-xs font-bold text-white bg-emerald-600 rounded-lg cursor-pointer"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingUpi(false)}
                    className="px-2 py-1 text-xs font-bold text-slate-500 rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                </form>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Link Copied!' : 'Copy Payment Link'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyId}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                >
                  {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedId ? 'UPI ID Copied' : 'Copy UPI ID'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsFullscreen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 rounded-lg border border-emerald-200 dark:border-emerald-800 transition-colors cursor-pointer"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Show Customer (Counter Mode)</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Fullscreen Counter Display Modal */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="relative w-full max-w-sm p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl text-center space-y-4">
            <button
              type="button"
              onClick={() => setIsFullscreen(false)}
              className="absolute right-4 top-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full bg-slate-100 dark:bg-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white">{businessName}</h2>
              <p className="text-xs text-slate-400">Scan & Pay Instant Udhaar Settlement</p>
            </div>

            <div className="p-4 bg-white rounded-2xl shadow-inner border border-slate-100 flex items-center justify-center mx-auto max-w-[240px]">
              <QRCodeSVG
                value={upiUri}
                size={200}
                level="Q"
                includeMargin={true}
              />
            </div>

            <div className="space-y-1">
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Total Amount Due</p>
              <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
                {amount > 0 ? formatINR(amount) : 'Open Amount'}
              </p>
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300 pt-1">
                For: {customerName}
              </p>
              <p className="text-[11px] text-slate-400 font-mono">UPI: {activeUpiId}</p>
            </div>

            <p className="text-[11px] text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
              Compatible with Google Pay, PhonePe, Paytm, BHIM & any UPI app
            </p>
          </div>
        </div>
      )}
    </>
  );
}
