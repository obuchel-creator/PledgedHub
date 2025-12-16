
import React from 'react';
import { getViteEnv } from '../utils/getViteEnv';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // You can log error info here or send to a service
    // Use getViteEnv for environment check
    if (getViteEnv().NODE_ENV === 'development') {
      console.error('ErrorBoundary caught:', error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#b91c1c' }}>
          <h2>Something went wrong.</h2>
          <p>
            We&apos;re sorry, but an unexpected error occurred. Please refresh the page or try again
            later.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}
