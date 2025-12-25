import { useState, useEffect } from 'react';
import { Editor } from './components/Editor/Editor';
import { Preview } from './components/Preview/Preview';
import './App.css';

export interface CoverState {
  appMode: 'instagram' | 'website' | 'linkedin' | 'youtube';
  title: string;
  category: string;
  image: string | null;
  isGradient: boolean;
  ratio: 'vertical' | 'square' | 'horizontal' | 'story';
  imageOrientation: 'vertical' | 'square' | 'horizontal';
  layoutMode: 'overlay' | 'split';
  template: 'bold' | 'minimal' | 'quote';
  overlayOpacity: number;
  titleColor: string;
  categoryColor: string;
  bgColor: string;
  caption: string;
  captionColor: string;
  showSafeZones: boolean;
  textTransform: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  useGlassmorphism: boolean;
  contentAlignment: 'flex-start' | 'center' | 'flex-end';
  glassBlur: number;
  glassWidth: 'full' | 'fit';
}

export const BRAND_COLORS = {
  primaryBlue: '#146AFF',
  lightBlue: '#CBDDFF',
  accentYellow: '#F5A623',
  darkText: '#183444',
  white: '#FFFFFF',
};

const STORAGE_KEY = 'mediagen_pro_state';

function App() {
  const [state, setState] = useState<CoverState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to load saved state:', e);
      }
    }
    return {
      appMode: 'instagram',
      title: 'THE FUTURE OF\nVENTURE CAPITAL',
      category: 'SaaS Trends',
      image: null,
      isGradient: true,
      ratio: 'vertical',
      imageOrientation: 'vertical',
      layoutMode: 'overlay',
      template: 'bold',
      overlayOpacity: 0.6,
      titleColor: '#FFFFFF',
      categoryColor: '#F5A623',
      bgColor: '#146AFF',
      caption: 'stanbase.tech',
      captionColor: '#FFFFFF',
      showSafeZones: false,
      textTransform: 'uppercase',
      useGlassmorphism: false,
      contentAlignment: 'flex-end',
      glassBlur: 12,
      glassWidth: 'full',
    };
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      // If localStorage is full (e.g. because of a large base64 image),
      // try saving without the image so at least text is preserved
      if (e instanceof DOMException && e.name === 'QuotaExceededError') {
        const stateWithoutImage = { ...state, image: null };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stateWithoutImage));
      }
    }
  }, [state]);

  const updateState = (updates: Partial<CoverState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  return (
    <div className="app-container">
      <header className="app-nav">
        <div className="nav-brand">MediaGen Pro</div>
        <div className="nav-tabs">
          <button
            className={state.appMode === 'instagram' ? 'active' : ''}
            onClick={() => updateState({ appMode: 'instagram', ratio: 'vertical' })}
          >
            Instagram
          </button>
          <button
            className={state.appMode === 'linkedin' ? 'active' : ''}
            onClick={() => updateState({ appMode: 'linkedin', ratio: 'horizontal' })}
          >
            LinkedIn
          </button>
          <button
            className={state.appMode === 'youtube' ? 'active' : ''}
            onClick={() => updateState({ appMode: 'youtube', ratio: 'horizontal' })}
          >
            YouTube
          </button>
          <button
            className={state.appMode === 'website' ? 'active' : ''}
            onClick={() => updateState({ appMode: 'website', ratio: 'horizontal' })}
          >
            Website
          </button>
        </div>
      </header>
      <div className="app-body">
        <aside className="sidebar">
          <Editor state={state} onChange={updateState} />
        </aside>
        <main className="main-content">
          <Preview state={state} />
        </main>
      </div>
    </div>
  );
}

export default App;
