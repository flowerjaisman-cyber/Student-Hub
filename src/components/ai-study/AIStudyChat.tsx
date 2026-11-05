import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  Bot,
  User,
  Copy,
  Check,
  RefreshCw,
  Trash2,
  Bookmark,
  FileText,
  AlertCircle,
  Clock,
  ArrowDown,
} from 'lucide-react';
import { AISessionMessage, AISession, AIStudyMaterial } from '../../types/index.ts';
import { streamAIChat, saveUserAIMaterial, saveUserAISession } from '../../services/aiStudyService.ts';
import { ActiveContext } from './AIContextSelector.tsx';

interface AIStudyChatProps {
  userId: string;
  activeContext: ActiveContext;
  onSaveMaterialSuccess?: (msg: string) => void;
}

const SUGGESTED_PROMPTS = [
  'Explain the main concept simply',
  'Simplify this difficult text',
  'Compare the two key theories mentioned',
  'Give 2 real-world concrete examples',
  'Generate 3 practice revision questions',
  'Turn this into high-yield study bullet points',
];

export const AIStudyChat: React.FC<AIStudyChatProps> = ({
  userId,
  activeContext,
  onSaveMaterialSuccess,
}) => {
  const [messages, setMessages] = useState<AISessionMessage[]>([]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingReply, setStreamingReply] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingReply]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSaveToMaterials = async (msg: AISessionMessage) => {
    if (!userId) return;
    try {
      const material: AIStudyMaterial = {
        id: `mat_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        userId,
        title: msg.contextTitle ? `Explanation on ${msg.contextTitle}` : 'AI Study Explanation',
        category: 'explanation',
        sourceContext: activeContext.charCount > 0 ? {
          type: activeContext.type as any,
          sourceId: activeContext.id,
          sourceTitle: activeContext.title,
        } : undefined,
        content: msg.content,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await saveUserAIMaterial(userId, material);
      setSavedId(msg.id);
      onSaveMaterialSuccess?.('Saved explanation to My Study Materials!');
      setTimeout(() => setSavedId(null), 2500);
    } catch (err: any) {
      console.error('Failed to save material:', err);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const queryText = (textToSend || inputPrompt).trim();
    if (!queryText || isLoading) return;

    setErrorMsg(null);
    setInputPrompt('');

    const userMsg: AISessionMessage = {
      id: `msg_${Date.now()}_u`,
      role: 'user',
      content: queryText,
      timestamp: new Date().toISOString(),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setIsLoading(true);
    setStreamingReply('');

    // Prepare context for backend
    const contextPayload = activeContext.charCount > 0 ? {
      title: activeContext.title,
      type: activeContext.type,
      content: activeContext.content,
    } : undefined;

    const controller = new AbortController();
    abortControllerRef.current = controller;

    let accumulatedText = '';

    await streamAIChat(
      newMessages.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      contextPayload,
      (chunk) => {
        accumulatedText += chunk;
        setStreamingReply(accumulatedText);
      },
      () => {
        const assistantMsg: AISessionMessage = {
          id: `msg_${Date.now()}_a`,
          role: 'assistant',
          content: accumulatedText || 'I could not generate an answer.',
          timestamp: new Date().toISOString(),
          groundedInContext: !!contextPayload,
          contextTitle: activeContext.charCount > 0 ? activeContext.title : undefined,
        };
        setMessages([...newMessages, assistantMsg]);
        setStreamingReply('');
        setIsLoading(false);
      },
      (err) => {
        console.error('Chat error:', err);
        setErrorMsg(err.message || 'Failed to get response from AI.');
        setIsLoading(false);
        setStreamingReply('');
      },
      controller.signal
    );
  };

  const handleRegenerate = () => {
    if (messages.length === 0 || isLoading) return;
    // Find last user message
    let lastUserIndex = -1;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        lastUserIndex = i;
        break;
      }
    }
    if (lastUserIndex === -1) return;

    const lastUserText = messages[lastUserIndex].content;
    const trimmed = messages.slice(0, lastUserIndex);
    setMessages(trimmed);
    handleSendMessage(lastUserText);
  };

  const handleClear = () => {
    if (isLoading) {
      abortControllerRef.current?.abort();
    }
    setMessages([]);
    setStreamingReply('');
    setErrorMsg(null);
  };

  return (
    <div className="flex flex-col h-[650px] rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
      {/* Top Header */}
      <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-xs">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Ask AI Study Assistant</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                gemini-3.8-flash
              </span>
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {activeContext.charCount > 0
                ? `Answering grounded in: ${activeContext.title}`
                : 'General study assistant mode'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <>
              <button
                type="button"
                onClick={handleRegenerate}
                disabled={isLoading}
                title="Regenerate last response"
                className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-40"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
              <button
                type="button"
                onClick={handleClear}
                title="Clear conversation"
                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {messages.length === 0 && !streamingReply && (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 max-w-lg mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-4 border border-indigo-100 dark:border-indigo-900 shadow-xs">
              <Sparkles className="w-7 h-7" />
            </div>
            <h4 className="text-base font-bold text-slate-900 dark:text-white">
              How can I help you study today?
            </h4>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Ask questions about your courses, paste difficult paragraphs to simplify, or select one of the high-yield study prompts below.
            </p>

            {/* Quick suggested prompt pills */}
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {SUGGESTED_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(prompt)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200 dark:border-slate-700 text-xs font-medium transition-all cursor-pointer"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Render message list */}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="w-4 h-4" />
              </div>
            )}

            <div
              className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-xs leading-relaxed shadow-xs ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white font-medium rounded-br-xs'
                  : 'bg-slate-100 dark:bg-slate-800/90 text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700/80 rounded-bl-xs'
              }`}
            >
              {/* Context indicator for grounded assistant answers */}
              {msg.role === 'assistant' && msg.groundedInContext && msg.contextTitle && (
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 text-[10px] font-semibold mb-2.5 border border-indigo-200 dark:border-indigo-800">
                  <FileText className="w-3 h-3" />
                  <span>Grounded in: {msg.contextTitle}</span>
                </div>
              )}

              {/* Message text with pre-wrap */}
              <div className="whitespace-pre-wrap select-text">{msg.content}</div>

              {/* Action buttons on assistant response */}
              {msg.role === 'assistant' && (
                <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1 text-[10px]">
                    <Clock className="w-3 h-3" />
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleCopy(msg.content, msg.id)}
                      className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-1"
                      title="Copy response"
                    >
                      {copiedId === msg.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                          <span className="text-[10px] text-emerald-500 font-semibold">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span className="text-[10px]">Copy</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSaveToMaterials(msg)}
                      className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-1"
                      title="Save to My Study Materials"
                    >
                      {savedId === msg.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                          <span className="text-[10px] text-emerald-500 font-semibold">Saved!</span>
                        </>
                      ) : (
                        <>
                          <Bookmark className="w-3.5 h-3.5 text-indigo-500" />
                          <span className="text-[10px]">Save</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0 mt-0.5">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {/* Live Streaming Response */}
        {streamingReply && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5 animate-pulse">
              <Bot className="w-4 h-4" />
            </div>
            <div className="max-w-[85%] sm:max-w-[75%] rounded-2xl rounded-bl-xs p-4 text-xs leading-relaxed bg-slate-100 dark:bg-slate-800/90 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-xs">
              <div className="whitespace-pre-wrap">{streamingReply}</div>
              <div className="mt-2 flex items-center gap-1.5 text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-ping" />
                <span>Generating explanation...</span>
              </div>
            </div>
          </div>
        )}

        {/* Loading spinner placeholder if waiting for first stream token */}
        {isLoading && !streamingReply && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-500 flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <span>Analyzing study material and generating answer...</span>
            </div>
          </div>
        )}

        {/* Error message */}
        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{errorMsg}</span>
            </div>
            <button
              type="button"
              onClick={handleRegenerate}
              className="px-2.5 py-1 rounded-lg bg-rose-600 text-white font-semibold text-[11px] hover:bg-rose-700 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <div className="p-3 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-end gap-2"
        >
          <div className="flex-1 relative">
            <textarea
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder={
                activeContext.charCount > 0
                  ? `Ask anything about "${activeContext.title}"...`
                  : 'Ask a study question or concept to explain...'
              }
              rows={2}
              className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden resize-none pr-10"
            />
          </div>

          <button
            type="submit"
            disabled={!inputPrompt.trim() || isLoading}
            className="p-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all shadow-xs shadow-indigo-600/30 disabled:opacity-40 cursor-pointer shrink-0"
            title="Send study question"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
