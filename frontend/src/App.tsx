import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout.js';
import { AddPlantPage } from './pages/AddPlantPage.js';
import { CalendarPage } from './pages/CalendarPage.js';
import { EncyclopediaPage } from './pages/EncyclopediaPage.js';
import { EncyclopediaPassportPage } from './pages/EncyclopediaPassportPage.js';
import { HomePage } from './pages/HomePage.js';
import { SettingsPage } from './pages/SettingsPage.js';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="encyclopedia" element={<EncyclopediaPage />} />
          <Route path="encyclopedia/:id" element={<EncyclopediaPassportPage />} />
          <Route path="add-plant" element={<AddPlantPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
