import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles.css';
import { WorkspaceShell } from './workspaces/WorkspaceShell';

function App() {
  return (
    <main className="app-shell">
      <header className="app-header">
        <p className="eyebrow">HomeOps</p>
        <h1>Household Information Hub</h1>
        <p>Workspace framework foundation for future widget-driven household information surfaces.</p>
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
