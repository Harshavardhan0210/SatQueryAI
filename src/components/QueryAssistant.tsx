import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Sparkles, 
  Bot, 
  User, 
  ShieldCheck, 
  Copy, 
  Check, 
  Clock, 
  Terminal
} from 'lucide-react';
import { ChangeStats } from '../pipeline/changeDetection';
import { SampleDataset } from '../pipeline/sampleData';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  citedMetrics?: {
    percentChanged?: number;
    dominantShift?: string;
    otsuThreshold?: number;
    meanNDVIDelta?: number;
    quadrant?: string;
  };
  mode?: string;
}

interface QueryAssistantProps {
  stats: ChangeStats | null;
  currentDataset: SampleDataset | null;
}

export const QueryAssistant: React.FC<QueryAssistantProps> = ({
  stats,
  currentDataset,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: 'I am SatQueryAI, your explainable satellite change assistant. Ask me questions about this scene—I will interpret the deterministic spectral metrics, Otsu threshold results, and spatial cluster distributions strictly without hallucination.',
      timestamp: 'Ready',
    },
  ]);
  const [inputQuery, setInputQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // When dataset changes, add a notification suggestion
  useEffect(() => {
    if (currentDataset) {
      setMessages((prev) => [
        ...prev,
        {
          id: `dataset-${Date.now()}`,
          sender: 'assistant',
          text: `Loaded scenario: "${currentDataset.name}" (${currentDataset.beforeDate} → ${currentDataset.afterDate}). Deterministic spectral change pipeline has analyzed ${stats?.totalPixels?.toLocaleString() || 'all'} pixels. Try asking one of the suggested queries below.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  }, [currentDataset?.id]);

  const handleSubmit = async (queryText?: string) => {
    const q = (queryText || inputQuery).trim();
    if (!q || !stats || isLoading) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: q,
          stats: {
            ...stats,
            sceneName: currentDataset?.name,
            beforeDate: currentDataset?.beforeDate,
            afterDate: currentDataset?.afterDate,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const data = await response.json();

      const assistantMsg: Message = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: data.explanation || 'No explanation returned.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        citedMetrics: {
          percentChanged: stats.percentChanged,
          dominantShift: stats.dominantChangeType,
          otsuThreshold: stats.otsuThreshold,
          meanNDVIDelta: stats.meanNDVIDelta,
          quadrant: stats.topClusters?.[0]?.quadrant,
        },
        mode: data.mode,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error('Explanation request failed:', err);
      const fallbackText = `According to our mathematical pipeline: ${stats.percentChanged}% of the scene area changed between the observations (Otsu threshold index: ${stats.otsuThreshold}/255). The dominant dynamic is ${stats.dominantChangeType}. The mean NDVI canopy shift is ${stats.meanNDVIDelta > 0 ? '+' : ''}${stats.meanNDVIDelta}, and mean NDWI moisture shift is ${stats.meanNDWIDelta > 0 ? '+' : ''}${stats.meanNDWIDelta}. The highest change cluster is in the ${stats.topClusters?.[0]?.quadrant || 'North-East'} quadrant representing ${stats.topClusters?.[0]?.areaPercentage.toFixed(1) || stats.percentChanged}% of pixels.`;

      setMessages((prev) => [
        ...prev,
        {
          id: `fallback-${Date.now()}`,
          sender: 'assistant',
          text: fallbackText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          citedMetrics: {
            percentChanged: stats.percentChanged,
            dominantShift: stats.dominantChangeType,
          },
          mode: 'deterministic-local-fallback',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 rounded-lg overflow-hidden border border-slate-800/80 shadow-md">
      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3 font-mono text-xs">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.sender === 'assistant' && (
              <div className="w-6 h-6 rounded bg-cyan-950 border border-cyan-700/60 flex items-center justify-center text-cyan-300 shrink-0 mt-0.5">
                <Bot className="w-3.5 h-3.5" />
              </div>
            )}

            <div
              className={`max-w-[85%] rounded-lg p-2.5 leading-relaxed space-y-1.5 ${
                msg.sender === 'user'
                  ? 'bg-cyan-600 text-white rounded-tr-none'
                  : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none shadow'
              }`}
            >
              <div className="whitespace-pre-wrap">{msg.text}</div>

              {/* Cited Evidence Footnotes */}
              {msg.citedMetrics && (
                <div className="pt-1.5 border-t border-slate-850 mt-1.5 flex flex-wrap gap-1 text-[10px]">
                  {msg.citedMetrics.percentChanged !== undefined && (
                    <span className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-amber-300">
                      Δ Area: {msg.citedMetrics.percentChanged}%
                    </span>
                  )}
                  {msg.citedMetrics.meanNDVIDelta !== undefined && (
                    <span className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-emerald-300">
                      ΔNDVI: {msg.citedMetrics.meanNDVIDelta}
                    </span>
                  )}
                  {msg.citedMetrics.otsuThreshold !== undefined && (
                    <span className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-cyan-300">
                      Otsu t*: {msg.citedMetrics.otsuThreshold}
                    </span>
                  )}
                </div>
              )}

              {/* Message Footer: Timestamp and Copy */}
              <div className="flex items-center justify-between pt-0.5 text-[9px] text-slate-400">
                <span className="flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" />
                  <span>{msg.timestamp}</span>
                </span>
                {msg.sender === 'assistant' && (
                  <button
                    onClick={() => handleCopy(msg.id, msg.text)}
                    className="hover:text-slate-200 transition-colors p-0.5"
                    title="Copy response"
                  >
                    {copiedId === msg.id ? (
                      <Check className="w-2.5 h-2.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-2.5 h-2.5" />
                    )}
                  </button>
                )}
              </div>
            </div>

            {msg.sender === 'user' && (
              <div className="w-6 h-6 rounded bg-sky-900 border border-sky-600 flex items-center justify-center text-sky-200 shrink-0 mt-0.5">
                <User className="w-3.5 h-3.5" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-2.5 items-center">
            <div className="w-6 h-6 rounded bg-cyan-950 border border-cyan-700/60 flex items-center justify-center text-cyan-300 shrink-0">
              <Bot className="w-3.5 h-3.5 animate-spin" />
            </div>
            <div className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-cyan-300 font-mono text-xs flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
              <span>Grounding explanation in deterministic metrics...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompt Chips */}
      {currentDataset && currentDataset.suggestedQueries.length > 0 && (
        <div className="px-3 py-2 bg-slate-900/60 border-t border-slate-850">
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400 mb-1.5">
            <Sparkles className="w-3 h-3 text-cyan-400" />
            <span>Suggested Queries:</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {currentDataset.suggestedQueries.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSubmit(q)}
                disabled={isLoading}
                className="px-2 py-1 rounded bg-slate-950 hover:bg-cyan-950 border border-slate-800 hover:border-cyan-600/50 text-[10px] font-mono text-slate-300 hover:text-cyan-200 transition-colors text-left"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Query Input Box */}
      <div className="p-2.5 bg-slate-900 border-t border-slate-800">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder='Ask: "What changed here since March?"'
            disabled={isLoading || !stats}
            className="flex-1 bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded px-2.5 py-1.5 text-xs font-mono text-slate-100 placeholder-slate-500 outline-none transition-colors"
          />
          <button
            type="submit"
            disabled={isLoading || !inputQuery.trim() || !stats}
            className="px-3 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-mono text-xs flex items-center gap-1.5 transition-colors"
          >
            <Send className="w-3 h-3" />
            <span>Ask</span>
          </button>
        </form>
      </div>
    </div>
  );
};
