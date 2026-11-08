import { ArcadeCabinet } from './components/ArcadeCabinet';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { Analytics } from '@vercel/analytics/react';

export function App() {
  return (
    <>
      <ArcadeCabinet />
      <SpeedInsights />
      <Analytics />
    </>
  );
}

export default App;
