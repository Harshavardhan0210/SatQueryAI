import React, { useState } from 'react';
import { 
  Bot, 
  Table, 
  PanelRightClose, 
  Columns, 
  ShieldCheck 
} from 'lucide-react';
import { EvidencePanel } from './EvidencePanel';
import { QueryAssistant } from './QueryAssistant';
import { ChangeStats, OtsuResult } from '../pipeline/changeDetection';
import { SampleDataset } from '../pipeline/sampleData';

interface RightPanelProps {
  stats: ChangeStats | null;
  otsu: OtsuResult | null;
  currentDataset: SampleDataset | null;
  activeClusterId: number | null;
  onSelectCluster: (clusterId: number | null) => void;
  hoveredQuadrant: string | null;
  onHoverQuadrant: (quadrant: string | null) => void;
  onClose: () => void;
}

type RightTab = 'assistant' | 'evidence' | 'split';

export const RightPanel: React.FC<RightPanelProps> = ({
  stats,
  otsu,
  currentDataset,
  activeClusterId,
  onSelectCluster,
  hoveredQuadrant,
  onHoverQuadrant,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<RightTab>('split');

  return (
    <aside className="w-96 flex-shrink-0 bg-slate-950 border-l border-slate-800/80 flex flex-col h-full overflow-hidden select-none">
      {/* Top Tabs Bar */}
      <div className="h-10 px-3 bg-slate-950 border-b border-slate-800/80 flex items-center justify-between text-xs font-mono">
        {/* Tab switchers */}
        <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800">
          <button
            onClick={() => setActiveTab('split')}
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] transition-colors ${
              activeTab === 'split'
                ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Split: Evidence Table + Assistant"
          >
            <Columns className="w-3 h-3" />
            <span>Split</span>
          </button>

          <button
            onClick={() => setActiveTab('assistant')}
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] transition-colors ${
              activeTab === 'assistant'
                ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="AI Query Assistant"
          >
            <Bot className="w-3 h-3" />
            <span>Chat</span>
          </button>

          <button
            onClick={() => setActiveTab('evidence')}
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] transition-colors ${
              activeTab === 'evidence'
                ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Evidence Data Table"
          >
            <Table className="w-3 h-3" />
            <span>Metrics</span>
          </button>
        </div>

        {/* Collapse button */}
        <button
          onClick={onClose}
          className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition-colors"
          title="Collapse Panel (Map Full Width)"
        >
          <PanelRightClose className="w-4 h-4" />
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-3 flex flex-col gap-3 overflow-hidden">
        {/* TAB 1: Split View */}
        {activeTab === 'split' && (
          <>
            {/* Top Half: Evidence Data Table (42%) */}
            <div className="h-[42%] overflow-hidden flex flex-col">
              <EvidencePanel
                stats={stats}
                otsu={otsu}
                activeClusterId={activeClusterId}
                onSelectCluster={onSelectCluster}
                hoveredQuadrant={hoveredQuadrant}
                onHoverQuadrant={onHoverQuadrant}
              />
            </div>

            {/* Bottom Half: Query Assistant (58%) */}
            <div className="flex-1 overflow-hidden flex flex-col">
              <QueryAssistant
                stats={stats}
                currentDataset={currentDataset}
              />
            </div>
          </>
        )}

        {/* TAB 2: Full Assistant */}
        {activeTab === 'assistant' && (
          <div className="flex-1 overflow-hidden flex flex-col">
            <QueryAssistant
              stats={stats}
              currentDataset={currentDataset}
            />
          </div>
        )}

        {/* TAB 3: Full Evidence Data Table */}
        {activeTab === 'evidence' && (
          <div className="flex-1 overflow-hidden flex flex-col">
            <EvidencePanel
              stats={stats}
              otsu={otsu}
              activeClusterId={activeClusterId}
              onSelectCluster={onSelectCluster}
              hoveredQuadrant={hoveredQuadrant}
              onHoverQuadrant={onHoverQuadrant}
            />
          </div>
        )}
      </div>
    </aside>
  );
};
