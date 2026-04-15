import React from 'react';

export default class GlobalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Log error to an external service if needed
    // eslint-disable-next-line no-console
    console.error('Global error boundary:', error, info);
  }

  handleReport = () => {
    const errorDetails = `Error: ${this.state.error?.toString()}`;
    const mailto = `mailto:support@pledgedhub.com?subject=App%20Error%20Report&body=${encodeURIComponent(errorDetails)}`;
    window.open(mailto, '_blank');
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', color: 'var(--error, #dc2626)', background: 'var(--bg, #fff)', fontWeight: 700, fontSize: '1.2rem' }}>
          <h2>Something went wrong.</h2>
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{this.state.error?.toString()}</pre>
          <button
            onClick={this.handleReport}
            style={{ marginTop: '1.5rem', padding: '0.7rem 1.5rem', background: 'var(--primary, #2563eb)', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, fontSize: '1rem', cursor: 'pointer', boxShadow: '0 2px 8px #e0e7ef' }}
          >
            Report this issue
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
