import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles.css';
import { WorkspaceShell } from './workspaces/WorkspaceShell';

function App() {
  return (
    <main className="app-shell">
      <WorkspaceShell />
    </main>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
