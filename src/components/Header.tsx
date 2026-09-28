import React from 'react';
import { 
  Satellite, 
  Workflow, 
  Upload, 
  ChevronDown, 
  Layers, 
  MapPin, 
  ShieldCheck, 
  Cpu,
  Sparkles,
  Zap,
  Droplets
} from 'lucide-react';
import { SAMPLE_DATASETS, SampleDataset } from '../pipeline/sampleData';

interface HeaderProps {
  currentDataset: SampleDataset | null;
  onSelectDataset: (ds: SampleDataset) => void;
  onOpenUpload: () => void;
  onOpenArchitecture: () => void;
  onOpenSpectralAudit: () => void;
  isProcessing: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentDataset,
  onSelectDataset,
  onOpenUpload,
  onOpenArchitecture,
  onOpenSpectralAudit,
  isProcessing,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 py-2.5 shadow-xs select-none">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
        {/* Brand & Tag */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-sm">
              <Satellite className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight text-slate-900 font-sans">
                  SatQuery AI
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-indigo-50 border border-indigo-200 text-indigo-700">
                  SIH26167
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Multi-Model VLM Orchestrator & Grounded Query Engine
              </p>
            </div>
          </div>
        </div>

        {/* Center / Scene selector dropdown */}
        <div className="flex items-center gap-2">
          <div className="relative group">
            <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-mono text-slate-700 transition-colors">
              <MapPin className="w-3.5 h-3.5 text-indigo-600" />
              <span className="font-medium truncate max-w-[130px] sm:max-w-[180px]">
                {currentDataset ? currentDataset.name : 'Custom AOI'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Dropdown menu */}
            <div className="absolute right-0 sm:left-0 mt-1.5 w-72 bg-white border border-slate-200 rounded-xl shadow-xl py-1 z-50 hidden group-hover:block">
              <div className="px-3 py-1.5 border-b border-slate-100 text-[10px] font-mono uppercase tracking-wider text-slate-400">
                Satellite Observation Scenarios
              </div>
              {SAMPLE_DATASETS.map((ds) => (
                <button
                  key={ds.id}
                  onClick={() => onSelectDataset(ds)}
                  className={`w-full text-left px-3 py-2 text-xs hover:bg-slate-50 flex flex-col transition-colors border-l-2 ${
                    currentDataset?.id === ds.id
                      ? 'border-indigo-600 bg-indigo-50/50 text-indigo-950 font-semibold'
                      : 'border-transparent text-slate-700'
                  }`}
                >
                  <span className="font-medium">{ds.name}</span>
                  <span className="text-[11px] text-slate-500 font-mono">{ds.location} ({ds.resolution})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Upload Button */}
          <button
            onClick={onOpenUpload}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-mono text-slate-700 transition-colors"
            title="Upload custom satellite images"
          >
            <Upload className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden sm:inline">Upload</span>
          </button>

          {/* Spectral Water Audit & Grounding Button */}
          <button
            onClick={onOpenSpectralAudit}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-900 text-xs font-mono font-medium transition-colors shadow-xs"
            title="Inspect Water vs. Tree Disambiguation & Batch Validation Report"
          >
            <Droplets className="w-3.5 h-3.5 text-blue-600" />
            <span>Water vs Tree Audit</span>
          </button>

          {/* Architecture & Grounding Diagnostics Button */}
          <button
            onClick={onOpenArchitecture}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-mono font-medium transition-colors shadow-sm"
            title="Inspect Multi-Adapter Orchestrator & Grounding Diagnostics"
          >
            <Zap className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Architecture</span>
          </button>
        </div>
      </div>
    </header>
  );
};
