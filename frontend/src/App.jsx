import { useState, useEffect } from 'react';
import Auth from './components/Auth';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // When the app loads, check Local Storage for the token
  useEffect(() => {
    const token = localStorage.getItem('chatten_token');
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogout = () => {
    // Clear the vault and send the user back to the login screen
    localStorage.removeItem('chatten_token');
    localStorage.removeItem('chatten_username');
    setIsAuthenticated(false);
  };

  return (
    <div>
      {isAuthenticated ? (
        <div className="h-screen bg-gray-900 text-white flex flex-col items-center justify-center">
          <h1 className="text-3xl font-bold mb-6 tracking-wide">Welcome to Chatten!</h1>
          <p className="text-gray-400 mb-8">Your JWT token is active.</p>
          <button 
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-500 text-white font-bold py-2.5 px-6 rounded transition duration-200"
          >
            Logout
          </button>
          {/* We will build and insert the actual WebSocket chat interface here next */}
        </div>
      ) : (
        <Auth onAuthSuccess={() => setIsAuthenticated(true)} />
      )}
    </div>
  );
}