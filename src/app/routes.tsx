import { createBrowserRouter, NavLink, Navigate } from 'react-router';
import { IS } from './components/cards/tokens';
import { Hero8Shell } from './components/hero8/Hero8Shell';
import { Hero8Index } from './components/hero8/Hero8Index';
import { Hero8CandidatePage } from './components/hero8/Hero8CandidatePage';

function NotFound() {
  return (
    <div style={{ padding: 48, fontFamily: IS, fontSize: 13 }}>
      <p>
        Not found. <NavLink to="/hero-8">Hero #8 lab index</NavLink>.
      </p>
    </div>
  );
}

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Hero8Shell,
    children: [
      { index: true, Component: () => <Navigate to="/hero-8" replace /> },
      { path: 'hero-8', Component: Hero8Index },
      { path: 'hero-8/:fFamilyId/:layoutFamilyId', Component: Hero8CandidatePage },
      { path: 'hero-8/:fFamilyId/:layoutFamilyId/:versionId', Component: Hero8CandidatePage },
      { path: '*', Component: NotFound },
    ],
  },
]);
