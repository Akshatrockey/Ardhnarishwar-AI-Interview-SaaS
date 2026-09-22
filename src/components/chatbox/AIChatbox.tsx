import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { ISpeechRecognitionConstructor, ISpeechRecognitionEvent } from '../../types';
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
  UserCheck, 
  Briefcase, 
  GraduationCap, 
  HelpCircle,
  Minimize2,
  Maximize2
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
  mode: 'recruiter' | 'candidate';
}

export const AIChatbox: React.FC = () => {
  const { t, language, currentLanguageOption } = useLanguage();
  const { currentUser } = useAuth();

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [chatMode, setChatMode] = useState<'recruiter' | 'candidate'>('recruiter');
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isListening, setIsListening] = useState<boolean>(false);
  const [ttsEnabled, setTtsEnabled] = useState<boolean>(false);
  const [isTyping, setIsTyping] = useState<boolean>(false);

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    return [
      {
        id: 'msg_welcome',
        sender: 'ai',
        text: `👋 Greetings! I am **Ardhnarishwar AI Global Copilot**. How can I assist your hiring pipeline or interview preparation today? You can switch between **Recruiter Assistant** and **Candidate Coach** anytime!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        mode: 'recruiter'
      }
    ];
  });

  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const recognitionRef = useRef<any>(null);

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

  // Pre-configured Quick Prompts
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

  // In-House AI Response Engine
  const generateAIResponse = (userPrompt: string, mode: 'recruiter' | 'candidate'): string => {
    const p = userPrompt.toLowerCase();

    if (mode === 'recruiter') {
      if (p.includes('job description') || p.includes('jd') || p.includes('robotics engineer')) {
        return `📋 **Job Title: Senior Robotics & Autonomous Systems Engineer**\n\n**Overview:**\nWe are looking for an exceptional Robotics Engineer to architect our autonomous robotic platforms, real-time control loops, and perception pipelines.\n\n**Core Responsibilities:**\n- Develop ROS2/C++ nodes for sensor fusion (LiDAR, IMU, Depth Camera).\n- Design state machines and SLAM navigation algorithms.\n- Collaborate on hardware-in-the-loop (HIL) testing and trajectory planning.\n\n**Required Skills:** ROS2, C++17, Python, Kinematics, Kalman Filtering, Real-time Linux.\n\nWould you like me to populate this into your **Job Positions** manager automatically?`;
      }
      if (p.includes('questions') || p.includes('ros2') || p.includes('technical')) {
        return `🎯 **Curated Technical Questions for Robotics & Software:**\n\n1. **Kinematics & Control:** Explain how you prevent gimbal lock in 6-DOF robotic arm kinematics. When do you prefer Quaternions over Euler angles?\n2. **ROS2 IPC:** How does ROS2 utilize DDS for deterministic zero-copy intra-process communication?\n3. **Perception:** How do you handle sensor degradation in LiDAR-Visual odometry under low-light or reflective conditions?\n4. **Concurrency:** Explain deadlock prevention in multi-threaded C++ robotic actuator control.\n\n*Rubric Suggestion: 45% Technical Depth, 30% Relevance, 25% Communication.*`;
      }
      if (p.includes('email') || p.includes('invitation') || p.includes('invite')) {
        return `📧 **Draft: Interview Invitation with AI Chamber Access**\n\n**Subject:** Invitation: Next Round AI Robotics Interview — Ardhnarishwar\n\nDear [Candidate Name],\n\nCongratulations! Your profile for **[Job Role]** has been shortlisted. We invite you to complete your live interview using our AI Interview Chamber.\n\n- **Scheduled Window:** [Start Time] to [End Time] (Local Timezone)\n- **Candidate Access Token:** \`TOKEN_[CANDIDATE_ID]\`\n- **Direct Link:** [Portal URL]\n\nPlease test your camera & microphone prior to starting.\n\nBest regards,\nTalent Acquisition Team`;
      }
      return `💡 **Recruiter Copilot Analysis:**\nRegarding *"${userPrompt}"*:\n\n- **Recommendation:** Implement automated scoring with a threshold of **75%** for technical rounds and **70%** for HR rounds.\n- **Anti-Pattern Guard:** Ensure candidates explain *first principles* rather than reciting definitions.\n\nWould you like me to prepare round rubrics or filter candidate resumes for this role?`;
    } else {
      // Candidate Coach
      if (p.includes('star') || p.includes('mock') || p.includes('behavioral')) {
        return `🎓 **STAR Methodology Coaching:**\n\n**STAR stands for:**\n- **S - Situation:** Set the context (Where & when).\n- **T - Task:** What was the challenge or objective?\n- **A - Action:** What specific steps did YOU take? (Use "I" not "we").\n- **R - Result:** Quantify the outcome (e.g. *Reduced latency by 35%*).\n\n**Mock Practice Question:**\n*"Tell me about a time when your robotic system failed unexpectedly in production. How did you diagnose and resolve it?"*\n\nTry speaking your answer using the mic button!`;
      }
      if (p.includes('resume') || p.includes('gap')) {
        return `📄 **Resume Optimization Strategy:**\n\n1. **Action-Impact Format:** Start bullet points with strong verbs (e.g. *Architected, Optimized, Deployed*) followed by measurable metrics.\n2. **Explaining Gaps:** Frame career intervals around skill development, certifications, independent projects, or consulting.\n3. **Skills Relevance:** Ensure key terms match the job requirements directly so our AI parser ranks your profile in the top tier!`;
      }
      if (p.includes('confident') || p.includes('camera') || p.includes('tips')) {
        return `🌟 **Top Tips for Live AI Interview Chamber:**\n\n- **Eye Contact:** Look directly at your camera lens, not down at the screen.\n- **Pacing:** Aim for a steady speech tempo between **120 and 150 words per minute**.\n- **Clarity:** Take a 2-second breath before answering to organize your thoughts.\n- **Environment:** Ensure front lighting and minimal background noise. You've got this!`;
      }
      return `🤖 **Candidate Coach Response:**\nTo excel in *"${userPrompt}"*:\nFocus on clear problem formulation, state your assumptions out loud, and tie your technical answer back to practical safety and performance in real-world scenarios.`;
    }
  };

  const handleSendMessage = (textToSend?: string) => {
    const text = textToSend || inputMessage;
    if (!text.trim()) return;

    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      mode: chatMode,
    };

    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsTyping(true);

    setTimeout(() => {
      const reply = generateAIResponse(text, chatMode);
      const aiMsg: ChatMessage = {
        id: `ai_${Date.now()}`,
        sender: 'ai',
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        mode: chatMode,
      };
      setMessages(prev => [...prev, aiMsg]);
      setIsTyping(false);
      if (ttsEnabled) {
        speakText(reply);
      }
    }, 650);
  };

  const handleClearChat = () => {
    if (confirm('Clear entire conversation history?')) {
      setMessages([
        {
          id: `msg_${Date.now()}`,
          sender: 'ai',
          text: `Conversation cleared. I am ready for your next question!`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          mode: chatMode
        }
      ]);
    }
  };

  const handleExportChat = () => {
    const formatted = messages.map(m => `[${m.timestamp}] ${m.sender.toUpperCase()}: ${m.text}\n`).join('\n');
    const blob = new Blob([formatted], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Ardhnarishwar_AI_Chat_${Date.now()}.txt`;
    link.click();
  };

  return (
    <>
      {/* 1. Floating Launcher Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 group flex items-center gap-3 px-4 py-3 rounded-2xl bg-gradient-to-r from-cyan-600 via-indigo-600 to-purple-600 text-white font-bold shadow-2xl shadow-cyan-500/30 hover:scale-105 active:scale-95 transition-all border border-white/20 backdrop-blur-lg"
          title="Open Ardhnarishwar AI Copilot"
        >
          <div className="relative">
            <Bot className="w-6 h-6 animate-pulse" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full ring-2 ring-slate-950 animate-ping" />
          </div>
          <div className="text-left hidden sm:block">
            <div className="text-xs tracking-wider uppercase font-mono text-cyan-200">AI Global Copilot</div>
            <div className="text-[11px] text-white/90 font-medium">Click to Chat & Ask AI</div>
          </div>
          <Sparkles className="w-4 h-4 text-amber-300 group-hover:rotate-12 transition-transform" />
        </button>
      )}

      {/* 2. Chatbox Drawer / Modal */}
      {isOpen && (
        <div 
          className={`fixed z-50 flex flex-col bg-slate-900/95 border border-cyan-500/30 shadow-2xl shadow-black/80 backdrop-blur-2xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-8 ${
            isExpanded 
              ? 'inset-4 sm:inset-10 rounded-3xl' 
              : 'bottom-4 right-4 sm:bottom-6 sm:right-6 w-[95vw] sm:w-[460px] h-[600px] max-h-[88vh] rounded-2xl'
          }`}
        >
          {/* Header */}
          <div className="px-5 py-3.5 border-b border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 flex items-center justify-between rounded-t-2xl">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/20">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-extrabold text-white">Ardhnarishwar AI Copilot</span>
                  <span className="px-1.5 py-0.5 text-[9px] font-mono font-semibold rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">v3.8 PRO</span>
                </div>
                <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
                  <span>Multilingual Intelligence ({currentLanguageOption.label})</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 text-slate-400">
              <button 
                onClick={() => setTtsEnabled(!ttsEnabled)} 
                className={`p-1.5 rounded-lg hover:text-white hover:bg-slate-800 transition-colors ${ttsEnabled ? 'text-cyan-400 bg-cyan-950/50' : ''}`}
                title={ttsEnabled ? 'Text-to-Speech ON' : 'Text-to-Speech OFF'}
              >
                {ttsEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
              <button 
                onClick={handleExportChat} 
                className="p-1.5 rounded-lg hover:text-white hover:bg-slate-800 transition-colors"
                title="Export Chat History"
              >
                <Download className="w-4 h-4" />
              </button>
              <button 
                onClick={handleClearChat} 
                className="p-1.5 rounded-lg hover:text-rose-400 hover:bg-slate-800 transition-colors"
                title="Clear Chat"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setIsExpanded(!isExpanded)} 
                className="p-1.5 rounded-lg hover:text-white hover:bg-slate-800 transition-colors hidden sm:block"
                title={isExpanded ? 'Minimize' : 'Maximize'}
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <button 
                onClick={() => setIsOpen(false)} 
                className="p-1.5 rounded-lg hover:text-white hover:bg-slate-800 transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="px-4 py-2 border-b border-slate-800/80 bg-slate-950/60 flex gap-2">
            <button
              onClick={() => setChatMode('recruiter')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                chatMode === 'recruiter'
                  ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>{t('chat.recruiter_mode', 'Recruiter Assistant')}</span>
            </button>
            <button
              onClick={() => setChatMode('candidate')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                chatMode === 'candidate'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md shadow-purple-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>{t('chat.candidate_mode', 'Candidate Coach')}</span>
            </button>
          </div>

          {/* Chat Messages Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-gradient-to-b from-slate-950/40 via-slate-900/60 to-slate-950/40">
            {messages.map((m) => (
              <div 
                key={m.id} 
                className={`flex gap-2.5 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.sender === 'ai' && (
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-500 to-purple-600 flex items-center justify-center text-white shrink-0 shadow-sm mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}
                <div 
                  className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-md rounded-tr-none'
                      : 'bg-slate-800/90 text-slate-200 border border-slate-700/80 shadow-sm rounded-tl-none prose prose-invert'
                  }`}
                >
                  <div className="whitespace-pre-wrap font-sans">{m.text}</div>
                  <div className="mt-1 text-[9px] text-white/50 text-right font-mono">{m.timestamp}</div>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-2 items-center text-xs text-slate-400 pl-1">
                <div className="w-6 h-6 rounded-lg bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400">
                  <Bot className="w-3.5 h-3.5 animate-spin" />
                </div>
                <div className="flex gap-1 items-center bg-slate-800/60 px-3 py-1.5 rounded-full">
                  <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" />
                  <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick Prompts Carousel */}
          <div className="px-3 py-2 bg-slate-950/70 border-t border-slate-800/80 overflow-x-auto whitespace-nowrap scrollbar-none flex gap-2">
            <span className="text-[10px] text-cyan-400 font-semibold flex items-center gap-1 self-center shrink-0">
              <Sparkles className="w-3 h-3" />
              <span>{t('chat.quick_questions', 'Suggestions')}:</span>
            </span>
            {quickPrompts[chatMode].map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(prompt)}
                className="shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-800/90 hover:bg-cyan-950 text-slate-300 hover:text-cyan-200 border border-slate-700/60 hover:border-cyan-500/40 transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input & Voice Controls */}
          <div className="p-3 border-t border-slate-800 bg-slate-950 flex items-center gap-2 rounded-b-2xl">
            <button
              onClick={toggleMic}
              className={`p-2.5 rounded-xl border transition-all ${
                isListening 
                  ? 'bg-rose-600 text-white border-rose-500 animate-pulse shadow-lg shadow-rose-500/40' 
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-cyan-400 border-slate-800'
              }`}
              title={isListening ? 'Stop Mic Recording' : 'Voice Input'}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder={t('chat.placeholder', 'Ask anything...')}
              className="flex-1 bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition-colors"
            />

            <button
              onClick={() => handleSendMessage()}
              disabled={!inputMessage.trim()}
              className="p-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold disabled:opacity-40 disabled:pointer-events-none transition-all shadow-md shadow-cyan-500/20"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};
