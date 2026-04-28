import { useState, useRef, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function ChatWidget() {
  const { user, isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputVal, setInputVal] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  // Handle send message
  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputVal.trim() || loading) return;

    const userMessage = inputVal.trim();
    setInputVal('');

    // Transform local message state shape to backend API shape
    const history = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    // Add user message optimistically
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const response = await api.sendChatMessage(userMessage, history);
      setMessages((prev) => [...prev, { role: 'ai', content: response.reply }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'ai', content: 'Sorry, I am having trouble connecting to the Atlas servers.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <>
      {/* Floating Chat Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 w-14 h-14 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 z-50 ${isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}`}
        style={{
          background: 'linear-gradient(135deg, #e86000ff, #ff1904ff)',
          boxShadow: '0 8px 30px rgba(241, 137, 99, 0.4)',
          border: 'none',
          color: 'white',
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </button>

      {/* Glassmorphic Chat Window */}
      <div
        className={`fixed bottom-6 right-6 w-80 sm:w-96 rounded-2xl flex flex-col overflow-hidden transition-all duration-300 z-50 ${isOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-10 pointer-events-none'}`}
        style={{
          height: '500px',
          maxHeight: 'calc(100vh - 40px)',
          background: 'var(--surface)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid var(--glass-border)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-4"
          style={{ background: 'linear-gradient(135deg, #e95b0aff, #e82711ff)', color: 'white' }}
        >
          <div className="flex items-center gap-2">
            <span className="text-xl"></span>
            <div>
              <h3 className="font-semibold text-sm">Atlas AI Guide</h3>
              <p className="text-xs opacity-80">Online & Context-Aware</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 rounded-md hover:bg-white/20 transition-colors cursor-pointer w-8 h-8 flex items-center justify-center border-none bg-transparent text-white"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
          {messages.length === 0 && (
            <div className="text-center my-auto">
              <div className="text-4xl mb-3">ask ask</div>
              <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Welcome to Atlas!</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>I can see your performance dashboard. Ask me anything about your current knowledge gaps!</p>
            </div>
          )}
          {messages.map((m, idx) => (
            <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className="max-w-[85%] rounded-2xl p-3 text-sm"
                style={{
                  background: m.role === 'user' ? 'linear-gradient(135deg, #ee752fff, #f4580aff)' : 'rgba(255, 255, 255, 0.05)',
                  color: m.role === 'user' ? 'white' : 'var(--text-primary)',
                  border: m.role === 'user' ? 'none' : '1px solid var(--border-color)',
                  borderBottomRightRadius: m.role === 'user' ? '4px' : '16px',
                  borderBottomLeftRadius: m.role === 'user' ? '16px' : '4px',
                }}
              >
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="max-w-[85%] rounded-2xl p-3 text-sm" style={{ background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-muted)', border: '1px solid var(--border-color)' }}>
                Thinking...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <div className="p-3" style={{ borderTop: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.1)' }}>
          <form onSubmit={handleSend} className="relative">
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="Ask for guidance..."
              className="w-full bg-transparent border-none text-sm px-4 py-3 pr-12 rounded-xl outline-none"
              style={{
                color: 'var(--text-primary)',
                background: 'var(--surface)',
                border: '1px solid var(--border-color)',
              }}
              disabled={loading}
            />
            <button
              type="submit"
              disabled={!inputVal.trim() || loading}
              className="absolute right-2 top-2 w-8 h-8 flex items-center justify-center rounded-lg border-none cursor-pointer transition-colors"
              style={{
                background: inputVal.trim() ? '#6366f1' : 'transparent',
                color: inputVal.trim() ? 'white' : 'var(--text-muted)',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
