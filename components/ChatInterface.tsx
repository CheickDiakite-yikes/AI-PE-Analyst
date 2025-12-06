
import React, { useEffect, useRef, useState } from 'react';
import { Message, FileAttachment } from '../types';
import { Send, Bot, User, Paperclip, X, FileText, FileSpreadsheet, Image as ImageIcon, Sparkles, ArrowRight, ChevronRight } from 'lucide-react';

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (text: string, attachments?: FileAttachment[]) => void;
  isProcessing: boolean;
}

// Lightweight Markdown Renderer to avoid heavy dependencies
const FormattedText: React.FC<{ text: string }> = ({ text }) => {
    // Split by lines to handle block elements
    const lines = text.split('\n');
    
    return (
        <div className="space-y-1.5 text-sm leading-relaxed text-gray-300">
            {lines.map((line, i) => {
                // Header (###)
                if (line.startsWith('### ') || line.startsWith('**') && line.endsWith('**') && line.length < 50) {
                     return <h4 key={i} className="text-apex-accent font-bold mt-3 mb-1">{line.replace(/### |[*]/g, '')}</h4>;
                }
                // Bullet points
                if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
                    return (
                        <div key={i} className="flex gap-2 ml-1">
                            <div className="w-1 h-1 rounded-full bg-apex-accentDim mt-2 flex-shrink-0" />
                            <span dangerouslySetInnerHTML={{ __html: parseInlineStyles(line.replace(/^[-*] /, '')) }} />
                        </div>
                    );
                }
                // Numbered lists
                if (/^\d+\./.test(line.trim())) {
                     return (
                        <div key={i} className="flex gap-2 ml-1">
                            <span className="font-mono text-apex-accentDim text-xs mt-0.5">{line.split('.')[0]}.</span>
                            <span dangerouslySetInnerHTML={{ __html: parseInlineStyles(line.replace(/^\d+\. /, '')) }} />
                        </div>
                    );
                }
                // Empty lines
                if (!line.trim()) return <div key={i} className="h-2" />;

                // Regular Text with inline styles
                return <p key={i} dangerouslySetInnerHTML={{ __html: parseInlineStyles(line) }} />;
            })}
        </div>
    );
};

// Helper to bold text (**text**)
const parseInlineStyles = (text: string) => {
    return text.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>');
};

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages, onSendMessage, isProcessing }) => {
  const [input, setInput] = useState('');
  const [pendingAttachments, setPendingAttachments] = useState<FileAttachment[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent, overrideText?: string) => {
    e.preventDefault();
    const textToSend = overrideText || input;
    if ((!textToSend.trim() && pendingAttachments.length === 0) || isProcessing) return;
    
    onSendMessage(textToSend, pendingAttachments.length > 0 ? pendingAttachments : undefined);
    setInput('');
    setPendingAttachments([]);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newAttachments: FileAttachment[] = [];
      
      for (let i = 0; i < e.target.files.length; i++) {
        const file = e.target.files[i];
        const reader = new FileReader();
        
        const attachmentPromise = new Promise<FileAttachment>((resolve) => {
          reader.onload = (event) => {
            resolve({
              name: file.name,
              type: file.type,
              data: event.target?.result as string
            });
          };
          reader.readAsDataURL(file);
        });
        
        newAttachments.push(await attachmentPromise);
      }
      
      setPendingAttachments(prev => [...prev, ...newAttachments]);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (index: number) => {
    setPendingAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return <FileText className="w-4 h-4 text-red-400" />;
    if (type.includes('sheet') || type.includes('excel') || type.includes('csv')) return <FileSpreadsheet className="w-4 h-4 text-emerald-400" />;
    if (type.includes('image')) return <ImageIcon className="w-4 h-4 text-purple-400" />;
    return <FileText className="w-4 h-4 text-gray-400" />;
  };

  return (
    <div className="flex flex-col h-full bg-apex-900 border-l border-apex-800">
      
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin">
        {messages.length <= 1 && (
            <div className="flex flex-col items-center justify-center h-full opacity-60">
                 <div className="w-16 h-16 bg-apex-800 rounded-2xl flex items-center justify-center mb-4 border border-apex-700">
                    <Sparkles className="w-8 h-8 text-apex-accent" />
                 </div>
                 <h3 className="text-lg font-bold text-white mb-2">Apex Capital AI</h3>
                 <p className="text-sm text-gray-400 text-center max-w-[250px] mb-8">
                     Your autonomous private equity deal team is ready. Select a starting point:
                 </p>
                 <div className="grid grid-cols-1 gap-3 w-full max-w-[300px]">
                     <button onClick={(e) => handleSubmit(e, "Find healthcare services deals with $15M+ EBITDA")} className="text-left p-3 rounded bg-apex-800 hover:bg-apex-700 border border-apex-700 hover:border-apex-accent transition-all text-xs text-gray-300 group">
                         <div className="font-bold text-white mb-1 group-hover:text-apex-accent">Sourcing Scan</div>
                         Find healthcare deals > $15M EBITDA
                     </button>
                     <button onClick={() => fileInputRef.current?.click()} className="text-left p-3 rounded bg-apex-800 hover:bg-apex-700 border border-apex-700 hover:border-apex-accent transition-all text-xs text-gray-300 group">
                         <div className="font-bold text-white mb-1 group-hover:text-apex-accent">Diligence Analysis</div>
                         Upload a CIM or Teaser PDF
                     </button>
                 </div>
            </div>
        )}

        {messages.slice(1).map((msg) => (
          <div key={msg.id} className={`flex gap-3 animate-fade-in ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
            <div className={`
              w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1
              ${msg.role === 'user' ? 'bg-apex-700' : 'bg-apex-accentDim/20 border border-apex-accentDim/50'}
            `}>
              {msg.role === 'user' ? <User className="w-4 h-4 text-gray-300" /> : <Bot className="w-4 h-4 text-apex-accent" />}
            </div>
            <div className={`
              max-w-[85%] rounded-2xl p-4 text-sm shadow-sm
              ${msg.role === 'user' 
                ? 'bg-apex-800 text-gray-100 border border-apex-700 rounded-tr-none' 
                : 'bg-apex-800/40 text-gray-200 border border-apex-800 rounded-tl-none'}
            `}>
              <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/5">
                 <span className={`text-[10px] font-bold uppercase tracking-wider ${msg.role === 'user' ? 'text-gray-400' : 'text-apex-accent'}`}>
                    {msg.sender || (msg.role === 'user' ? 'You' : 'Apex AI')}
                 </span>
                 <span className="text-[10px] text-gray-600 font-mono ml-auto">{msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
              </div>
              
              {/* Input Attachments */}
              {msg.inputAttachments && msg.inputAttachments.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {msg.inputAttachments.map((att, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-black/40 px-2 py-1.5 rounded border border-apex-700 text-xs">
                      {getFileIcon(att.type)}
                      <span className="truncate max-w-[150px] text-gray-300">{att.name}</span>
                    </div>
                  ))}
                </div>
              )}

              <FormattedText text={msg.content} />
              
              {/* Output Attachments */}
              {msg.attachments?.map((att, idx) => (
                <div key={idx} className="mt-4">
                  {att.type === 'image' && att.url && (
                     <div className="relative group rounded-lg overflow-hidden border border-apex-700 bg-black">
                        <img src={att.url} alt="Generated Asset" className="w-full h-auto opacity-90 group-hover:opacity-100 transition-opacity" />
                        <div className="absolute top-2 right-2 bg-black/60 backdrop-blur px-2 py-1 text-[9px] text-white rounded border border-white/10">
                            AI GENERATED
                        </div>
                     </div>
                  )}
                </div>
              ))}

              {/* Suggested Actions (Smart Chips) */}
              {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-white/5 flex flex-wrap gap-2">
                      {msg.suggestedActions.map((action, idx) => (
                          <button
                            key={idx}
                            onClick={(e) => handleSubmit(e, action)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-apex-accent/10 border border-apex-accent/20 text-apex-accent text-xs hover:bg-apex-accent hover:text-black transition-all group"
                          >
                              {action}
                              <ChevronRight className="w-3 h-3 opacity-50 group-hover:opacity-100" />
                          </button>
                      ))}
                  </div>
              )}
            </div>
          </div>
        ))}
        
        {/* Processing Indicator */}
        {isProcessing && (
            <div className="flex gap-3 animate-pulse">
                <div className="w-8 h-8 rounded-full bg-apex-800 flex items-center justify-center border border-apex-700">
                    <Sparkles className="w-4 h-4 text-gray-500" />
                </div>
                <div className="bg-apex-800/30 rounded-2xl rounded-tl-none p-4 border border-apex-800 flex items-center gap-2">
                    <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span className="text-xs text-gray-500 font-mono">Agents orchestrating...</span>
                </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-apex-800 bg-apex-900 z-10">
        {/* Pending Attachments Area */}
        {pendingAttachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3 animate-slide-up">
            {pendingAttachments.map((att, idx) => (
              <div key={idx} className="flex items-center gap-2 bg-apex-800 px-3 py-1.5 rounded border border-apex-700 text-xs text-gray-300 shadow-lg">
                 {getFileIcon(att.type)}
                 <span className="max-w-[120px] truncate">{att.name}</span>
                 <button onClick={() => removeAttachment(idx)} className="hover:text-red-400 ml-1 p-0.5 rounded-full hover:bg-white/10">
                   <X className="w-3 h-3" />
                 </button>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="relative group">
            <div className={`
                absolute -inset-0.5 bg-gradient-to-r from-apex-accentDim to-blue-900 rounded-xl opacity-0 group-hover:opacity-20 transition duration-500 blur
                ${isProcessing ? 'opacity-0' : ''}
            `}></div>
            <div className="relative flex items-end gap-2 bg-apex-800 p-2 rounded-xl border border-apex-700 focus-within:border-apex-accent/50 transition-colors">
                <input 
                    type="file" 
                    multiple 
                    ref={fileInputRef}
                    className="hidden" 
                    onChange={handleFileSelect}
                    accept=".pdf,.csv,.xlsx,.xls,.txt,.md,image/*"
                />
                
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
                    title="Attach files (PDF, Excel, Images)"
                >
                    <Paperclip className="w-5 h-5" />
                </button>

                <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSubmit(e);
                        }
                    }}
                    placeholder={isProcessing ? "Analysis in progress..." : "Ask the MD, request a model, or find a deal..."}
                    disabled={isProcessing}
                    rows={1}
                    className="w-full bg-transparent text-gray-100 placeholder-gray-500 text-sm focus:outline-none py-2 resize-none scrollbar-none max-h-[100px]"
                    style={{ minHeight: '40px' }}
                />

                <button
                    type="submit"
                    disabled={(!input.trim() && pendingAttachments.length === 0) || isProcessing}
                    className={`
                        p-2 rounded-lg transition-all flex-shrink-0
                        ${(!input.trim() && pendingAttachments.length === 0) || isProcessing 
                            ? 'text-gray-600 bg-transparent' 
                            : 'bg-apex-accent text-black hover:bg-white shadow-lg shadow-apex-accent/20'}
                    `}
                >
                    <ArrowRight className="w-5 h-5" />
                </button>
            </div>
            <div className="flex justify-between mt-2 px-1">
                <div className="text-[10px] text-gray-600 font-mono">
                    SECURE ENCLAVE ACTIVE
                </div>
                <div className="text-[10px] text-gray-600">
                    Press <span className="font-mono text-gray-500">Enter</span> to send
                </div>
            </div>
        </form>
      </div>
    </div>
  );
};
