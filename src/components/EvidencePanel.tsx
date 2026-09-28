import React, { useRef, useEffect } from 'react';
import { 
  ChangeStats, 
  OtsuResult, 
  ClusterRegion 
} from '../pipeline/changeDetection';
import { 
  BarChart3, 
  ShieldCheck, 
  Table, 
  Compass, 
  Layers, 
  Filter,
  CheckCircle2
} from 'lucide-react';

interface EvidencePanelProps {
  stats: ChangeStats | null;
  otsu: OtsuResult | null;
  activeClusterId: number | null;
  onSelectCluster: (clusterId: number | null) => void;
  hoveredQuadrant: string | null;
  onHoverQuadrant: (quadrant: string | null) => void;
}

export const EvidencePanel: React.FC<EvidencePanelProps> = ({
  stats,
  otsu,
  activeClusterId,
  onSelectCluster,
  hoveredQuadrant,
  onHoverQuadrant,
}) => {
  const histogramCanvasRef = useRef<HTMLCanvasElement>(null);

  // Render 256-bin histogram
  useEffect(() => {
    if (!otsu || !histogramCanvasRef.current) return;
    const canvas = histogramCanvasRef.current;
    const ctx = canvas.getContext('2d')!;
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    let maxFreq = 0;
    for (let i = 1; i < 256; i++) {
      if (otsu.histogram[i] > maxFreq) maxFreq = otsu.histogram[i];
    }
    if (maxFreq === 0) maxFreq = 1;

    // Draw grid
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, height * 0.5);
    ctx.lineTo(width, height * 0.5);
    ctx.stroke();

    // Draw bars
    const barWidth = width / 256;
    for (let i = 0; i < 256; i++) {
      const barHeight = (otsu.histogram[i] / maxFreq) * (height - 8);
      const isAboveOtsu = i >= otsu.thresholdIndex;
      ctx.fillStyle = isAboveOtsu ? '#f59e0b' : '#334155';
      ctx.fillRect(i * barWidth, height - barHeight, Math.max(1, barWidth), barHeight);
    }

    // Draw between-class variance curve
    const maxVar = otsu.maxVariance || 1;
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let i = 0; i < 256; i++) {
      const y = height - (otsu.variances[i] / maxVar) * (height - 12);
      const x = i * barWidth;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Otsu threshold cut line
    const threshX = otsu.thresholdIndex * barWidth;
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 2]);
    ctx.beginPath();
    ctx.moveTo(threshX, 0);
    ctx.lineTo(threshX, height);
    ctx.stroke();
    ctx.setLineDash([]);
  }, [otsu]);

  if (!stats) {
    return (
      <div className="h-full flex items-center justify-center p-6 text-center text-slate-500 font-mono text-xs">
        <span>Processing pixel statistics...</span>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto space-y-3 font-mono text-xs text-slate-300 pr-1">
      {/* Table 1: Core Scalar Metrics */}
      <div className="rounded-lg border border-slate-800 bg-slate-900/60 overflow-hidden shadow-sm">
        <div className="px-3 py-1.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-[11px] text-slate-300 font-bold uppercase tracking-wider">
          <div className="flex items-center gap-1.5">
            <Table className="w-3.5 h-3.5 text-cyan-400" />
            <span>Core Change Metrics</span>
          </div>
          <span className="text-[10px] text-emerald-400 font-normal">Auditable Grounding</span>
        </div>

        <table className="w-full text-left border-collapse text-[11px]">
          <tbody>
            <tr className="border-b border-slate-850 hover:bg-slate-900/40">
              <td className="px-3 py-1.5 text-slate-400">Total Change Area</td>
              <td className="px-3 py-1.5 text-right font-bold text-amber-400">
                {stats.percentChanged}%
              </td>
            </tr>
            <tr className="border-b border-slate-850 hover:bg-slate-900/40">
              <td className="px-3 py-1.5 text-slate-400">Changed / Total Pixels</td>
              <td className="px-3 py-1.5 text-right text-slate-200">
                {stats.changedPixels.toLocaleString()} / {stats.totalPixels.toLocaleString()}
              </td>
            </tr>
            <tr className="border-b border-slate-850 hover:bg-slate-900/40">
              <td className="px-3 py-1.5 text-slate-400">Otsu Threshold Index (t*)</td>
              <td className="px-3 py-1.5 text-right text-cyan-300 font-bold">
                {stats.otsuThreshold} / 255 ({stats.otsuThresholdNorm})
              </td>
            </tr>
            <tr className="border-b border-slate-850 hover:bg-slate-900/40">
              <td className="px-3 py-1.5 text-slate-400">Morphological Denoising</td>
              <td className="px-3 py-1.5 text-right text-emerald-400">
                -{stats.speckleRemovedPixels.toLocaleString()} speckles
              </td>
            </tr>
            <tr className="hover:bg-slate-900/40">
              <td className="px-3 py-1.5 text-slate-400">Dominant Dynamics</td>
              <td className="px-3 py-1.5 text-right font-medium text-slate-200 truncate max-w-[170px]">
                {stats.dominantChangeType}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Table 2: Otsu Histogram Preview */}
      <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-2.5 space-y-1.5">
        <div className="flex justify-between items-center text-[10px] text-slate-400 uppercase tracking-wider">
          <span className="flex items-center gap-1 text-slate-300 font-bold">
            <BarChart3 className="w-3 h-3 text-amber-400" />
            <span>Otsu Partition Histogram</span>
          </span>
          <span className="text-amber-400">t* = {stats.otsuThreshold}</span>
        </div>
        <div className="bg-slate-950 rounded p-1 border border-slate-800">
          <canvas ref={histogramCanvasRef} width={256} height={50} className="w-full h-12 block" />
        </div>
        <div className="flex justify-between text-[9px] text-slate-400">
          <span>0 (Stable)</span>
          <span className="text-sky-400">Cyan: Between-class variance σ_B²</span>
          <span>255 (Max Δ)</span>
        </div>
      </div>

      {/* Table 3: Spectral Index Deltas */}
      <div className="rounded-lg border border-slate-800 bg-slate-900/60 overflow-hidden shadow-sm">
        <div className="px-3 py-1.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-[11px] text-slate-300 font-bold uppercase tracking-wider">
          <div className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            <span>Spectral Index Deltas</span>
          </div>
        </div>

        <table className="w-full text-left border-collapse text-[11px]">
          <tbody>
            <tr className="border-b border-slate-850 hover:bg-slate-900/40">
              <td className="px-3 py-1.5 text-slate-400">Mean ΔNDVI (Canopy)</td>
              <td className={`px-3 py-1.5 text-right font-bold ${stats.meanNDVIDelta < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {stats.meanNDVIDelta > 0 ? '+' : ''}{stats.meanNDVIDelta}
              </td>
            </tr>
            <tr className="border-b border-slate-850 hover:bg-slate-900/40">
              <td className="px-3 py-1.5 text-slate-400">Mean ΔNDWI (Water/Moisture)</td>
              <td className={`px-3 py-1.5 text-right font-bold ${stats.meanNDWIDelta < 0 ? 'text-amber-400' : 'text-cyan-400'}`}>
                {stats.meanNDWIDelta > 0 ? '+' : ''}{stats.meanNDWIDelta}
              </td>
            </tr>
            <tr className="hover:bg-slate-900/40">
              <td className="px-3 py-1.5 text-slate-400">Mean ΔEVI (Biomass Proxy)</td>
              <td className="px-3 py-1.5 text-right text-teal-300 font-bold">
                {stats.meanEVIDelta > 0 ? '+' : ''}{stats.meanEVIDelta}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Table 4: Spatial Quadrant Distribution */}
      <div className="rounded-lg border border-slate-800 bg-slate-900/60 overflow-hidden shadow-sm">
        <div className="px-3 py-1.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-[11px] text-slate-300 font-bold uppercase tracking-wider">
          <div className="flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-indigo-400" />
            <span>Quadrant Breakdown</span>
          </div>
          <span className="text-[10px] text-slate-400 font-normal">Hover to focus</span>
        </div>

        <table className="w-full text-left border-collapse text-[11px]">
          <tbody>
            <tr
              onMouseEnter={() => onHoverQuadrant('North-West')}
              onMouseLeave={() => onHoverQuadrant(null)}
              className={`border-b border-slate-850 cursor-pointer transition-colors ${
                hoveredQuadrant === 'North-West' ? 'bg-cyan-950/80 text-cyan-200' : 'hover:bg-slate-900/50'
              }`}
            >
              <td className="px-3 py-1.5 text-slate-400">North-West (NW)</td>
              <td className="px-3 py-1.5 text-right font-bold text-sky-400">
                {stats.spatialDistribution.northWest}%
              </td>
            </tr>
            <tr
              onMouseEnter={() => onHoverQuadrant('North-East')}
              onMouseLeave={() => onHoverQuadrant(null)}
              className={`border-b border-slate-850 cursor-pointer transition-colors ${
                hoveredQuadrant === 'North-East' ? 'bg-cyan-950/80 text-cyan-200' : 'hover:bg-slate-900/50'
              }`}
            >
              <td className="px-3 py-1.5 text-slate-400">North-East (NE)</td>
              <td className="px-3 py-1.5 text-right font-bold text-sky-400">
                {stats.spatialDistribution.northEast}%
              </td>
            </tr>
            <tr
              onMouseEnter={() => onHoverQuadrant('South-West')}
              onMouseLeave={() => onHoverQuadrant(null)}
              className={`border-b border-slate-850 cursor-pointer transition-colors ${
                hoveredQuadrant === 'South-West' ? 'bg-cyan-950/80 text-cyan-200' : 'hover:bg-slate-900/50'
              }`}
            >
              <td className="px-3 py-1.5 text-slate-400">South-West (SW)</td>
              <td className="px-3 py-1.5 text-right font-bold text-sky-400">
                {stats.spatialDistribution.southWest}%
              </td>
            </tr>
            <tr
              onMouseEnter={() => onHoverQuadrant('South-East')}
              onMouseLeave={() => onHoverQuadrant(null)}
              className={`cursor-pointer transition-colors ${
                hoveredQuadrant === 'South-East' ? 'bg-cyan-950/80 text-cyan-200' : 'hover:bg-slate-900/50'
              }`}
            >
              <td className="px-3 py-1.5 text-slate-400">South-East (SE)</td>
              <td className="px-3 py-1.5 text-right font-bold text-sky-400">
                {stats.spatialDistribution.southEast}%
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Table 5: Contiguous Clusters Table */}
      <div className="rounded-lg border border-slate-800 bg-slate-900/60 overflow-hidden shadow-sm">
        <div className="px-3 py-1.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-[11px] text-slate-300 font-bold uppercase tracking-wider">
          <span>Top Clusters (CCA 8-Connected)</span>
          <span className="text-[10px] text-slate-400 font-normal">Click to highlight</span>
        </div>

        <div className="divide-y divide-slate-850">
          {stats.topClusters.map((cluster) => {
            const isSelected = activeClusterId === cluster.id;
            return (
              <button
                key={cluster.id}
                onClick={() => onSelectCluster(isSelected ? null : cluster.id)}
                className={`w-full p-2.5 text-left text-[11px] transition-colors flex items-center justify-between ${
                  isSelected
                    ? 'bg-cyan-950/90 text-cyan-200 border-l-2 border-cyan-400'
                    : 'hover:bg-slate-900/50 text-slate-300 border-l-2 border-transparent'
                }`}
              >
                <div>
                  <div className="font-bold text-amber-300">Cluster #{cluster.id} ({cluster.quadrant})</div>
                  <div className="text-[10px] text-slate-400 truncate max-w-[180px]">{cluster.dominantShift}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-slate-100">{cluster.areaPercentage.toFixed(1)}%</div>
                  <div className="text-[10px] text-slate-400">{cluster.pixelCount.toLocaleString()} px</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
