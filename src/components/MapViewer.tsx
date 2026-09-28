import React, { useState, useEffect, useRef } from 'react';
import { 
  Split, 
  Map as MapIcon, 
  Columns, 
  Maximize2,
  BoxSelect,
  Compass,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import L from 'leaflet';
import { 
  PipelineOutput, 
  OverlayMode, 
  renderOverlayToImageData 
} from '../pipeline/changeDetection';
import { SampleDataset } from '../pipeline/sampleData';

interface MapViewerProps {
  beforeImg: ImageData | null;
  afterImg: ImageData | null;
  pipelineOutput: PipelineOutput | null;
  currentDataset: SampleDataset | null;
  activeClusterId: number | null;
  onSelectCluster: (clusterId: number | null) => void;
  hoveredQuadrant: string | null;
  overlayMode: OverlayMode;
  showOverlay: boolean;
  overlayOpacity: number;
  showClusters: boolean;
  showQuadrants: boolean;
}

type ViewMode = 'slider' | 'leaflet' | 'side-by-side';

export const MapViewer: React.FC<MapViewerProps> = ({
  beforeImg,
  afterImg,
  pipelineOutput,
  currentDataset,
  activeClusterId,
  onSelectCluster,
  hoveredQuadrant,
  overlayMode,
  showOverlay,
  overlayOpacity,
  showClusters,
  showQuadrants,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('slider');
  const [sliderPosition, setSliderPosition] = useState<number>(50); // 0 to 100%
  const [isDraggingSlider, setIsDraggingSlider] = useState<boolean>(false);
  const [mouseCoord, setMouseCoord] = useState<{ x: number; y: number; quadrant: string } | null>(null);

  // Cached canvas URLs
  const [beforeDataUrl, setBeforeDataUrl] = useState<string>('');
  const [afterDataUrl, setAfterDataUrl] = useState<string>('');
  const [overlayDataUrl, setOverlayDataUrl] = useState<string>('');

  const sliderContainerRef = useRef<HTMLDivElement>(null);
  const leafletContainerRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const leafletOverlayLayerRef = useRef<L.ImageOverlay | null>(null);
  const leafletBoxesGroupRef = useRef<L.LayerGroup | null>(null);

  // Convert ImageData to Data URLs
  useEffect(() => {
    if (!beforeImg || !afterImg) return;

    const cBefore = document.createElement('canvas');
    cBefore.width = beforeImg.width;
    cBefore.height = beforeImg.height;
    cBefore.getContext('2d')!.putImageData(beforeImg, 0, 0);
    setBeforeDataUrl(cBefore.toDataURL());

    const cAfter = document.createElement('canvas');
    cAfter.width = afterImg.width;
    cAfter.height = afterImg.height;
    cAfter.getContext('2d')!.putImageData(afterImg, 0, 0);
    setAfterDataUrl(cAfter.toDataURL());
  }, [beforeImg, afterImg]);

  // Update overlay layer when pipeline output or overlay mode changes
  useEffect(() => {
    if (!pipelineOutput) {
      setOverlayDataUrl('');
      return;
    }

    const overlayImgData = renderOverlayToImageData(pipelineOutput, overlayMode, overlayOpacity);
    const cOverlay = document.createElement('canvas');
    cOverlay.width = overlayImgData.width;
    cOverlay.height = overlayImgData.height;
    cOverlay.getContext('2d')!.putImageData(overlayImgData, 0, 0);
    setOverlayDataUrl(cOverlay.toDataURL());
  }, [pipelineOutput, overlayMode, overlayOpacity]);

  // Initialize or update Leaflet Map
  useEffect(() => {
    if (viewMode !== 'leaflet' || !leafletContainerRef.current || !afterDataUrl) return;

    if (!leafletMapRef.current) {
      const map = L.map(leafletContainerRef.current, {
        crs: L.CRS.Simple,
        minZoom: -1,
        maxZoom: 3,
        zoomControl: false,
        attributionControl: false,
      });

      const bounds: L.LatLngBoundsExpression = [[0, 0], [512, 512]];
      L.imageOverlay(afterDataUrl, bounds).addTo(map);
      map.fitBounds(bounds);

      const boxesGroup = L.layerGroup().addTo(map);
      leafletBoxesGroupRef.current = boxesGroup;
      leafletMapRef.current = map;
    } else {
      const bounds: L.LatLngBoundsExpression = [[0, 0], [512, 512]];
      leafletMapRef.current.eachLayer((layer) => {
        if (layer instanceof L.ImageOverlay && layer !== leafletOverlayLayerRef.current) {
          layer.setUrl(afterDataUrl);
        }
      });
    }
  }, [viewMode, afterDataUrl]);

  // Sync Leaflet Overlay & Clusters
  useEffect(() => {
    if (viewMode !== 'leaflet' || !leafletMapRef.current) return;
    const map = leafletMapRef.current;
    const bounds: L.LatLngBoundsExpression = [[0, 0], [512, 512]];

    if (leafletOverlayLayerRef.current) {
      map.removeLayer(leafletOverlayLayerRef.current);
      leafletOverlayLayerRef.current = null;
    }

    if (showOverlay && overlayDataUrl) {
      const overlayLayer = L.imageOverlay(overlayDataUrl, bounds, { opacity: overlayOpacity });
      overlayLayer.addTo(map);
      leafletOverlayLayerRef.current = overlayLayer;
    }

    // Update Cluster bounding boxes
    if (leafletBoxesGroupRef.current) {
      leafletBoxesGroupRef.current.clearLayers();
      if (showClusters && pipelineOutput?.stats.topClusters) {
        pipelineOutput.stats.topClusters.forEach((c) => {
          const y1 = 512 - c.pixelBbox[2];
          const y2 = 512 - c.pixelBbox[0];
          const x1 = c.pixelBbox[1];
          const x2 = c.pixelBbox[3];

          const isSelected = activeClusterId === c.id;
          const rect = L.rectangle([[y1, x1], [y2, x2]], {
            color: isSelected ? '#38bdf8' : '#f59e0b',
            weight: isSelected ? 3 : 1.5,
            fillOpacity: isSelected ? 0.35 : 0.15,
            dashArray: isSelected ? undefined : '4, 4',
          });

          rect.bindPopup(`
            <div class="text-xs font-mono p-1">
              <strong class="text-cyan-400">Cluster #${c.id} (${c.quadrant})</strong><br/>
              <span>Area: ${c.areaPercentage.toFixed(1)}% (${c.pixelCount} px)</span><br/>
              <span class="text-amber-300">${c.dominantShift}</span><br/>
              <span>ΔNDVI: ${c.meanDeltaNDVI.toFixed(3)}</span>
            </div>
          `);

          rect.on('click', () => {
            onSelectCluster(c.id);
          });

          rect.addTo(leafletBoxesGroupRef.current!);
        });
      }
    }
  }, [viewMode, showOverlay, overlayDataUrl, overlayOpacity, showClusters, pipelineOutput, activeClusterId]);

  // Handle Dragging Slider
  const handleMouseDown = () => setIsDraggingSlider(true);
  const handleMouseUp = () => setIsDraggingSlider(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!sliderContainerRef.current) return;
    const rect = sliderContainerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height));

    const normX = (x / rect.width) * 100;
    const normY = (y / rect.height) * 100;

    let quadrant = 'Central';
    if (normX < 50 && normY < 50) quadrant = 'North-West';
    else if (normX >= 50 && normY < 50) quadrant = 'North-East';
    else if (normX < 50 && normY >= 50) quadrant = 'South-West';
    else quadrant = 'South-East';

    setMouseCoord({ x: Math.round(normX), y: Math.round(normY), quadrant });

    if (isDraggingSlider) {
      setSliderPosition((x / rect.width) * 100);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!sliderContainerRef.current) return;
    const rect = sliderContainerRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    const x = Math.max(0, Math.min(touch.clientX - rect.left, rect.width));
    setSliderPosition((x / rect.width) * 100);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-hidden relative select-none">
      {/* Top Map View Controls Bar */}
      <div className="h-10 px-4 bg-slate-950 border-b border-slate-800/80 flex items-center justify-between text-xs font-mono">
        {/* Mode Selector */}
        <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800">
          <button
            onClick={() => setViewMode('slider')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-all ${
              viewMode === 'slider'
                ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Split className="w-3.5 h-3.5" />
            <span>Split Slider</span>
          </button>

          <button
            onClick={() => setViewMode('leaflet')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-all ${
              viewMode === 'leaflet'
                ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <MapIcon className="w-3.5 h-3.5" />
            <span>GIS Map</span>
          </button>

          <button
            onClick={() => setViewMode('side-by-side')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-all ${
              viewMode === 'side-by-side'
                ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Columns className="w-3.5 h-3.5" />
            <span>Side-by-Side</span>
          </button>
        </div>

        {/* Center / Right Scene Tag */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
            <span className="text-slate-400">Layer:</span>
            <span className="text-cyan-300 font-medium uppercase">{overlayMode}</span>
          </div>
          {currentDataset && (
            <span className="text-slate-400 text-[11px] hidden sm:inline">
              ({currentDataset.resolution})
            </span>
          )}
        </div>
      </div>

      {/* Main Viewport Container */}
      <div 
        ref={sliderContainerRef}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onTouchMove={handleTouchMove}
        className="relative flex-1 bg-slate-950 flex items-center justify-center overflow-hidden cursor-crosshair p-2 sm:p-4"
      >
        {/* VIEW 1: Split Slider */}
        {viewMode === 'slider' && (
          <div className="relative w-full h-full max-w-[800px] max-h-[800px] aspect-square shadow-2xl overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
            {/* Base Image (AFTER Observation) */}
            <div className="absolute inset-0">
              <img 
                src={afterDataUrl} 
                alt="After Observation" 
                className="w-full h-full object-cover transition-opacity duration-200" 
              />
              {/* Overlay on After side */}
              {showOverlay && overlayDataUrl && (
                <img
                  src={overlayDataUrl}
                  alt="Change Overlay"
                  className="absolute inset-0 w-full h-full object-cover pointer-events-none transition-opacity duration-200"
                  style={{ opacity: overlayOpacity }}
                />
              )}
            </div>

            {/* Split Top Image (BEFORE Observation) clipped by slider */}
            <div 
              className="absolute inset-0 overflow-hidden"
              style={{ width: `${sliderPosition}%` }}
            >
              <img 
                src={beforeDataUrl} 
                alt="Before Observation" 
                className="absolute inset-0 w-full h-full object-cover max-w-none"
                style={{ width: '100%', height: '100%' }}
              />
              {/* Label Before */}
              <div className="absolute top-3.5 left-3.5 px-2.5 py-1 rounded-md bg-slate-950/85 backdrop-blur-md border border-slate-700 text-emerald-400 font-mono text-[11px] font-bold shadow-md z-10 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>BEFORE ({currentDataset?.beforeDate || 'T0'})</span>
              </div>
            </div>

            {/* Label After */}
            <div className="absolute top-3.5 right-3.5 px-2.5 py-1 rounded-md bg-slate-950/85 backdrop-blur-md border border-slate-700 text-sky-400 font-mono text-[11px] font-bold shadow-md z-10 flex items-center gap-1.5">
              <span>AFTER ({currentDataset?.afterDate || 'T1'})</span>
              <span className="w-2 h-2 rounded-full bg-sky-400" />
            </div>

            {/* Bounding Box Clusters Overlay */}
            {showClusters && pipelineOutput?.stats.topClusters && (
              <div className="absolute inset-0 pointer-events-none z-20">
                {pipelineOutput.stats.topClusters.map((cluster) => {
                  const isSelected = activeClusterId === cluster.id;
                  const [ymin, xmin, ymax, xmax] = cluster.bbox;
                  return (
                    <div
                      key={cluster.id}
                      className={`absolute border transition-all ${
                        isSelected 
                          ? 'border-cyan-400 bg-cyan-400/25 ring-2 ring-cyan-400 shadow-lg shadow-cyan-500/50' 
                          : 'border-amber-400/80 bg-amber-500/10 hover:border-amber-300'
                      }`}
                      style={{
                        top: `${ymin}%`,
                        left: `${xmin}%`,
                        width: `${Math.max(4, xmax - xmin)}%`,
                        height: `${Math.max(4, ymax - ymin)}%`,
                      }}
                    >
                      <div className="absolute -top-5 left-0 px-1 py-0.5 rounded bg-slate-950/90 border border-slate-700 text-[10px] font-mono text-amber-300 whitespace-nowrap shadow">
                        #{cluster.id} ({cluster.areaPercentage.toFixed(1)}%)
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* 4-Quadrant Grid Overlay */}
            {showQuadrants && (
              <div className="absolute inset-0 pointer-events-none z-15 border border-indigo-500/30">
                <div className="absolute top-0 bottom-0 left-1/2 w-px bg-indigo-500/40 border-dashed" />
                <div className="absolute left-0 right-0 top-1/2 h-px bg-indigo-500/40 border-dashed" />
                <span className="absolute top-8 left-8 text-xs font-mono text-indigo-300 bg-slate-950/80 px-2 py-0.5 rounded border border-indigo-500/40">
                  NW: {pipelineOutput?.stats.spatialDistribution.northWest}%
                </span>
                <span className="absolute top-8 right-8 text-xs font-mono text-indigo-300 bg-slate-950/80 px-2 py-0.5 rounded border border-indigo-500/40">
                  NE: {pipelineOutput?.stats.spatialDistribution.northEast}%
                </span>
                <span className="absolute bottom-8 left-8 text-xs font-mono text-indigo-300 bg-slate-950/80 px-2 py-0.5 rounded border border-indigo-500/40">
                  SW: {pipelineOutput?.stats.spatialDistribution.southWest}%
                </span>
                <span className="absolute bottom-8 right-8 text-xs font-mono text-indigo-300 bg-slate-950/80 px-2 py-0.5 rounded border border-indigo-500/40">
                  SE: {pipelineOutput?.stats.spatialDistribution.southEast}%
                </span>
              </div>
            )}

            {/* Quadrant highlight when hovered from evidence panel */}
            {hoveredQuadrant && (
              <div 
                className="absolute inset-0 pointer-events-none z-25 bg-cyan-500/15 border-2 border-cyan-400 transition-all"
                style={{
                  top: hoveredQuadrant.includes('North') ? '0%' : '50%',
                  bottom: hoveredQuadrant.includes('North') ? '50%' : '0%',
                  left: hoveredQuadrant.includes('West') ? '0%' : '50%',
                  right: hoveredQuadrant.includes('West') ? '50%' : '0%',
                }}
              >
                <div className="absolute top-2 left-2 px-2 py-1 rounded bg-slate-950/95 text-cyan-300 font-mono text-xs border border-cyan-500/50 shadow-lg">
                  Focused: {hoveredQuadrant} Quadrant
                </div>
              </div>
            )}

            {/* Draggable Divider Handle */}
            <div 
              className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize z-30 shadow-[0_0_12px_rgba(255,255,255,0.8)]"
              style={{ left: `${sliderPosition}%` }}
            >
              <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-slate-950 border-2 border-white flex items-center justify-center shadow-xl text-white">
                <Split className="w-3.5 h-3.5 rotate-90" />
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: Leaflet GIS Map */}
        {viewMode === 'leaflet' && (
          <div className="relative w-full h-full min-h-[460px] rounded-xl overflow-hidden border border-slate-800 bg-slate-900 shadow-2xl">
            <div ref={leafletContainerRef} className="w-full h-full min-h-[460px]" />
          </div>
        )}

        {/* VIEW 3: Side-by-Side View */}
        {viewMode === 'side-by-side' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full h-full max-w-[1200px] p-2">
            <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-900 shadow-xl aspect-square max-h-[550px] mx-auto">
              <img src={beforeDataUrl} alt="Before" className="w-full h-full object-cover" />
              <div className="absolute top-3 left-3 px-2 py-1 rounded bg-slate-950/80 border border-slate-700 text-emerald-400 font-mono text-xs">
                BEFORE ({currentDataset?.beforeDate || 'T0'})
              </div>
            </div>

            <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-900 shadow-xl aspect-square max-h-[550px] mx-auto">
              <img src={afterDataUrl} alt="After" className="w-full h-full object-cover" />
              {showOverlay && overlayDataUrl && (
                <img
                  src={overlayDataUrl}
                  alt="Overlay"
                  className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                  style={{ opacity: overlayOpacity }}
                />
              )}
              <div className="absolute top-3 right-3 px-2 py-1 rounded bg-slate-950/80 border border-slate-700 text-sky-400 font-mono text-xs">
                AFTER + {overlayMode.toUpperCase()}
              </div>
            </div>
          </div>
        )}

        {/* Bottom Left Coordinate Readout */}
        <div className="absolute bottom-3 left-4 z-30 flex items-center gap-2 px-2.5 py-1 rounded-md bg-slate-950/85 backdrop-blur-md border border-slate-800 text-[11px] font-mono text-slate-400 pointer-events-none">
          {mouseCoord ? (
            <>
              <span className="text-cyan-300">Coord: {mouseCoord.x}%, {mouseCoord.y}%</span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-300">{mouseCoord.quadrant}</span>
            </>
          ) : (
            <span>Hover to inspect coordinates</span>
          )}
        </div>
      </div>
    </div>
  );
};
