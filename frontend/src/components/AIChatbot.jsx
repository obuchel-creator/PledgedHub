import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getAISuggestions, generateAIMessage, getAIInsights } from '../services/api';

export default function AIChatbot() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  // Context-aware welcome message based on current page
  const getWelcomeMessage = () => {
    const path = location.pathname;

    if (path === '/') {
      return "👋 Welcome to PledgeHub! I'm your AI assistant. I can help you:\n\n• Learn about pledge management\n• Understand how to create pledges\n• Get started with the platform\n• Answer questions about features\n\nHow can I assist you today?";
    } else if (path === '/dashboard') {
      return "� Hi! I'm your AI dashboard assistant. I can help you:\n\n• Analyze your pledge performance\n• Generate personalized reminder messages\n• Suggest collection strategies\n• Provide insights on trends\n\nWhat would you like to know about your pledges?";
    } else if (path === '/create') {
      return '✨ Creating a new pledge? I can help with:\n\n• Best practices for pledge amounts\n• Optimal collection dates\n• Effective pledge descriptions\n• Tips for donor engagement\n\nWhat aspect would you like guidance on?';
    } else {
      return "👋 Hi! I'm your AI pledge assistant. I can help you with:\n\n• Generate personalized reminder messages\n• Analyze pledge data and trends\n• Suggest follow-up strategies\n• Provide insights on collections\n\nWhat would you like to know?";
    }
  };

  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: getWelcomeMessage(),
      timestamp: new Date(),
    },
  ]);

  // Update welcome message when location changes
  useEffect(() => {
    setMessages([
      {
        role: 'assistant',
        content: getWelcomeMessage(),
        timestamp: new Date(),
      },
    ]);
  }, [location.pathname]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = {
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // Determine intent and call appropriate API
      const lowerInput = input.toLowerCase();
      let response;

      if (lowerInput.includes('suggest') || lowerInput.includes('recommendation')) {
        const suggestions = await getAISuggestions();
        response = `🎯 **AI Suggestions:**\n\n${suggestions.suggestions.join('\n\n')}`;
      } else if (
        lowerInput.includes('insight') ||
        lowerInput.includes('analyze') ||
        lowerInput.includes('trend')
      ) {
        const insights = await getAIInsights();
        response = `📊 **AI Insights:**\n\n${insights.insights}`;
      } else if (lowerInput.includes('message') || lowerInput.includes('reminder')) {
        const messageData = await generateAIMessage({
          type: 'reminder',
          context: { query: input },
        });
        response = `✉️ **Suggested Message:**\n\n${messageData.message}`;
      } else {
        // General query - get suggestions as default
        const suggestions = await getAISuggestions();
        response = `I can help you with that! Here are some suggestions:\n\n${suggestions.suggestions.slice(0, 3).join('\n\n')}`;
      }

      const assistantMessage = {
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage = {
        role: 'assistant',
        content: `❌ Sorry, I encountered an error: ${error.message}. Please try again or rephrase your question.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  // Context-aware quick actions based on current page
  const getQuickActions = () => {
    const path = location.pathname;

    if (path === '/') {
      return [
        { label: '🚀 How to start', prompt: 'How do I create my first pledge?' },
        { label: '📊 See features', prompt: 'What features does PledgeHub offer?' },
        { label: '💡 Best practices', prompt: 'What are best practices for pledge management?' },
        { label: '❓ Get help', prompt: 'How does the pledge system work?' },
      ];
    } else if (path === '/dashboard') {
      return [
        { label: '📊 Analyze pledges', prompt: 'Analyze my pledge data and show insights' },
        {
          label: '✉️ Generate reminder',
          prompt: 'Generate a reminder message for overdue pledges',
        },
        { label: '💡 Get suggestions', prompt: 'Give me suggestions to improve collections' },
        { label: '📈 Show trends', prompt: 'Show me collection trends' },
      ];
    } else if (path === '/create') {
      return [
        { label: '💰 Amount guidance', prompt: "What's a good pledge amount to suggest?" },
        { label: '📅 Best dates', prompt: 'When should I set collection dates?' },
        { label: '✍️ Write description', prompt: 'Help me write a compelling pledge description' },
        { label: '📱 Contact tips', prompt: 'How should I collect donor contact information?' },
      ];
    } else {
      return [
        { label: '📊 Analyze pledges', prompt: 'Analyze my pledge data and show insights' },
        {
          label: '✉️ Generate reminder',
          prompt: 'Generate a reminder message for overdue pledges',
        },
        { label: '💡 Get suggestions', prompt: 'Give me suggestions to improve collections' },
        { label: '📈 Show trends', prompt: 'Show me collection trends' },
      ];
    }
  };

  const handleQuickAction = (prompt) => {
    setInput(prompt);
  };

  const formatTime = (date) => {
    return new Intl.DateTimeFormat('en-UG', {
      hour: 'numeric',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <>
      {/* Floating Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
          border: 'none',
          boxShadow: '0 8px 24px rgba(37, 99, 235, 0.4)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.75rem',
          zIndex: 999,
          transition: 'all 0.3s ease',
          transform: isOpen ? 'scale(0.9)' : 'scale(1)',
        }}
        aria-label="Open AI Assistant"
      >
        {isOpen ? '✕' : '🤖'}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: '6rem',
            right: '2rem',
            width: '400px',
            maxWidth: 'calc(100vw - 4rem)',
            height: '600px',
            maxHeight: 'calc(100vh - 10rem)',
            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
            borderRadius: '20px',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
            border: '1px solid rgba(148, 163, 184, 0.2)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            zIndex: 998,
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '1.25rem',
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              borderBottom: '1px solid rgba(148, 163, 184, 0.2)',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
            }}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
              }}
            >
              🤖
            </div>
            <div style={{ flex: 1 }}>
              <h3
                style={{
                  margin: 0,
                  fontSize: '1.125rem',
                  fontWeight: '700',
                  color: '#ffffff',
                }}
              >
                AI Assistant
              </h3>
              <p
                style={{
                  margin: '0.125rem 0 0',
                  fontSize: '0.875rem',
                  color: 'rgba(255, 255, 255, 0.8)',
                }}
              >
                AI Assistant
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div
            style={{
              padding: '1rem',
              borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
              overflowX: 'auto',
              display: 'flex',
              gap: '0.5rem',
            }}
          >
            {getQuickActions().map((action, index) => (
              <button
                key={index}
                onClick={() => handleQuickAction(action.prompt)}
                style={{
                  padding: '0.5rem 1rem',
                  background: 'rgba(59, 130, 246, 0.1)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  borderRadius: '20px',
                  color: '#60a5fa',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s ease',
                }}
                onMouseOver={(e) => {
                  e.target.style.background = 'rgba(59, 130, 246, 0.2)';
                }}
                onMouseOut={(e) => {
                  e.target.style.background = 'rgba(59, 130, 246, 0.1)';
                }}
              >
                {action.label}
              </button>
            ))}
          </div>

          {/* Messages */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }}
          >
            {messages.map((message, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
                }}
              >
                <div
                  style={{
                    maxWidth: '80%',
                    padding: '0.875rem 1rem',
                    borderRadius:
                      message.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    background:
                      message.role === 'user'
                        ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
                        : 'rgba(255, 255, 255, 0.05)',
                    border:
                      message.role === 'assistant' ? '1px solid rgba(148, 163, 184, 0.2)' : 'none',
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      color: '#ffffff',
                      fontSize: '0.9375rem',
                      lineHeight: '1.6',
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {message.content}
                  </p>
                  <p
                    style={{
                      margin: '0.5rem 0 0',
                      fontSize: '0.75rem',
                      color: 'rgba(255, 255, 255, 0.6)',
                      textAlign: message.role === 'user' ? 'right' : 'left',
                    }}
                  >
                    {formatTime(message.timestamp)}
                  </p>
                </div>
              </div>
            ))}
            {loading && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-start',
                }}
              >
                <div
                  style={{
                    padding: '0.875rem 1rem',
                    borderRadius: '16px 16px 16px 4px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(148, 163, 184, 0.2)',
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      color: '#94a3b8',
                      fontSize: '0.9375rem',
                    }}
                  >
                    AI is thinking...
                  </p>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div
            style={{
              padding: '1rem',
              borderTop: '1px solid rgba(148, 163, 184, 0.2)',
              background: 'rgba(15, 23, 42, 0.8)',
              backdropFilter: 'blur(10px)',
            }}
          >
            <div
              style={{
                display: 'flex',
                gap: '0.75rem',
                alignItems: 'flex-end',
              }}
            >
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Ask me anything..."
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '0.875rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(148, 163, 184, 0.2)',
                  borderRadius: '12px',
                  color: '#ffffff',
                  fontSize: '0.9375rem',
                  resize: 'none',
                  minHeight: '44px',
                  maxHeight: '120px',
                  fontFamily: 'inherit',
                }}
                rows="1"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || loading}
                style={{
                  padding: '0.875rem 1.25rem',
                  background:
                    input.trim() && !loading
                      ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
                      : 'rgba(148, 163, 184, 0.2)',
                  border: 'none',
                  borderRadius: '12px',
                  color: '#ffffff',
                  fontSize: '1.25rem',
                  cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s ease',
                }}
              >
                {loading ? '⏳' : '📤'}
              </button>
            </div>
            <p
              style={{
                margin: '0.5rem 0 0',
                fontSize: '0.75rem',
                color: '#64748b',
                textAlign: 'center',
              }}
            >
              Press Enter to send • Shift+Enter for new line
            </p>
          </div>
        </div>
      )}
    </>
  );
}
