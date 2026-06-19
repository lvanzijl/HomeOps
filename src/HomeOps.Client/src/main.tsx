import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles.css';
import { WorkspaceShell } from './workspaces/WorkspaceShell';

function App() {
  return (
    <main className="app-shell">
      <header className="app-header">
        <p className="eyebrow">HomeOps</p>
        <h1>Today at Home</h1>
        <p>Your family plan, shared lists, and what is coming up next.</p>
      </header>
      <WorkspaceShell />
    </main>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
