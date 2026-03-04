import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, AlertCircle, Copy, Check, Loader2, Terminal, Zap, Info } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { toast } from 'react-hot-toast';

interface ErrorShortenerProps {
  theme: 'light' | 'dark';
  initialError?: string | null;
  onClearInitialError?: () => void;
}

export const ErrorShortener: React.FC<ErrorShortenerProps> = ({ theme, initialError, onClearInitialError }) => {
  const [input, setInput] = useState(initialError || '');
  const [output, setOutput] = useState<{ summary: string; explanation: string; solution: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  React.useEffect(() => {
    if (initialError) {
      setInput(initialError);
      // Automatically trigger analysis if initialError is provided
      const timer = setTimeout(() => {
        handleShorten(initialError);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [initialError]);

  const handleShorten = async (overrideInput?: string | React.MouseEvent) => {
    let textToProcess = input;
    if (typeof overrideInput === 'string') {
      textToProcess = overrideInput;
    }
    
    if (!textToProcess || !textToProcess.trim()) {
      toast.error('Please paste an error message first');
      return;
    }

    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Shorten and explain this error message. Provide a JSON response with the following fields:
        - summary: A 1-sentence concise summary of the error.
        - explanation: A clear, simple explanation of why it happened.
        - solution: A step-by-step fix or suggestion.

        Error message:
        ${textToProcess}`,
        config: {
          responseMimeType: "application/json",
        }
      });

      const result = JSON.parse(response.text || '{}');
      setOutput(result);
      if (onClearInitialError) onClearInitialError();
    } catch (error) {
      console.error('Gemini error:', error);
      toast.error('Failed to process error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!output) return;
    const text = `Summary: ${output.summary}\nExplanation: ${output.explanation}\nSolution: ${output.solution}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand/10 text-brand text-xs font-bold uppercase tracking-wider">
            <Zap size={14} />
            AI Powered
          </div>
          <h1 className="text-4xl sm:text-5xl font-display font-bold tracking-tight">
            Error <span className="text-brand">Shortener</span>
          </h1>
          <p className="text-gray-500 max-w-xl mx-auto">
            Paste long, messy stack traces or error logs and get a concise summary and solution in seconds.
          </p>
        </div>

        <div className="space-y-4">
          <div className={`${theme === 'dark' ? "bg-white/5 border-white/10" : "bg-white border-gray-200 shadow-sm"} rounded-2xl border p-4 transition-all`}>
            <div className="flex items-center gap-2 mb-3 text-xs font-bold uppercase tracking-widest text-gray-500">
              <Terminal size={14} />
              Paste Error Log
            </div>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Paste your long error message or stack trace here..."
              className="w-full h-48 bg-transparent border-none focus:ring-0 resize-none font-mono text-sm placeholder:text-gray-600"
            />
          </div>

          <button
            onClick={handleShorten}
            disabled={loading || !input.trim()}
            className="w-full py-4 bg-brand text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-brand/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-brand/20"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                Analyzing Error...
              </>
            ) : (
              <>
                <Sparkles size={20} />
                Shorten & Explain
              </>
            )}
          </button>
        </div>

        <AnimatePresence>
          {output && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`${theme === 'dark' ? "bg-white/5 border-white/10" : "bg-white border-gray-200 shadow-sm"} rounded-2xl border overflow-hidden`}
            >
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-brand font-bold uppercase tracking-widest text-xs">
                    <CheckCircle2 size={16} />
                    Analysis Complete
                  </div>
                  <button
                    onClick={copyToClipboard}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
                  >
                    {copied ? <Check size={18} className="text-emerald-500" /> : <Copy size={18} />}
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-500">
                      <Info size={14} />
                      Summary
                    </div>
                    <p className="text-lg font-medium leading-relaxed">
                      {output.summary}
                    </p>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-500">
                        <AlertCircle size={14} />
                        Explanation
                      </div>
                      <p className="text-sm text-gray-400 leading-relaxed">
                        {output.explanation}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-500">
                        <Zap size={14} />
                        Solution
                      </div>
                      <p className="text-sm text-gray-400 leading-relaxed">
                        {output.solution}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

const CheckCircle2 = ({ size, className }: { size?: number; className?: string }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);
