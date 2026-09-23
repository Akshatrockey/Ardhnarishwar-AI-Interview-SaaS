import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useTenant } from '../../context/TenantContext';
import { ISpeechRecognitionConstructor, ISpeechRecognitionEvent, AIModelOption } from '../../types';
import { ApiClient } from '../../services/apiClient';
import { LocalEnterpriseEngine } from './localEngine';
import { 
  Bot, 
  MessageSquare, 
  X, 
  Send, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  Trash2, 
  Download,
  ChevronRight, 
  ChevronDown,
  Minimize2,
  Maximize2,
  RefreshCw,
  Cpu,
  Zap,
  ShieldCheck,
  AlertTriangle,
  Server
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
  mode: 'recruiter' | 'candidate';
  engine?: string;
  model?: string;
  fallback?: boolean;
  latencyMs?: number;
}

export const AIChatbox: React.FC = () => {
  const { t, currentLanguageOption } = useLanguage();
  const { currentUser } = useAuth();
  const { currentCompany } = useTenant();

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [chatMode, setChatMode] = useState<'recruiter' | 'candidate'>('recruiter');
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isListening, setIsListening] = useState<boolean>(false);
  const [ttsEnabled, setTtsEnabled] = useState<boolean>(false);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);

  // Multi-Engine Models State
  const [availableModels, setAvailableModels] = useState<AIModelOption[]>([
    {
      id: 'claude-3-5-sonnet-20241022',
      name: 'Anthropic Claude 3.5 Sonnet',
      engine: 'anthropic',
      description: 'State-of-the-art reasoning, deep technical interviewing & code analysis.',
      tier: 'production',
      is_configured: true,
      status: 'ONLINE'
    },
    {
      id: 'claude-3-5-haiku-20241022',
      name: 'Anthropic Claude 3.5 Haiku',
      engine: 'anthropic',
      description: 'Ultra-fast low-latency candidate guidance.',
      tier: 'production',
      is_configured: true,
      status: 'ONLINE'
    },
    {
      id: 'gemini-1.5-pro',
      name: 'Google Gemini 1.5 Pro',
      engine: 'gemini',
      description: 'Massive context multimodal reasoning.',
      tier: 'production',
      is_configured: true,
      status: 'ONLINE'
    },
    {
      id: 'gemini-1.5-flash',
      name: 'Google Gemini 1.5 Flash',
      engine: 'gemini',
      description: 'High-throughput low-latency live proctor.',
      tier: 'production',
      is_configured: true,
      status: 'ONLINE'
    },
    {
      id: 'meta-llama/Meta-Llama-3-70B-Instruct',
      name: 'Hugging Face Llama-3 70B',
      engine: 'huggingface',
      description: 'Open-weights foundation model for enterprise isolation.',
      tier: 'production',
      is_configured: true,
      status: 'ONLINE'
    },
    {
      id: 'ardhnarishwar-neural-enterprise-v4',
      name: 'Ardhnarishwar Neural Core (Local)',
      engine: 'local',
      description: 'Zero-latency air-gapped deterministic engine with 100% SLA.',
      tier: 'production',
      is_configured: true,
      status: 'ONLINE',
      default_fallback: true
    }
  ]);
  const [selectedModelId, setSelectedModelId] = useState<string>('claude-3-5-sonnet-20241022');
  const [showModelDropdown, setShowModelDropdown] = useState<boolean>(false);

  const selectedModel = availableModels.find(m => m.id === selectedModelId) || availableModels[0];

  // Messages with Persistent Session Memory
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem('ardhnarishwar_copilot_memory');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [
      {
        id: 'msg_welcome',
        sender: 'ai',
        text: `👋 Greetings! I am **Ardhnarishwar AI Global Copilot**, backed by our resilient **Multi-Engine Orchestrator** (Claude 3.5, Gemini 1.5, Llama-3 & Local Neural Core). How can I assist your hiring pipeline or technical preparation today?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        mode: 'recruiter',
        engine: 'anthropic',
        model: 'Claude 3.5 Sonnet'
      }
    ];
  });

  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const recognitionRef = useRef<any>(null);

  // Sync models from backend API
  useEffect(() => {
    async function loadModels() {
      try {
        const res = await ApiClient.getAiModels();
        if (res.data?.models && Array.isArray(res.data.models)) {
          setAvailableModels(res.data.models);
        }
      } catch (e) {
        // Fallback to initial models
      }
    }
    loadModels();
  }, []);

  // Save session memory on messages change
  useEffect(() => {
    try {
      localStorage.setItem('ardhnarishwar_copilot_memory', JSON.stringify(messages.slice(-20)));
    } catch {}
  }, [messages]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRec =
      (window as unknown as { SpeechRecognition?: ISpeechRecognitionConstructor; webkitSpeechRecognition?: ISpeechRecognitionConstructor }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: ISpeechRecognitionConstructor }).webkitSpeechRecognition;

    if (SpeechRec) {
      const recognition = new SpeechRec();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = currentLanguageOption.speechLang || 'en-US';

      recognition.onresult = (e: ISpeechRecognitionEvent) => {
        const transcript = e.results[0][0].transcript;
        setInputMessage(prev => (prev ? `${prev} ${transcript}` : transcript));
        setIsListening(false);
      };

      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognitionRef.current = recognition;
    }
  }, [currentLanguageOption]);

  const toggleMic = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in your browser.');
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.lang = currentLanguageOption.speechLang || 'en-US';
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.warn('Speech recognition error:', err);
      }
    }
  };

  const speakText = (text: string) => {
    if (!('speechSynthesis' in window) || !ttsEnabled) return;
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*_#`]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = currentLanguageOption.speechLang || 'en-US';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  const clearChatHistory = () => {
    const welcomeMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      sender: 'ai',
      text: `🔄 Session memory reset. How can I assist you with your hiring or candidate workflows today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      mode: chatMode
    };
    setMessages([welcomeMsg]);
    try {
      localStorage.removeItem('ardhnarishwar_copilot_memory');
    } catch {}
  };

  const handleExportChat = () => {
    const formatted = messages
      .map(m => `[${m.timestamp}] ${m.sender.toUpperCase()} (${m.model || m.engine || 'AI'}): ${m.text}\n`)
      .join('\n');
    const blob = new Blob([formatted], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Ardhnarishwar_AI_Copilot_Chat_${Date.now()}.txt`;
    link.click();
  };

  const streamFallbackResponse = async (userPrompt: string, aiMsgId: string) => {
    const fallbackRes = LocalEnterpriseEngine.generateResponse(
      userPrompt,
      chatMode,
      currentCompany?.displayName || currentCompany?.name || 'Ardhnarishwar Enterprise'
    );

    const words = fallbackRes.text.split(' ');
    let currentText = '';

    for (let i = 0; i < words.length; i++) {
      currentText += words[i] + (i < words.length - 1 ? ' ' : '');
      setMessages(prev => prev.map(m => {
        if (m.id === aiMsgId) {
          return {
            ...m,
            text: currentText,
            engine: fallbackRes.engine,
            model: fallbackRes.model,
            fallback: true,
            latencyMs: fallbackRes.latencyMs
          };
        }
        return m;
      }));
      await new Promise(r => setTimeout(r, 12));
    }

    if (ttsEnabled && fallbackRes.text) {
      speakText(fallbackRes.text);
    }
  };

  const handleSendMessage = async (promptToSend?: string) => {
    const text = (promptToSend || inputMessage).trim();
    if (!text || isStreaming) return;

    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      mode: chatMode
    };

    const aiMsgId = `ai_${Date.now()}`;
    const initialAiMsg: ChatMessage = {
      id: aiMsgId,
      sender: 'ai',
      text: '',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      mode: chatMode,
      model: selectedModel?.name || 'Multi-Engine',
      engine: selectedModel?.engine || 'local'
    };

    setMessages(prev => [...prev, userMsg, initialAiMsg]);
    setInputMessage('');
    setIsStreaming(true);

    try {
      const historyPayload = messages.slice(-6).map(m => ({
        sender: m.sender,
        text: m.text
      }));

      // Call Streaming SSE Endpoint
      const response = await fetch('/api/v1/ai/copilot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: text,
          mode: chatMode,
          model_id: selectedModelId,
          stream: true,
          history: historyPayload,
          company_name: currentCompany?.displayName || currentCompany?.name || 'Ardhnarishwar Enterprise'
        })
      });

      if (!response.ok || !response.body) {
        throw new Error(`HTTP ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let accumulatedText = '';
      let metaInfo: { engine?: string; model?: string; fallback?: boolean; latency_ms?: number } = {};
      let receivedAnyChunk = false;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.replace('data: ', '').trim());
              if (data.type === 'META') {
                metaInfo = data;
              } else if (data.type === 'TOKEN') {
                receivedAnyChunk = true;
                accumulatedText += data.content;
                setMessages(prev => prev.map(m => {
                  if (m.id === aiMsgId) {
                    return {
                      ...m,
                      text: accumulatedText,
                      engine: metaInfo.engine || m.engine,
                      model: metaInfo.model || m.model,
                      fallback: metaInfo.fallback,
                      latencyMs: metaInfo.latency_ms
                    };
                  }
                  return m;
                }));
              } else if (data.type === 'DONE') {
                if (ttsEnabled && accumulatedText) {
                  speakText(accumulatedText);
                }
              }
            } catch (e) {
              // Ignore chunk parse anomalies
            }
          }
        }
      }

      // If connection closed without receiving any tokens, trigger local fallback
      if (!receivedAnyChunk || !accumulatedText.trim()) {
        await streamFallbackResponse(text, aiMsgId);
      }

    } catch (err) {
      console.warn('Backend API stream unavailable, activating in-browser neural fallback:', err);
      // In-browser deterministic Local Enterprise Engine ensures 100% uptime with 0 failures
      try {
        await streamFallbackResponse(text, aiMsgId);
      } catch (fallbackErr) {
        console.error('Fallback generation error:', fallbackErr);
      }
    } finally {
      setIsStreaming(false);
    }
  };

  const quickPrompts = {
    recruiter: [
      'Write a Job Description for Senior Robotics Engineer',
      'Give 5 Hard Questions for ROS2 & Control Systems',
      'Draft an Interview Invitation Email with schedule details',
      'What rubric weights should I set for Technical vs Communication?',
    ],
    candidate: [
      'Simulate a mock question on STAR methodology',
      'How to explain a gap in my resume professionally?',
      'Give me tips for staying confident in a live AI camera interview',
      'What are the key concepts for Robotics Perception algorithms?',
    ]
  };

  return (
    <>
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-gradient-to-r from-cyan-600 via-indigo-600 to-purple-600 text-white shadow-2xl hover:shadow-cyan-500/30 transition-all duration-300 hover:scale-105 active:scale-95 flex items-center gap-3 border border-white/20 group cursor-pointer"
          title="Open Ardhnarishwar AI Copilot"
        >
          <div className="relative">
            <Bot className="w-6 h-6 animate-pulse" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-slate-900 animate-ping" />
          </div>
          <span className="text-xs font-black tracking-wide hidden sm:inline">AI Global Co-pilot</span>
        </button>
      )}

      {/* Main Chatbox Drawer / Modal */}
      {isOpen && (
        <div
          className={`fixed z-50 rounded-3xl bg-slate-950/95 border border-slate-800 shadow-2xl flex flex-col backdrop-blur-xl transition-all duration-300 ${
            isExpanded
              ? 'inset-4 sm:inset-10'
              : 'bottom-6 right-6 w-[94vw] sm:w-[460px] h-[640px] max-h-[85vh]'
          }`}
        >
          {/* Header */}
          <div className="p-4 rounded-t-3xl bg-slate-900/90 border-b border-slate-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-purple-600 flex items-center justify-center text-white font-extrabold shadow-md shadow-cyan-500/20">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-black text-white tracking-wide">AI Global Co-pilot</h3>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-cyan-950 text-cyan-400 border border-cyan-800 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                    Multi-Engine
                  </span>
                </div>

                {/* Model Selector Button */}
                <div className="relative mt-1">
                  <button
                    type="button"
                    onClick={() => setShowModelDropdown(!showModelDropdown)}
                    className="flex items-center gap-1 text-[11px] text-slate-300 hover:text-white bg-slate-950 px-2 py-0.5 rounded-lg border border-slate-800 transition-colors"
                  >
                    <Cpu className="w-3 h-3 text-cyan-400" />
                    <span className="font-semibold truncate max-w-[170px]">{selectedModel?.name}</span>
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  </button>

                  {/* Dropdown Menu */}
                  {showModelDropdown && (
                    <div className="absolute top-full left-0 mt-1.5 w-72 p-2 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl z-50 space-y-1 animate-in fade-in">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1">
                        Select Foundation Engine:
                      </div>
                      {availableModels.map(m => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => {
                            setSelectedModelId(m.id);
                            setShowModelDropdown(false);
                          }}
                          className={`w-full text-left p-2 rounded-xl text-xs flex items-start gap-2.5 transition-all ${
                            m.id === selectedModelId
                              ? 'bg-cyan-600 text-white font-bold'
                              : 'hover:bg-slate-800 text-slate-300'
                          }`}
                        >
                          <Zap className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${m.id === selectedModelId ? 'text-white' : 'text-cyan-400'}`} />
                          <div>
                            <div className="font-bold flex items-center gap-1.5">
                              <span>{m.name}</span>
                              {m.default_fallback && (
                                <span className="text-[8px] px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 font-mono">Core</span>
                              )}
                            </div>
                            <div className={`text-[10px] line-clamp-1 ${m.id === selectedModelId ? 'text-cyan-100' : 'text-slate-400'}`}>
                              {m.description}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Window Controls */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setTtsEnabled(!ttsEnabled)}
                className={`p-1.5 rounded-lg text-xs transition-colors ${
                  ttsEnabled ? 'text-cyan-400 bg-cyan-950' : 'text-slate-400 hover:text-white'
                }`}
                title={ttsEnabled ? 'Mute AI voice output' : 'Enable voice read-out'}
              >
                {ttsEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={clearChatHistory}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 transition-colors"
                title="Reset session memory"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleExportChat}
                className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 transition-colors"
                title="Export conversation history"
              >
                <Download className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white transition-colors hidden sm:block"
                title={isExpanded ? 'Collapse view' : 'Expand full-screen'}
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white transition-colors"
                title="Close Co-pilot"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Mode Switcher */}
          <div className="px-4 py-2 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-2">
            <div className="flex items-center bg-slate-900 p-0.5 rounded-xl border border-slate-800 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setChatMode('recruiter')}
                className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-[11px] font-extrabold transition-all ${
                  chatMode === 'recruiter'
                    ? 'bg-cyan-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Recruiter Assistant
              </button>
              <button
                type="button"
                onClick={() => setChatMode('candidate')}
                className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-[11px] font-extrabold transition-all ${
                  chatMode === 'candidate'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Candidate Coach
              </button>
            </div>

            <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">
              Session Memory Active
            </span>
          </div>

          {/* Message Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-thin">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-1.5 mb-1 text-[10px] text-slate-500 font-mono">
                  <span>{msg.sender === 'user' ? (currentUser?.name || 'You') : (msg.model || 'AI Co-pilot')}</span>
                  <span>•</span>
                  <span>{msg.timestamp}</span>
                </div>

                <div
                  className={`p-3.5 rounded-2xl text-xs leading-relaxed max-w-[88%] shadow-md whitespace-pre-wrap ${
                    msg.sender === 'user'
                      ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white rounded-br-none'
                      : 'bg-slate-900/90 border border-slate-800 text-slate-200 rounded-bl-none'
                  }`}
                >
                  {msg.text || (
                    <span className="flex items-center gap-2 text-slate-400">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                      <span>Thinking & streaming tokens...</span>
                    </span>
                  )}
                </div>

                {/* Fallback & Engine Badge */}
                {msg.sender === 'ai' && (msg.engine || msg.fallback) && (
                  <div className="flex items-center gap-2 mt-1">
                    {msg.fallback && (
                      <span className="text-[9px] font-bold text-amber-300 bg-amber-950/80 border border-amber-800/80 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <AlertTriangle className="w-2.5 h-2.5 text-amber-400" />
                        Automated Fallback Triggered
                      </span>
                    )}
                    {msg.latencyMs && (
                      <span className="text-[9px] font-mono text-slate-500">
                        {msg.latencyMs}ms
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Quick Prompts Carousel */}
          <div className="px-4 py-2 border-t border-slate-900/80 bg-slate-950 overflow-x-auto flex items-center gap-2 scrollbar-none">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">
              Suggestions:
            </span>
            {quickPrompts[chatMode].map((qp, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(qp)}
                className="px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-300 hover:text-white whitespace-nowrap transition-colors shrink-0"
              >
                {qp}
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <div className="p-3 bg-slate-900/90 border-t border-slate-800 rounded-b-3xl">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <button
                type="button"
                onClick={toggleMic}
                className={`p-2.5 rounded-xl transition-all ${
                  isListening
                    ? 'bg-rose-600 text-white animate-pulse'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
                title={isListening ? 'Stop listening' : 'Dictate with voice'}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder={
                  chatMode === 'recruiter'
                    ? 'Ask to create JDs, generate robotics questions, or rubric weights...'
                    : 'Ask for STAR response coaching, interview tips, or technical advice...'
                }
                className="flex-1 bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none"
              />

              <button
                type="submit"
                disabled={!inputMessage.trim() || isStreaming}
                className="p-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white transition-all shadow-md shadow-cyan-500/25 active:scale-95 cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
