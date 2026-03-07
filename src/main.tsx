import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { LoadingProvider } from './context/LoadingContext.tsx';
import { toast } from 'react-hot-toast';

// Global error handlers
window.addEventListener('unhandledrejection', (event) => {
  event.preventDefault();
  const reason = event.reason;
  let errorMessage = 'An unexpected error occurred.';
  if (reason instanceof Error) {
    errorMessage = reason.message;
    console.error('Unhandled Promise Rejection:', reason.message, reason.stack);
  } else {
    errorMessage = String(reason);
    console.error('Unhandled Promise Rejection:', reason);
  }
  
  if (!errorMessage.includes('aborted') && !errorMessage.includes('Canceled') && !errorMessage.includes('Unauthorized')) {
    toast.error(`Error: ${errorMessage.substring(0, 50)}`);
  }
});

window.addEventListener('error', (event) => {
  console.error('Global Error:', event.message, event.error);
  toast.error(`Error: ${event.message.substring(0, 50)}`);
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LoadingProvider>
      <App />
    </LoadingProvider>
  </StrictMode>,
);
