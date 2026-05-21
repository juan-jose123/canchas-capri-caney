import { Routes, Route } from 'react-router-dom';
import { useApp } from './context/AppContext';
import Header from './components/Header';
import Notifications from './components/Notifications';
import WhatsAppButton from './components/WhatsAppButton';
import Home from './pages/Home';
import Admin from './pages/Admin';
import Login from './pages/Login';

function App() {
  const { darkMode } = useApp();

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      <Header />
      <main className="pb-24">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </main>
      <WhatsAppButton />
      <Notifications />
    </div>
  );
}

export default App;
