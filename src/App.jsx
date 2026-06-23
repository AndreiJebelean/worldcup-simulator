import { Routes, Route } from 'react-router-dom';

import GroupStagePage from './pages/GroupStagePage';
import PlayoffPage from './pages/PlayoffPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<GroupStagePage />} />
      <Route path="/playoffs" element={<PlayoffPage />} />
    </Routes>
  );
}