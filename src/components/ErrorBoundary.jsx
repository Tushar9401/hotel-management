import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Roomly render error", error, errorInfo);
  }

  render() {
    if (this.state.error) {
      return (
        <main className="fatal-error">
          <div className="panel">
            <span className="eyebrow">Application error</span>
            <h1>Roomly could not display this page.</h1>
            <p>{this.state.error.message}</p>
            <button className="button primary" onClick={() => window.location.reload()}>
              Reload page
            </button>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}
