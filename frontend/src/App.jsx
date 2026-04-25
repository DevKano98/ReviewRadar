import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import HomePage from './pages/HomePage';
import ResultPage from './pages/ResultPage';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[var(--page-bg)] text-[var(--ink)] selection:bg-blue-200">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/result" element={<ResultPage />} />
          <Route path="/product/:productId" element={<ResultPage />} />
        </Routes>
        <Toaster position="bottom-center" />
      </div>
    </BrowserRouter>
  );
}

export default App;
