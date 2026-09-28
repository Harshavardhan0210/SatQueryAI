import React, { useState } from 'react';
import { 
  X, 
  Workflow, 
  Code2, 
  Calculator, 
  Layers, 
  BarChart3, 
  Filter, 
  CheckCircle2, 
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { PipelineOutput } from '../pipeline/changeDetection';

interface PipelineInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  pipelineOutput: PipelineOutput | null;
}

export const PipelineInspectorModal: React.FC<PipelineInspectorModalProps> = ({
  isOpen,
  onClose,
  pipelineOutput,
}) => {
  const [activeStep, setActiveStep] = useState<number>(1);

  if (!isOpen) return null;

  const steps = [
    {
      step: 1,
      title: 'Co-Registration & Channel Normalization',
      subtitle: 'Input image alignment and RGB floating point scaling [0, 1]',
      icon: Layers,
      content: (
        <div className="space-y-3 font-mono text-xs">
          <p className="text-slate-300">
            Before and after satellite image arrays are aligned to matching dimensions (512 × 512 = 262,144 pixels) and normalized to continuous unit values:
          </p>
          <pre className="p-3 rounded bg-slate-950 border border-slate-800 text-cyan-300 overflow-x-auto">
{`// Floating point channel extraction for pixel i:
const r = data[idx] / 255.0;     // Red channel (chlorophyll absorption)
const g = data[idx + 1] / 255.0; // Green channel (vegetation reflectance)
const b = data[idx + 2] / 255.0; // Blue channel (water penetration)`}
          </pre>
          <div className="p-2.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
            <strong>Active Scene Stats:</strong> Total processed pixels: <strong>{pipelineOutput?.stats.totalPixels.toLocaleString() || '262,144'}</strong>
          </div>
        </div>
      ),
    },
    {
      step: 2,
      title: 'Spectral Index Formulations',
      subtitle: 'Approximated NDVI, NDWI, and EVI proxies',
      icon: Calculator,
      content: (
        <div className="space-y-3 font-mono text-xs">
          <p className="text-slate-300">
            Simplified physical indices are computed per pixel to isolate specific land cover dynamics:
          </p>
          <div className="space-y-2">
            <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
              <span className="text-emerald-400 font-bold">1. NDVI Proxy (Vegetation Index):</span>
              <div className="text-slate-400 mt-0.5">NDVI = (Green - Red) / (Green + Red + ε)</div>
              <p className="text-slate-400 text-[11px] mt-1 font-sans">
                Exploits chlorophyll reflectance in green versus absorption in red to detect foliage density.
              </p>
            </div>

            <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
              <span className="text-cyan-400 font-bold">2. NDWI Proxy (Normalized Water Index):</span>
              <div className="text-slate-400 mt-0.5">NDWI = (Green - Blue) / (Green + Blue + ε)</div>
              <p className="text-slate-400 text-[11px] mt-1 font-sans">
                Maximizes water reflectance in green relative to blue/red absorption to monitor reservoirs and shorelines.
              </p>
            </div>

            <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
              <span className="text-teal-400 font-bold">3. EVI Proxy (Enhanced Vegetation Index):</span>
              <div className="text-slate-400 mt-0.5">EVI = 2.5 × (Green - Red) / (Green + 6·Red - 7.5·Blue + 1)</div>
              <p className="text-slate-400 text-[11px] mt-1 font-sans">
                Reduces canopy background noise and atmospheric scattering over dense forests.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      step: 3,
      title: 'Per-Pixel Differencing & Magnitude Map',
      subtitle: 'Multi-spectral change vector computation',
      icon: Workflow,
      content: (
        <div className="space-y-3 font-mono text-xs">
          <p className="text-slate-300">
            For each pixel $(x, y)$, signed deltas between Time 1 (After) and Time 0 (Before) are calculated:
          </p>
          <pre className="p-3 rounded bg-slate-950 border border-slate-800 text-sky-300 overflow-x-auto">
{`deltaNDVI[i] = after.ndvi[i] - before.ndvi[i];
deltaNDWI[i] = after.ndwi[i] - before.ndwi[i];
deltaEVI[i]  = after.evi[i] - before.evi[i];

// Multi-spectral weighted magnitude vector:
magnitude[i] = Math.sqrt(
  0.40 * (deltaNDVI^2) +
  0.30 * (deltaNDWI^2) +
  0.15 * (deltaEVI^2) +
  0.15 * (rgbEuclideanDist^2)
);`}
          </pre>
          <div className="p-2.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
            <strong>Active Scene Means:</strong> Mean ΔNDVI: <strong>{pipelineOutput?.stats.meanNDVIDelta}</strong> | Mean ΔNDWI: <strong>{pipelineOutput?.stats.meanNDWIDelta}</strong>
          </div>
        </div>
      ),
    },
    {
      step: 4,
      title: "Otsu's Thresholding Algorithm",
      subtitle: 'Optimal separation of changed vs. unchanged pixels without manual parameters',
      icon: BarChart3,
      content: (
        <div className="space-y-3 font-mono text-xs">
          <p className="text-slate-300">
            Otsu's method exhaustively evaluates all 256 candidate thresholds $t \in [0, 255]$ to maximize between-class variance $\sigma_B^2(t)$:
          </p>
          <pre className="p-3 rounded bg-slate-950 border border-slate-800 text-amber-300 overflow-x-auto">
{`// Between-class variance formula:
sigma_B^2(t) = omega_0(t) * omega_1(t) * [mu_0(t) - mu_1(t)]^2

where:
- omega_0(t) = cumulative probability of background (unchanged)
- omega_1(t) = cumulative probability of foreground (changed)
- mu_0(t), mu_1(t) = class means`}
          </pre>
          <div className="p-2.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
            <strong>Optimal Computed Threshold:</strong> Index: <strong>{pipelineOutput?.otsu.thresholdIndex}/255</strong> (Normalized: <strong>{pipelineOutput?.stats.otsuThresholdNorm}</strong>)
          </div>
        </div>
      ),
    },
    {
      step: 5,
      title: 'Morphological Cleanup (Opening)',
      subtitle: 'Erosion followed by dilation to eliminate isolated speckle and sensor noise',
      icon: Filter,
      content: (
        <div className="space-y-3 font-mono text-xs">
          <p className="text-slate-300">
            Raw thresholding produces false-positive sensor speckles. Morphological Opening with a 3×3 flat structuring element filters isolated noise while preserving cohesive borders:
          </p>
          <pre className="p-3 rounded bg-slate-950 border border-slate-800 text-emerald-300 overflow-x-auto">
{`// 1. Erosion: requires all 8 neighbors to be 1
const eroded = erode(rawMask, width, height, 3x3);

// 2. Dilation: restores borders of true clusters
const cleanedMask = dilate(eroded, width, height, 3x3);`}
          </pre>
          <div className="grid grid-cols-2 gap-2 text-slate-300">
            <div className="p-2 rounded bg-slate-950 border border-slate-800">
              Raw detections: <strong>{pipelineOutput?.stats.rawChangedPixels.toLocaleString()} px</strong>
            </div>
            <div className="p-2 rounded bg-slate-950 border border-slate-800 text-emerald-400">
              Speckles filtered: <strong>-{pipelineOutput?.stats.speckleRemovedPixels.toLocaleString()} px</strong>
            </div>
          </div>
        </div>
      ),
    },
    {
      step: 6,
      title: 'Spatial Clustering & Grounded Context',
      subtitle: 'Connected Component Analysis and structured payload sent to Gemini',
      icon: Code2,
      content: (
        <div className="space-y-3 font-mono text-xs">
          <p className="text-slate-300">
            Connected 8-neighborhood flood fill clusters changed pixels into discrete regions, bounding boxes, and quadrants. ONLY these structured numbers are provided to Gemini:
          </p>
          <pre className="p-3 rounded bg-slate-950 border border-slate-800 text-indigo-300 overflow-x-auto max-h-40">
{JSON.stringify(
  {
    percentChanged: pipelineOutput?.stats.percentChanged,
    dominantChangeType: pipelineOutput?.stats.dominantChangeType,
    otsuThreshold: pipelineOutput?.stats.otsuThreshold,
    meanNDVIDelta: pipelineOutput?.stats.meanNDVIDelta,
    meanNDWIDelta: pipelineOutput?.stats.meanNDWIDelta,
    spatialDistribution: pipelineOutput?.stats.spatialDistribution,
    topClustersCount: pipelineOutput?.stats.topClusters.length,
  },
  null,
  2
)}
          </pre>
          <div className="p-2.5 rounded bg-emerald-950/60 border border-emerald-700/50 text-emerald-300 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>Auditable Boundary: Zero imagery pixels are ever sent to Gemini.</span>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Workflow className="w-5 h-5 text-cyan-400" />
            <div>
              <h2 className="text-sm font-bold font-mono tracking-wider text-slate-100 uppercase">
                Deterministic Processing Pipeline
              </h2>
              <p className="text-xs text-slate-400">
                Inspectable JavaScript mathematical workflow (100% Client-Side)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stepper Tabs */}
        <div className="flex overflow-x-auto border-b border-slate-800 bg-slate-950/60 px-2 py-1.5 gap-1">
          {steps.map((s) => {
            const Icon = s.icon;
            const isActive = activeStep === s.step;
            return (
              <button
                key={s.step}
                onClick={() => setActiveStep(s.step)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono whitespace-nowrap transition-all border ${
                  isActive
                    ? 'bg-cyan-950 text-cyan-300 border-cyan-500/60 shadow'
                    : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-800/50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>Step {s.step}</span>
              </button>
            );
          })}
        </div>

        {/* Step Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-100 font-mono">
              Step {steps[activeStep - 1].step}: {steps[activeStep - 1].title}
            </h3>
            <p className="text-xs text-cyan-400/90 font-mono mt-0.5">
              {steps[activeStep - 1].subtitle}
            </p>
          </div>

          <div className="pt-2">
            {steps[activeStep - 1].content}
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="px-5 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={() => setActiveStep(Math.max(1, activeStep - 1))}
            disabled={activeStep === 1}
            className="px-3 py-1.5 rounded text-xs font-mono text-slate-300 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 transition-colors"
          >
            Previous
          </button>

          <span className="text-xs font-mono text-slate-500">
            Step {activeStep} of {steps.length}
          </span>

          <button
            onClick={() => {
              if (activeStep < steps.length) {
                setActiveStep(activeStep + 1);
              } else {
                onClose();
              }
            }}
            className="px-3 py-1.5 rounded text-xs font-mono text-white bg-cyan-600 hover:bg-cyan-500 transition-colors flex items-center gap-1"
          >
            <span>{activeStep === steps.length ? 'Close' : 'Next Step'}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
