import React, { useState } from 'react';
import { 
  Split, 
  BoxSelect, 
  Layers, 
  BarChart3, 
  Compass, 
  Activity,
  Sliders,
  ChevronRight,
  Maximize2
} from 'lucide-react';
import { PipelineOutput, renderOverlayToImageData, OverlayMode } from '../pipeline/changeDetection';
import { SampleDataset } from '../pipeline/sampleData';

interface InlineVisualEvidenceProps {
  taskType: 'CAPTIONING' | 'VQA_SINGLE' | 'CHANGE_DETECTION_VQA' | 'GROUNDING_REFEXP';
  stats: PipelineOutput['stats'] | null;
  pipelineOutput: PipelineOutput | null;
  beforeDataUrl: string;
  afterDataUrl: string;
  currentDataset: SampleDataset | null;
}

export const InlineVisualEvidence: React.FC<InlineVisualEvidenceProps> = ({
  taskType,
  stats,
  pipelineOutput,
  beforeDataUrl,
  afterDataUrl,
  currentDataset,
}) => {
  const [sliderPos, setSliderPos] = useState<number>(50);
  const [activeOverlay, setActiveOverlay] = useState<OverlayMode>('heatmap');
  const [isOverlayVisible, setIsOverlayVisible] = useState<boolean>(true);

  // Generate overlay data URL if pipeline output exists
  const overlayDataUrl = React.useMemo(() => {
    if (!pipelineOutput) return '';
    const imgData = renderOverlayToImageData(pipelineOutput, activeOverlay, 0.75);
    const c = document.createElement('canvas');
    c.width = imgData.width;
    c.height = imgData.height;
    c.getContext('2d')!.putImageData(imgData, 0, 0);
    return c.toDataURL();
  }, [pipelineOutput, activeOverlay]);

  if (!stats) {
    return (
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 font-mono">
        Visual evidence is processing...
      </div>
    );
  }

  // 1. CHANGE DETECTION VQA INLINE EVIDENCE: Before/After Slider with Overlay
  if (taskType === 'CHANGE_DETECTION_VQA') {
    return (
      <div className="mt-3.5 p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-600" />
            <span className="text-xs font-bold text-slate-800 tracking-wide uppercase font-mono">
              Supporting Visual Evidence: Multitemporal Change Verification
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-mono">
            <button
              onClick={() => setActiveOverlay('heatmap')}
              className={`px-2 py-0.5 rounded border transition-colors ${
                activeOverlay === 'heatmap' && isOverlayVisible
                  ? 'bg-blue-50 border-blue-300 text-blue-700 font-medium'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Heatmap
            </button>
            <button
              onClick={() => setActiveOverlay('ndvi-diff')}
              className={`px-2 py-0.5 rounded border transition-colors ${
                activeOverlay === 'ndvi-diff' && isOverlayVisible
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-700 font-medium'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              ΔNDVI
            </button>
            <button
              onClick={() => setActiveOverlay('ndwi-diff')}
              className={`px-2 py-0.5 rounded border transition-colors ${
                activeOverlay === 'ndwi-diff' && isOverlayVisible
                  ? 'bg-cyan-50 border-cyan-300 text-cyan-700 font-medium'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              ΔNDWI
            </button>
            <button
              onClick={() => setActiveOverlay('water-mask')}
              className={`px-2 py-0.5 rounded border transition-colors ${
                activeOverlay === 'water-mask' && isOverlayVisible
                  ? 'bg-sky-50 border-sky-300 text-sky-700 font-medium'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Water Mask
            </button>
            <button
              onClick={() => setIsOverlayVisible(!isOverlayVisible)}
              className="px-2 py-0.5 rounded border bg-white border-slate-200 text-slate-500 hover:text-slate-800 text-[10px]"
            >
              {isOverlayVisible ? 'Hide Mask' : 'Show Mask'}
            </button>
          </div>
        </div>

        {/* Spectral Grounding Banner for Water vs Tree disambiguation */}
        {stats.spectralGroundTruth && (
          <div className="p-2.5 rounded-lg bg-blue-50/70 border border-blue-200/80 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-600" />
              <span className="text-blue-900 font-semibold">Physical Band Truth:</span>
              <span className="text-blue-800">
                NDWI: <strong>+{stats.spectralGroundTruth.meanWaterNDWI}</strong> (Water) • NDVI: <strong>{stats.spectralGroundTruth.meanCanopyNDVI}</strong> (Canopy)
              </span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-slate-600">
              <span className="px-1.5 py-0.2 rounded bg-white border border-blue-200 text-blue-900">
                JRC Water Recurr: {(stats.spectralGroundTruth.jrcWaterOccurrenceRatio * 100).toFixed(0)}%
              </span>
              <span>Shape: Dendritic Canyon / Inlets</span>
            </div>
          </div>
        )}

        {/* Interactive Comparison Slider */}
        <div className="relative w-full max-w-xl mx-auto aspect-square rounded-lg overflow-hidden border border-slate-300 shadow-sm bg-slate-900 select-none">
          {/* Base Layer: AFTER */}
          <div className="absolute inset-0">
            <img src={afterDataUrl} alt="After" className="w-full h-full object-cover" />
            {isOverlayVisible && overlayDataUrl && (
              <img src={overlayDataUrl} alt="Change overlay" className="absolute inset-0 w-full h-full object-cover pointer-events-none opacity-80" />
            )}
            <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded bg-white/90 backdrop-blur-sm border border-slate-200 text-slate-900 font-mono text-[10px] font-bold shadow-sm">
              AFTER ({currentDataset?.afterDate || 'T1'})
            </div>
          </div>

          {/* Top Layer: BEFORE (Clipped by slider) */}
          <div className="absolute inset-0 overflow-hidden" style={{ width: `${sliderPos}%` }}>
            <img src={beforeDataUrl} alt="Before" className="absolute inset-0 w-full h-full object-cover max-w-none" style={{ width: '100%', height: '100%' }} />
            <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded bg-white/90 backdrop-blur-sm border border-slate-200 text-slate-900 font-mono text-[10px] font-bold shadow-sm">
              BEFORE ({currentDataset?.beforeDate || 'T0'})
            </div>
          </div>

          {/* Divider Handle */}
          <div className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize z-20 shadow-md" style={{ left: `${sliderPos}%` }}>
            <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-white border border-slate-300 flex items-center justify-center shadow-lg text-slate-700">
              <Split className="w-3 h-3 rotate-90" />
            </div>
          </div>

          {/* Range input for mobile / mouse drag */}
          <input
            type="range"
            min="0"
            max="100"
            value={sliderPos}
            onChange={(e) => setSliderPos(parseFloat(e.target.value))}
            className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-30"
          />
        </div>

        {/* Change stats summary table */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-xs">
          <div className="p-2.5 rounded-lg bg-white border border-slate-200">
            <div className="text-[10px] text-slate-500 uppercase">Total Delta Area</div>
            <div className="font-bold text-slate-900 text-sm">{stats.percentChanged}%</div>
          </div>
          <div className="p-2.5 rounded-lg bg-white border border-slate-200">
            <div className="text-[10px] text-slate-500 uppercase">Otsu Cut (t*)</div>
            <div className="font-bold text-slate-900 text-sm">{stats.otsuThreshold} / 255</div>
          </div>
          <div className="p-2.5 rounded-lg bg-white border border-slate-200">
            <div className="text-[10px] text-slate-500 uppercase">Canopy ΔNDVI</div>
            <div className={`font-bold text-sm ${stats.meanNDVIDelta < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
              {stats.meanNDVIDelta > 0 ? '+' : ''}{stats.meanNDVIDelta}
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-white border border-slate-200">
            <div className="text-[10px] text-slate-500 uppercase">Moisture ΔNDWI</div>
            <div className={`font-bold text-sm ${stats.meanNDWIDelta < 0 ? 'text-amber-600' : 'text-cyan-600'}`}>
              {stats.meanNDWIDelta > 0 ? '+' : ''}{stats.meanNDWIDelta}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. GROUNDING / REFERRING EXPRESSION INLINE EVIDENCE: Bounding Box Overlays
  if (taskType === 'GROUNDING_REFEXP') {
    return (
      <div className="mt-3.5 p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BoxSelect className="w-4 h-4 text-purple-600" />
            <span className="text-xs font-bold text-slate-800 tracking-wide uppercase font-mono">
              Supporting Visual Evidence: Grounded Bounding Box Coordinates
            </span>
          </div>
          <span className="px-2 py-0.5 rounded bg-purple-50 border border-purple-200 text-purple-700 text-[10px] font-mono font-medium">
            BigEarthNet.txt Referring Expression
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-center">
          {/* Visual Crop with Bounding Box SVG overlay */}
          <div className="relative aspect-square rounded-lg overflow-hidden border border-slate-300 shadow-sm bg-slate-900">
            <img src={afterDataUrl} alt="Satellite AOI" className="w-full h-full object-cover" />
            
            {/* Draw top clusters bounding boxes */}
            {stats.topClusters.slice(0, 3).map((cluster, i) => {
              const [ymin, xmin, ymax, xmax] = cluster.bbox;
              const isFirst = i === 0;
              return (
                <div
                  key={cluster.id}
                  className={`absolute border-2 transition-all ${
                    isFirst
                      ? 'border-purple-500 bg-purple-500/20 shadow-[0_0_12px_rgba(168,85,247,0.5)]'
                      : 'border-amber-400 bg-amber-400/10'
                  }`}
                  style={{
                    top: `${ymin}%`,
                    left: `${xmin}%`,
                    width: `${Math.max(5, xmax - xmin)}%`,
                    height: `${Math.max(5, ymax - ymin)}%`,
                  }}
                >
                  <div className="absolute -top-5 left-0 px-1.5 py-0.5 rounded bg-slate-900 text-white text-[9px] font-mono shadow whitespace-nowrap">
                    Box #{cluster.id} ({cluster.quadrant})
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bounding Box Coordinates Table */}
          <div className="space-y-2 font-mono text-xs">
            <div className="text-[11px] font-bold text-slate-700 uppercase">
              Localized Referring Expression Targets:
            </div>
            <div className="space-y-1.5">
              {stats.topClusters.slice(0, 3).map((c, idx) => (
                <div key={c.id} className="p-2.5 rounded-lg bg-white border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-purple-700">Cluster #{c.id} ({c.quadrant})</span>
                    <span className="text-[10px] text-slate-500">{c.areaPercentage.toFixed(1)}% of scene</span>
                  </div>
                  <div className="text-[11px] text-slate-600 font-sans">{c.dominantShift}</div>
                  <div className="text-[10px] text-slate-500 pt-0.5">
                    <strong>BBox [ymin, xmin, ymax, xmax]:</strong> [{c.bbox.map((v) => v.toFixed(1)).join(', ')}]
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 3. SINGLE-IMAGE VQA INLINE EVIDENCE: Spectral Indices & Land Cover Breakdown
  if (taskType === 'VQA_SINGLE') {
    return (
      <div className="mt-3.5 p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-3 font-mono text-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-bold text-slate-800 tracking-wide uppercase">
              Supporting Visual Evidence: Spectral Signature Metrics
            </span>
          </div>
          <span className="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-medium">
            RSVQA Land-Cover Verification
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <div className="p-3 rounded-lg bg-white border border-slate-200 space-y-1">
            <div className="text-[10px] text-slate-500 uppercase">Mean NDVI (Foliage)</div>
            <div className="text-base font-bold text-emerald-600">
              {stats.meanNDVIDelta > 0 ? '+' : ''}{stats.meanNDVIDelta}
            </div>
            <p className="text-[10px] text-slate-500 font-sans">Chlorophyll reflectance vs absorption proxy</p>
          </div>

          <div className="p-3 rounded-lg bg-white border border-slate-200 space-y-1">
            <div className="text-[10px] text-slate-500 uppercase">Mean NDWI (Moisture)</div>
            <div className="text-base font-bold text-cyan-600">
              {stats.meanNDWIDelta > 0 ? '+' : ''}{stats.meanNDWIDelta}
            </div>
            <p className="text-[10px] text-slate-500 font-sans">Open water & surface soil wetness proxy</p>
          </div>

          <div className="p-3 rounded-lg bg-white border border-slate-200 space-y-1">
            <div className="text-[10px] text-slate-500 uppercase">Mean EVI (Biomass)</div>
            <div className="text-base font-bold text-teal-600">
              {stats.meanEVIDelta > 0 ? '+' : ''}{stats.meanEVIDelta}
            </div>
            <p className="text-[10px] text-slate-500 font-sans">Enhanced vegetation with soil resistance</p>
          </div>
        </div>
      </div>
    );
  }

  // 4. CAPTIONING INLINE EVIDENCE: Spatial Quadrant Overview
  return (
    <div className="mt-3.5 p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-3 font-mono text-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-indigo-600" />
          <span className="text-xs font-bold text-slate-800 tracking-wide uppercase">
            Supporting Visual Evidence: Spatial Matrix Breakdown
          </span>
        </div>
        <span className="px-2 py-0.5 rounded bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-medium">
          VRSBench Scene Morphology
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="p-2.5 rounded-lg bg-white border border-slate-200">
          <div className="text-[10px] text-slate-500 uppercase">North-West (NW)</div>
          <div className="text-sm font-bold text-slate-800">{stats.spatialDistribution.northWest}%</div>
        </div>
        <div className="p-2.5 rounded-lg bg-white border border-slate-200">
          <div className="text-[10px] text-slate-500 uppercase">North-East (NE)</div>
          <div className="text-sm font-bold text-slate-800">{stats.spatialDistribution.northEast}%</div>
        </div>
        <div className="p-2.5 rounded-lg bg-white border border-slate-200">
          <div className="text-[10px] text-slate-500 uppercase">South-West (SW)</div>
          <div className="text-sm font-bold text-slate-800">{stats.spatialDistribution.southWest}%</div>
        </div>
        <div className="p-2.5 rounded-lg bg-white border border-slate-200">
          <div className="text-[10px] text-slate-500 uppercase">South-East (SE)</div>
          <div className="text-sm font-bold text-slate-800">{stats.spatialDistribution.southEast}%</div>
        </div>
      </div>
    </div>
  );
};
