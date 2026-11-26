import {createRoot} from 'react-dom/client';
import {BrowserRouter} from 'react-router-dom';
import {MotionConfig} from 'motion/react';
import '@fontsource/plus-jakarta-sans/400.css';
import '@fontsource/plus-jakarta-sans/500.css';
import '@fontsource/plus-jakarta-sans/600.css';
import '@fontsource/plus-jakarta-sans/700.css';
import '@fontsource/plus-jakarta-sans/800.css';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <MotionConfig reducedMotion="user">
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </MotionConfig>
);
