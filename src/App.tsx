import { useState } from 'react';
import { Editor } from './components/Editor/Editor';
import { Preview } from './components/Preview/Preview';
import './App.css';

export interface CoverState {
  appMode: 'instagram' | 'website';
  title: string;
  category: string;
  image: string | null;
  isGradient: boolean;
  ratio: 'vertical' | 'square' | 'horizontal';
  imageOrientation: 'vertical' | 'square' | 'horizontal';
  layoutMode: 'overlay' | 'split';
  titleColor: string;
  categoryColor: string;
  bgColor: string;
  caption: string;
  captionColor: string;
  showSafeZones: boolean;
}

export const BRAND_COLORS = {
  primaryBlue: '#146AFF',
  lightBlue: '#CBDDFF',
  accentYellow: '#F5A623',
  darkText: '#183444',
  white: '#FFFFFF',
};

function App() {
  const [state, setState] = useState<CoverState>({
    appMode: 'instagram',
    title: 'THE FUTURE OF\nVENTURE CAPITAL',
    category: 'SaaS Trends',
    image: null,
    isGradient: true,
    ratio: 'vertical',
    imageOrientation: 'vertical',
    layoutMode: 'overlay',
    titleColor: '#FFFFFF',
    categoryColor: '#F5A623',
    bgColor: '#146AFF',
    caption: 'Source: MediaGen',
    captionColor: '#FFFFFF',
    showSafeZones: false,
  });

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
            Instagram Poster
          </button>
          <button
            className={state.appMode === 'website' ? 'active' : ''}
            onClick={() => updateState({ appMode: 'website', ratio: 'horizontal' })}
          >
            Website Poster
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
