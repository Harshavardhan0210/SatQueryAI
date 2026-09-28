import React from 'react';
import { 
  SAMPLE_DATASETS, 
  SampleDataset 
} from '../pipeline/sampleData';
import { OverlayMode } from '../pipeline/changeDetection';
import { 
  Layers, 
  Upload, 
  Sliders, 
  BoxSelect, 
  Compass, 
  Eye, 
  EyeOff, 
  Workflow, 
  Check, 
  MapPin, 
  Calendar,
  Sparkles,
  ChevronRight
} from 'lucide-react';

interface LeftSidebarProps {
  currentDataset: SampleDataset | null;
  onSelectDataset: (dataset: SampleDataset) => void;
  onOpenUpload: () => void;
  onOpenInspector: () => void;
  overlayMode: OverlayMode;
  onSelectOverlayMode: (mode: OverlayMode) => void;
  showOverlay: boolean;
  onToggleShowOverlay: () => void;
  overlayOpacity: number;
  onChangeOverlayOpacity: (opacity: number) => void;
  showClusters: boolean;
  onToggleClusters: () => void;
  showQuadrants: boolean;
  onToggleQuadrants: () => void;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  currentDataset,
  onSelectDataset,
  onOpenUpload,
  onOpenInspector,
  overlayMode,
  onSelectOverlayMode,
  showOverlay,
  onToggleShowOverlay,
  overlayOpacity,
  onChangeOverlayOpacity,
  showClusters,
  onToggleClusters,
  showQuadrants,
  onToggleQuadrants,
}) => {
  return (
    <aside className="w-80 flex-shrink-0 bg-slate-950 border-r border-slate-800/80 flex flex-col h-full overflow-y-auto text-xs font-mono select-none">
      <div className="p-3.5 space-y-4">
        {/* Section 1: Image Pair Selector */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
              1. Satellite Observation Pair
            </span>
            <button
              onClick={onOpenUpload}
              className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
              title="Upload custom satellite images"
            >
              <Upload className="w-3 h-3" />
              <span>Upload</span>
            </button>
          </div>

          {/* Preset scenarios list */}
          <div className="space-y-1.5">
            {SAMPLE_DATASETS.map((ds) => {
              const isSelected = currentDataset?.id === ds.id;
              return (
                <button
                  key={ds.id}
                  onClick={() => onSelectDataset(ds)}
                  className={`w-full text-left p-2.5 rounded-lg border transition-all ${
                    isSelected
                      ? 'bg-slate-900 border-cyan-500/60 shadow-sm text-slate-100 ring-1 ring-cyan-500/30'
                      : 'bg-slate-900/40 border-slate-800/80 hover:bg-slate-900/80 hover:border-slate-700 text-slate-400'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1">
                    <span className={`font-semibold text-xs ${isSelected ? 'text-cyan-300' : 'text-slate-300'}`}>
                      {ds.name}
                    </span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />}
                  </div>

                  <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span className="truncate max-w-[120px]">{ds.location}</span>
                    </span>
                    <span>•</span>
                    <span className="text-slate-400">{ds.resolution}</span>
                  </div>

                  <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-emerald-400/80" />
                    <span>{ds.beforeDate} → {ds.afterDate}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 2: Index Layer Controls */}
        <div className="space-y-2.5 pt-2 border-t border-slate-900">
          <div className="flex items-center justify-between text-slate-300">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              2. Spectral Layer Toggles
            </span>
            <button
              onClick={onToggleShowOverlay}
              className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border transition-colors ${
                showOverlay
                  ? 'bg-cyan-950 border-cyan-700 text-cyan-300'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-300'
              }`}
            >
              {showOverlay ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
              <span>{showOverlay ? 'Overlay On' : 'Overlay Off'}</span>
            </button>
          </div>

          {/* Layer Selection Buttons */}
          <div className="space-y-1">
            <button
              onClick={() => { onSelectOverlayMode('heatmap'); if (!showOverlay) onToggleShowOverlay(); }}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md border text-left transition-colors ${
                showOverlay && overlayMode === 'heatmap'
                  ? 'bg-amber-950/40 border-amber-500/60 text-amber-200 font-semibold'
                  : 'bg-slate-900/30 border-slate-850 hover:bg-slate-900 text-slate-400'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-cyan-400 via-amber-400 to-rose-500" />
                <span>Change Heatmap</span>
              </div>
              <span className="text-[10px] text-slate-400">Magnitude</span>
            </button>

            <button
              onClick={() => { onSelectOverlayMode('binary'); if (!showOverlay) onToggleShowOverlay(); }}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md border text-left transition-colors ${
                showOverlay && overlayMode === 'binary'
                  ? 'bg-orange-950/40 border-orange-500/60 text-orange-200 font-semibold'
                  : 'bg-slate-900/30 border-slate-850 hover:bg-slate-900 text-slate-400'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span>Binary Mask (Denoised)</span>
              </div>
              <span className="text-[10px] text-slate-400">Otsu t*</span>
            </button>

            <button
              onClick={() => { onSelectOverlayMode('ndvi-diff'); if (!showOverlay) onToggleShowOverlay(); }}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md border text-left transition-colors ${
                showOverlay && overlayMode === 'ndvi-diff'
                  ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-200 font-semibold'
                  : 'bg-slate-900/30 border-slate-850 hover:bg-slate-900 text-slate-400'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>ΔNDVI (Vegetation Index)</span>
              </div>
              <span className="text-[10px] text-slate-400">Canopy</span>
            </button>

            <button
              onClick={() => { onSelectOverlayMode('ndwi-diff'); if (!showOverlay) onToggleShowOverlay(); }}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md border text-left transition-colors ${
                showOverlay && overlayMode === 'ndwi-diff'
                  ? 'bg-sky-950/40 border-sky-500/60 text-sky-200 font-semibold'
                  : 'bg-slate-900/30 border-slate-850 hover:bg-slate-900 text-slate-400'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                <span>ΔNDWI (Water Index)</span>
              </div>
              <span className="text-[10px] text-slate-400">Moisture</span>
            </button>

            <button
              onClick={() => { onSelectOverlayMode('evi-diff'); if (!showOverlay) onToggleShowOverlay(); }}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md border text-left transition-colors ${
                showOverlay && overlayMode === 'evi-diff'
                  ? 'bg-teal-950/40 border-teal-500/60 text-teal-200 font-semibold'
                  : 'bg-slate-900/30 border-slate-850 hover:bg-slate-900 text-slate-400'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-400" />
                <span>ΔEVI (Enhanced Biomass)</span>
              </div>
              <span className="text-[10px] text-slate-400">Biomass</span>
            </button>

            <button
              onClick={() => { onSelectOverlayMode('raw-otsu'); if (!showOverlay) onToggleShowOverlay(); }}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md border text-left transition-colors ${
                showOverlay && overlayMode === 'raw-otsu'
                  ? 'bg-fuchsia-950/40 border-fuchsia-500/60 text-fuchsia-200 font-semibold'
                  : 'bg-slate-900/30 border-slate-850 hover:bg-slate-900 text-slate-400'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-fuchsia-500" />
                <span>Raw Otsu (Pre-Denoised)</span>
              </div>
              <span className="text-[10px] text-slate-400">Speckles</span>
            </button>
          </div>

          {/* Opacity slider */}
          {showOverlay && (
            <div className="p-2.5 rounded-lg bg-slate-900/50 border border-slate-850 space-y-1.5">
              <div className="flex justify-between items-center text-[11px] text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Sliders className="w-3 h-3 text-cyan-400" />
                  <span>Layer Opacity</span>
                </span>
                <span className="text-slate-200 font-bold">{Math.round(overlayOpacity * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={overlayOpacity}
                onChange={(e) => onChangeOverlayOpacity(parseFloat(e.target.value))}
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
            </div>
          )}

          {/* Display Overlays (Clusters & Quadrants) */}
          <div className="grid grid-cols-2 gap-1.5 pt-1">
            <button
              onClick={onToggleClusters}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md border text-[11px] transition-colors ${
                showClusters
                  ? 'bg-amber-950/50 border-amber-500/60 text-amber-300'
                  : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:text-slate-300'
              }`}
            >
              <BoxSelect className="w-3 h-3" />
              <span>Clusters</span>
            </button>

            <button
              onClick={onToggleQuadrants}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md border text-[11px] transition-colors ${
                showQuadrants
                  ? 'bg-cyan-950/50 border-cyan-500/60 text-cyan-300'
                  : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:text-slate-300'
              }`}
            >
              <Compass className="w-3 h-3" />
              <span>Quadrants</span>
            </button>
          </div>
        </div>

        {/* Section 3: Compact Color Legend */}
        <div className="space-y-2 pt-2 border-t border-slate-900">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
            3. Change-Mask Legend
          </span>

          <div className="p-2.5 rounded-lg bg-slate-900/50 border border-slate-850 space-y-2 text-[11px]">
            {overlayMode === 'heatmap' && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-slate-400 text-[10px]">
                  <span>Low / Stable</span>
                  <span>Moderate</span>
                  <span>Severe Change</span>
                </div>
                <div className="h-2 rounded bg-gradient-to-r from-cyan-400 via-amber-400 to-rose-600" />
                <div className="text-[10px] text-slate-400 pt-0.5">
                  Multi-spectral Euclidean intensity past Otsu cut.
                </div>
              </div>
            )}

            {overlayMode === 'binary' && (
              <div className="flex items-center gap-2 text-slate-300">
                <span className="w-3 h-3 rounded bg-amber-500 shrink-0" />
                <span>Changed Area (Denoised, 8-neighbor filtered)</span>
              </div>
            )}

            {overlayMode === 'ndvi-diff' && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-rose-300">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    <span>Foliage Loss (-ΔNDVI)</span>
                  </div>
                  <span className="text-slate-400 text-[10px]">Clearing</span>
                </div>
                <div className="flex items-center justify-between text-emerald-300">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span>Foliage Gain (+ΔNDVI)</span>
                  </div>
                  <span className="text-slate-400 text-[10px]">Greening</span>
                </div>
              </div>
            )}

            {overlayMode === 'ndwi-diff' && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-amber-300">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span>Water Loss (-ΔNDWI)</span>
                  </div>
                  <span className="text-slate-400 text-[10px]">Recession</span>
                </div>
                <div className="flex items-center justify-between text-cyan-300">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                    <span>Water Gain (+ΔNDWI)</span>
                  </div>
                  <span className="text-slate-400 text-[10px]">Inundation</span>
                </div>
              </div>
            )}

            {overlayMode === 'evi-diff' && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-rose-300">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-600" />
                    <span>Canopy Depletion</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-teal-300">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-teal-400" />
                    <span>Biomass Accretion</span>
                  </div>
                </div>
              </div>
            )}

            {overlayMode === 'raw-otsu' && (
              <div className="flex items-center gap-2 text-fuchsia-300">
                <span className="w-3 h-3 rounded bg-fuchsia-500 shrink-0" />
                <span>Pre-Morphology Mask (Noise Speckles Visible)</span>
              </div>
            )}
          </div>
        </div>

        {/* Section 4: Inspect Math Trigger Card */}
        <div className="pt-2 border-t border-slate-900">
          <button
            onClick={onOpenInspector}
            className="w-full p-2.5 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-cyan-500/50 text-left transition-colors flex items-center justify-between group"
          >
            <div className="flex items-center gap-2 text-slate-300 group-hover:text-cyan-300">
              <Workflow className="w-4 h-4 text-cyan-400" />
              <div>
                <div className="font-semibold text-xs">Inspect Mathematical Pipeline</div>
                <div className="text-[10px] text-slate-400">Otsu, NDVI & CCA Formulations</div>
              </div>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-400 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};
