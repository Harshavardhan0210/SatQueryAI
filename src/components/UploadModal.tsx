import React, { useState } from 'react';
import { X, Upload, Image as ImageIcon, AlertCircle, CheckCircle } from 'lucide-react';
import { loadImageFromFile } from '../pipeline/sampleData';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadCustomPair: (
    before: ImageData,
    after: ImageData,
    meta: { name: string; beforeDate: string; afterDate: string }
  ) => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onUploadCustomPair,
}) => {
  const [beforeFile, setBeforeFile] = useState<File | null>(null);
  const [afterFile, setAfterFile] = useState<File | null>(null);
  const [beforePreview, setBeforePreview] = useState<string | null>(null);
  const [afterPreview, setAfterPreview] = useState<string | null>(null);
  const [sceneName, setSceneName] = useState<string>('Custom Satellite Crop');
  const [beforeDate, setBeforeDate] = useState<string>('2023-03-01');
  const [afterDate, setAfterDate] = useState<string>('2024-03-01');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleBeforeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBeforeFile(file);
      setBeforePreview(URL.createObjectURL(file));
      setErrorMsg(null);
    }
  };

  const handleAfterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAfterFile(file);
      setAfterPreview(URL.createObjectURL(file));
      setErrorMsg(null);
    }
  };

  const handleProcess = async () => {
    if (!beforeFile || !afterFile) {
      setErrorMsg('Please select both a BEFORE image and an AFTER image.');
      return;
    }

    try {
      setIsProcessing(true);
      setErrorMsg(null);

      const beforeImgData = await loadImageFromFile(beforeFile, 512);
      const afterImgData = await loadImageFromFile(afterFile, 512);

      onUploadCustomPair(beforeImgData, afterImgData, {
        name: sceneName || 'Custom Satellite Crop',
        beforeDate,
        afterDate,
      });

      onClose();
    } catch (err: any) {
      console.error('Error loading custom images:', err);
      setErrorMsg(err?.message || 'Failed to process custom images.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-sky-400" />
            <h2 className="text-sm font-bold font-mono tracking-wider text-slate-100 uppercase">
              Upload Custom Satellite Image Pair
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 font-mono text-xs">
          <p className="text-slate-400 font-sans">
            Upload two co-registered satellite crops (GeoTIFF preview, PNG, JPG, or WebP). The client-side pipeline will auto-resample them to matching 512×512 grids and compute spectral indices.
          </p>

          {/* Dual Upload Boxes */}
          <div className="grid grid-cols-2 gap-3">
            {/* Before Box */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                <span>BEFORE Observation</span>
              </label>
              <label className="flex flex-col items-center justify-center h-36 rounded-lg border-2 border-dashed border-slate-700 hover:border-emerald-500/60 bg-slate-950 cursor-pointer overflow-hidden relative transition-colors">
                {beforePreview ? (
                  <img src={beforePreview} alt="Before preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center p-3 text-center text-slate-500">
                    <ImageIcon className="w-6 h-6 mb-1 text-slate-600" />
                    <span className="text-[11px]">Select T0 Image</span>
                  </div>
                )}
                <input type="file" accept="image/*" onChange={handleBeforeChange} className="hidden" />
              </label>
              {beforeFile && (
                <div className="text-[10px] text-slate-400 truncate flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-emerald-400" />
                  <span className="truncate">{beforeFile.name}</span>
                </div>
              )}
            </div>

            {/* After Box */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-sky-400 flex items-center gap-1">
                <span>AFTER Observation</span>
              </label>
              <label className="flex flex-col items-center justify-center h-36 rounded-lg border-2 border-dashed border-slate-700 hover:border-sky-500/60 bg-slate-950 cursor-pointer overflow-hidden relative transition-colors">
                {afterPreview ? (
                  <img src={afterPreview} alt="After preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center p-3 text-center text-slate-500">
                    <ImageIcon className="w-6 h-6 mb-1 text-slate-600" />
                    <span className="text-[11px]">Select T1 Image</span>
                  </div>
                )}
                <input type="file" accept="image/*" onChange={handleAfterChange} className="hidden" />
              </label>
              {afterFile && (
                <div className="text-[10px] text-slate-400 truncate flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-sky-400" />
                  <span className="truncate">{afterFile.name}</span>
                </div>
              )}
            </div>
          </div>

          {/* Metadata Inputs */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Scene / Area Label:</label>
              <input
                type="text"
                value={sceneName}
                onChange={(e) => setSceneName(e.target.value)}
                placeholder="e.g. Pine Ridge Forest Fire"
                className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 outline-none focus:border-cyan-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Before Date:</label>
                <input
                  type="text"
                  value={beforeDate}
                  onChange={(e) => setBeforeDate(e.target.value)}
                  placeholder="e.g. March 2023"
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">After Date:</label>
                <input
                  type="text"
                  value={afterDate}
                  onChange={(e) => setAfterDate(e.target.value)}
                  placeholder="e.g. March 2024"
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-2.5 rounded bg-rose-950/60 border border-rose-800 text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded text-xs font-mono text-slate-400 hover:text-slate-200"
          >
            Cancel
          </button>

          <button
            onClick={handleProcess}
            disabled={isProcessing || !beforeFile || !afterFile}
            className="px-4 py-2 rounded text-xs font-mono font-medium text-white bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 disabled:text-slate-600 transition-colors flex items-center gap-2"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{isProcessing ? 'Processing 512²...' : 'Execute Change Pipeline'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
