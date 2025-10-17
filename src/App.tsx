import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { LanguageProvider } from './core/i18n/LanguageProvider';
import { ToastProvider } from './components/common/Toast/ToastProvider';
import { useKeyboardShortcuts } from './core/hooks/useKeyboardShortcuts';
import WorkspacePage from './app/workspace/WorkspacePage';
import HomePage from './app/home/HomePage';
import './styles/globals.css';

function AppContent() {
  // Enable global keyboard shortcuts
  useKeyboardShortcuts();

  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/workspace" element={<WorkspacePage />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <LanguageProvider>
      <ToastProvider>
        <Router
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true
          }}
        >
          <AppContent />
        </Router>
      </ToastProvider>
    </LanguageProvider>
  );
}

export default App;
