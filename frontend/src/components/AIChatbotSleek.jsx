import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { chatWithAI, getAISuggestions, getAIInsights } from '../services/api';

export default function AIChatbot() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  // Memoized welcome message for better performance
  const getWelcomeMessage = useCallback(() => {
    const path = location.pathname;

    const messages = {
      '/': "👋 Welcome to PledgeHub! I'm your AI assistant. I can help you:\n\n• Learn about pledge management\n• Understand how to create pledges\n• Get started with the platform\n• Answer questions about features\n\nHow can I assist you today?",
      '/dashboard':
        "📊 Hi! I'm your AI dashboard assistant. I can help you:\n\n• Analyze your pledge performance\n• Generate personalized reminder messages\n• Suggest collection strategies\n• Provide insights on trends\n\nWhat would you like to know about your pledges?",
      '/create':
        '✨ Creating a new pledge? I can help with:\n\n• Best practices for pledge amounts\n• Optimal collection dates\n• Effective pledge descriptions\n• Tips for donor engagement\n\nWhat aspect would you like guidance on?',
    };

    return (
      messages[path] ||
      "👋 Hi! I'm your AI pledge assistant. I can help you with:\n\n• Generate personalized reminder messages\n• Analyze pledge data and trends\n• Suggest follow-up strategies\n• Provide insights on collections\n\nWhat would you like to know?"
    );
  }, [location.pathname]);

  const [messages, setMessages] = useState(() => [
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
  }, [getWelcomeMessage]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Auto-focus input when chatbot opens
  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, isMinimized]);

  // Optimized message handling with debounce
  const handleSend = useCallback(async () => {
    if (!input.trim() || loading) return;

    const userMessage = {
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setIsTyping(true);

    try {
      let response = '';

      // Use the new AI chat endpoint for all questions
      const context = location.pathname; // Current page context
      const chatResponse = await chatWithAI(input, context);

      if (chatResponse && chatResponse.message) {
        response = chatResponse.message;

        // Add context-specific enhancements for certain topics
        if (input.toLowerCase().includes('analyze') || input.toLowerCase().includes('insight')) {
          try {
            const insights = await getAIInsights();
            if (insights.insights && insights.insights.length > 0) {
              response += `\n\n📊 **Recent Insights:**\n${insights.insights
                .slice(0, 2)
                .map((i) => `• ${i.title}: ${i.message}`)
                .join('\n')}`;
            }
          } catch (error) {
            console.log('Could not fetch insights:', error.message);
          }
        } else if (input.toLowerCase().includes('suggest')) {
          try {
            const suggestions = await getAISuggestions();
            if (suggestions.suggestions && suggestions.suggestions.length > 0) {
              response += `\n\n💡 **Quick Suggestions:**\n${suggestions.suggestions
                .slice(0, 2)
                .map((s, i) => `${i + 1}. ${s}`)
                .join('\n')}`;
            }
          } catch (error) {
            console.log('Could not fetch suggestions:', error.message);
          }
        }
      } else {
        response =
          'I apologize, but I encountered an issue processing your request. Please try rephrasing your question or ask me about pledge management, creating reminders, or viewing analytics.';
      }

      setIsTyping(false);

      const assistantMessage = {
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      setIsTyping(false);
      const errorMessage = {
        role: 'assistant',
        content: `❌ I encountered an error: ${error.message}. Please try again or rephrase your question.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, getWelcomeMessage]);


  // Context-aware quick actions (memoized for performance)
  const quickActions = useMemo(() => {
    const path = location.pathname;

    const actions = {
      '/': [
        { label: '🚀 Get Started', prompt: 'How do I create my first pledge?', icon: '🚀' },
        { label: '📊 Features', prompt: 'What features does PledgeHub offer?', icon: '📊' },
        {
          label: '💡 Best Practices',
          prompt: 'What are best practices for pledge management?',
          icon: '💡',
        },
        { label: '❓ Help', prompt: 'How does the pledge system work?', icon: '❓' },
      ],
      '/dashboard': [
        { label: '📊 Analyze', prompt: 'Analyze my pledge data and show insights', icon: '📊' },
        {
          label: '✉️ Reminder',
          prompt: 'Generate a reminder message for overdue pledges',
          icon: '✉️',
        },
        {
          label: '💡 Suggestions',
          prompt: 'Give me suggestions to improve collections',
          icon: '💡',
        },
        { label: '📈 Trends', prompt: 'Show me collection trends', icon: '📈' },
      ],
      '/create': [
        { label: '💰 Amount', prompt: "What's a good pledge amount to suggest?", icon: '💰' },
        { label: '📅 Dates', prompt: 'When should I set collection dates?', icon: '📅' },
        {
          label: '✍️ Description',
          prompt: 'Help me write a compelling pledge description',
          icon: '✍️',
        },
        {
          label: '📱 Contact',
          prompt: 'How should I collect donor contact information?',
          icon: '📱',
        },
      ],
    };

    return actions[path] || actions['/dashboard'];
  }, [location.pathname]);

  const handleQuickAction = useCallback((prompt) => {
    setInput(prompt);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleKeyPress = useCallback(
    (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  const toggleChat = useCallback(() => {
    setIsOpen((prev) => !prev);
    setIsMinimized(false);
  }, []);

  const minimizeChat = useCallback(() => {
    setIsMinimized(true);
  }, []);

  const maximizeChat = useCallback(() => {
    setIsMinimized(false);
  }, []);

  // Typing indicator component
  const TypingIndicator = () => (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '0.75rem',
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '12px',
        margin: '0.25rem 0',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      <div
        style={{
          width: '28px',
          height: '28px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: '0.5rem',
          fontSize: '0.9rem',
        }}
      >
        🤖
      </div>
      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
        <span style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.8rem' }}>
          AI is thinking
        </span>
        <div style={{ display: 'flex', gap: '2px', marginLeft: '8px' }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                width: '4px',
                height: '4px',
                borderRadius: '50%',
                background: '#3b82f6',
                animation: `pulse 1.4s ease-in-out ${i * 0.2}s infinite`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* CSS Animations */}
      <style>{`
                @keyframes pulse {
                    0%, 70%, 100% { transform: scale(1); opacity: 0.5; }
                    35% { transform: scale(1.2); opacity: 1; }
                }
                @keyframes slideUp {
                    from { transform: translateY(100%) scale(0.8); opacity: 0; }
                    to { transform: translateY(0) scale(1); opacity: 1; }
                }
                @keyframes slideDown {
                    from { transform: translateY(0) scale(1); opacity: 1; }
                    to { transform: translateY(100%) scale(0.8); opacity: 0; }
                }
                @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-4px); }
                }
                @keyframes glow {
                    0%, 100% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.3); }
                    50% { box-shadow: 0 0 30px rgba(59, 130, 246, 0.5), 0 0 40px rgba(59, 130, 246, 0.3); }
                }
                @keyframes gradient {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                .chatbot-button {
                    animation: float 3s ease-in-out infinite;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .chatbot-button:hover {
                    animation: glow 2s ease-in-out infinite;
                    transform: translateY(-2px) scale(1.05);
                }
                .chatbot-window {
                    animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .message-enter {
                    animation: slideUp 0.2s ease-out;
                }
                .quick-action-btn {
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .quick-action-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 25px rgba(59, 130, 246, 0.3);
                }
                @media (max-width: 768px) {
                    .chatbot-window {
                        width: calc(100vw - 20px) !important;
                        height: ${isMinimized ? '50px' : '400px'} !important;
                        right: 10px !important;
                        bottom: 75px !important;
                        maxHeight: calc(100vh - 100px) !important;
                    }
                    .chatbot-button {
                        width: 50px !important;
                        height: 50px !important;
                        bottom: 15px !important;
                        right: 15px !important;
                    }
                }
                @media (max-width: 480px) {
                    .chatbot-window {
                        width: calc(100vw - 10px) !important;
                        height: ${isMinimized ? '45px' : '350px'} !important;
                        right: 5px !important;
                        bottom: 70px !important;
                    }
                }
            `}</style>

      {/* Floating Action Button */}
      <div
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          zIndex: 1000,
        }}
      >
        <button
          onClick={toggleChat}
          className="chatbot-button"
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            background: isOpen
              ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
              : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
            color: 'white',
            fontSize: '1.25rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 32px rgba(59, 130, 246, 0.3)',
            backdropFilter: 'blur(10px)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Background Gradient Animation */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: isOpen
                ? 'linear-gradient(45deg, #ef4444, #dc2626, #b91c1c)'
                : 'linear-gradient(45deg, #3b82f6, #1d4ed8, #1e40af)',
              backgroundSize: '300% 300%',
              animation: 'gradient 3s ease infinite',
              opacity: 0.8,
            }}
          />

          {/* Icon */}
          <span
            style={{
              position: 'relative',
              zIndex: 1,
              transition: 'transform 0.3s ease',
              transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)',
            }}
          >
            {isOpen ? '✕' : '🤖'}
          </span>

          {/* Pulse Ring */}
          {!isOpen && (
            <div
              style={{
                position: 'absolute',
                top: '-2px',
                left: '-2px',
                right: '-2px',
                bottom: '-2px',
                borderRadius: '50%',
                border: '2px solid rgba(59, 130, 246, 0.4)',
                animation: 'pulse 2s infinite',
              }}
            />
          )}
        </button>
      </div>

      {/* Chat Window */}
      {isOpen && (
        <div
          className="chatbot-window"
          style={{
            position: 'fixed',
            bottom: '85px',
            right: '20px',
            width: '360px',
            height: isMinimized ? '50px' : '480px',
            maxWidth: 'calc(100vw - 40px)',
            maxHeight: 'calc(100vh - 120px)',
            background: 'rgba(15, 23, 42, 0.95)',
            borderRadius: '24px',
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            zIndex: 999,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '0.75rem 1rem',
              background:
                'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(147, 197, 253, 0.05) 100%)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1rem',
                }}
              >
                🤖
              </div>
              <div>
                <h3
                  style={{
                    margin: 0,
                    color: 'white',
                    fontSize: '0.95rem',
                    fontWeight: '600',
                  }}
                >
                  AI Assistant
                </h3>
                <p
                  style={{
                    margin: 0,
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontSize: '0.7rem',
                  }}
                >
                  Powered by Gemini
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={isMinimized ? maximizeChat : minimizeChat}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  padding: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  transition: 'all 0.2s ease',
                }}
              >
                {isMinimized ? '▲' : '▼'}
              </button>
              <button
                onClick={toggleChat}
                style={{
                  background: 'rgba(239, 68, 68, 0.2)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#ef4444',
                  padding: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  transition: 'all 0.2s ease',
                }}
              >
                ✕
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Quick Actions */}
              <div
                style={{
                  padding: '0.75rem',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                  background: 'rgba(255, 255, 255, 0.02)',
                }}
              >
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '0.4rem',
                  }}
                >
                  {quickActions.map((action, index) => (
                    <button
                      key={index}
                      onClick={() => handleQuickAction(action.prompt)}
                      className="quick-action-btn"
                      style={{
                        padding: '0.5rem',
                        background: 'rgba(59, 130, 246, 0.1)',
                        border: '1px solid rgba(59, 130, 246, 0.2)',
                        borderRadius: '8px',
                        color: '#3b82f6',
                        fontSize: '0.8rem',
                        fontWeight: '500',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        textAlign: 'left',
                      }}
                    >
                      <span>{action.icon}</span>
                      <span>{action.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Messages */}
              <div
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '0.75rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  scrollBehavior: 'smooth',
                }}
              >
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className="message-enter"
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.5rem',
                      opacity: 0,
                      animation: `slideUp 0.3s ease-out ${index * 0.1}s both`,
                    }}
                  >
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background:
                          message.role === 'user'
                            ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                            : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.9rem',
                        flexShrink: 0,
                      }}
                    >
                      {message.role === 'user' ? '👤' : '🤖'}
                    </div>
                    <div
                      style={{
                        background:
                          message.role === 'user'
                            ? 'rgba(16, 185, 129, 0.1)'
                            : 'rgba(59, 130, 246, 0.1)',
                        padding: '0.75rem',
                        borderRadius: '12px',
                        maxWidth: '85%',
                        border: `1px solid ${message.role === 'user' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(59, 130, 246, 0.2)'}`,
                        backdropFilter: 'blur(10px)',
                      }}
                    >
                      <p
                        style={{
                          margin: 0,
                          color: 'white',
                          lineHeight: '1.4',
                          fontSize: '0.85rem',
                          whiteSpace: 'pre-wrap',
                        }}
                      >
                        {message.content}
                      </p>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          color: 'rgba(255, 255, 255, 0.5)',
                          marginTop: '0.5rem',
                          display: 'block',
                        }}
                      >
                        {message.timestamp.toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                ))}

                {isTyping && <TypingIndicator />}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div
                style={{
                  padding: '0.75rem',
                  borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                  background: 'rgba(255, 255, 255, 0.02)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    gap: '0.5rem',
                    alignItems: 'flex-end',
                  }}
                >
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask me anything..."
                    disabled={loading}
                    style={{
                      flex: 1,
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '12px',
                      padding: '0.75rem',
                      color: 'white',
                      fontSize: '0.85rem',
                      resize: 'none',
                      minHeight: '18px',
                      maxHeight: '80px',
                      fontFamily: 'inherit',
                      outline: 'none',
                      transition: 'all 0.2s ease',
                      backdropFilter: 'blur(10px)',
                    }}
                    rows={1}
                  />
                  <button
                    onClick={handleSend}
                    disabled={loading || !input.trim()}
                    style={{
                      background:
                        loading || !input.trim()
                          ? 'rgba(107, 114, 128, 0.3)'
                          : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                      border: 'none',
                      borderRadius: '10px',
                      color: 'white',
                      padding: '0.75rem',
                      cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
                      fontSize: '0.9rem',
                      transition: 'all 0.2s ease',
                      minWidth: '40px',
                      height: '40px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {loading ? '⏳' : '🚀'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}


