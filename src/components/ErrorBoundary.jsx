import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px', fontFamily: 'monospace', maxWidth: '800px', margin: '0 auto' }}>
          <h1 style={{ color: '#c8102e', fontSize: '24px', marginBottom: '20px' }}>
            ⚠️ Something went wrong
          </h1>
          <div style={{ backgroundColor: '#fff5f5', border: '2px solid #ffd5d5', padding: '20px', borderRadius: '8px' }}>
            <h2 style={{ fontSize: '18px', marginBottom: '10px' }}>Error Details:</h2>
            <pre style={{ 
              backgroundColor: '#fff', 
              padding: '15px', 
              borderRadius: '4px', 
              overflow: 'auto',
              fontSize: '14px',
              border: '1px solid #ddd'
            }}>
              {this.state.error && this.state.error.toString()}
            </pre>
            {this.state.errorInfo && (
              <>
                <h3 style={{ fontSize: '16px', marginTop: '20px', marginBottom: '10px' }}>Stack Trace:</h3>
                <pre style={{ 
                  backgroundColor: '#fff', 
                  padding: '15px', 
                  borderRadius: '4px', 
                  overflow: 'auto',
                  fontSize: '12px',
                  border: '1px solid #ddd',
                  maxHeight: '300px'
                }}>
                  {this.state.errorInfo.componentStack}
                </pre>
              </>
            )}
          </div>
          <button 
            onClick={() => window.location.reload()} 
            style={{
              marginTop: '20px',
              padding: '10px 20px',
              backgroundColor: '#0a4d2c',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '16px',
              cursor: 'pointer'
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
