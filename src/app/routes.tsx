import { createBrowserRouter, NavLink } from 'react-router';
import { IS } from './lib/typography';
import { DeskDoodlesHome } from './components/DeskDoodles/DeskDoodlesHome';
import { DeskDoodlesCanvas } from './components/DeskDoodles/DeskDoodlesCanvas';
import { DeskDoodlesPublicCanvas } from './components/DeskDoodles/DeskDoodlesPublicCanvas';
import { DeskDoodlesPlayground } from './components/DeskDoodles/DeskDoodlesPlayground';
import { DeskDoodlesAudit } from './components/DeskDoodles/DeskDoodlesAudit';

function NotFound() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--dir-bg)',
        color: 'var(--dir-text-primary)',
        fontFamily: IS,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 16,
        padding: 48,
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: 13 }}>Not found.</div>
      <NavLink to="/" style={{ color: 'var(--dir-text-primary)', fontSize: 13 }}>
        ← Back to Desk Doodles home
      </NavLink>
    </div>
  );
}

export const router = createBrowserRouter([
  { path: '/', Component: DeskDoodlesHome },
  { path: '/canvas', Component: DeskDoodlesCanvas },
  { path: '/public', Component: DeskDoodlesPublicCanvas },
  { path: '/playground', Component: DeskDoodlesPlayground },
  { path: '/audit', Component: DeskDoodlesAudit },
  { path: '*', Component: NotFound },
]);
