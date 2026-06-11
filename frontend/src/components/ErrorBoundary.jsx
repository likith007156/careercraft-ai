import { Component } from 'react';

export default class ErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: '16px',
          background: '#f7f7f8',
          fontFamily: 'Inter, sans-serif',
          padding: '24px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '48px', fontFamily: 'serif', color: '#17191c', lineHeight: 1 }}>
            Oops
          </div>
          <div style={{ fontSize: '14px', color: '#777b86', maxWidth: '320px', lineHeight: 1.6 }}>
            Something went wrong. Your progress is saved. Please refresh the page.
          </div>
          {import.meta.env.DEV && this.state.error && (
            <pre style={{
              fontSize: '11px', color: '#c62828', background: '#ffebee',
              padding: '12px', borderRadius: '8px', maxWidth: '480px',
              overflow: 'auto', textAlign: 'left'
            }}>
              {this.state.error.toString()}
            </pre>
          )}
          <button
            onClick={() => window.location.reload()}
            style={{
              background: '#17191c', color: '#fff', border: 'none',
              padding: '10px 28px', borderRadius: '9999px', fontSize: '13px',
              cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontWeight: '600',
              marginTop: '8px'
            }}
          >
            Refresh page
          </button>
          <button
            onClick={() => { this.setState({ hasError: false }); window.location.href = '/dashboard'; }}
            style={{
              background: 'transparent', color: '#5d2a1a', border: 'none',
              fontSize: '12px', cursor: 'pointer', fontFamily: 'Inter, sans-serif',
              textDecoration: 'underline'
            }}
          >
            Go to Dashboard
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
