import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import HomePage from './pages/HomePage';
import ResultPage from './pages/ResultPage';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-950 text-white font-body selection:bg-indigo-500/30">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/result" element={<ResultPage />} />
        </Routes>
        <Toaster position="bottom-center" />
      </div>
    </BrowserRouter>
  );
}

export default App;