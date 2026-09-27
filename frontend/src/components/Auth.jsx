import { useState } from 'react';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log(`Attempting to ${isLogin ? 'login' : 'register'} with:`, username, password);
  };

  return (
    <div className="h-screen bg-gray-900 flex items-center justify-center">
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-96 border border-gray-700">
        <h2 className="text-2xl font-bold text-white mb-6 text-center tracking-wide">
          {isLogin ? 'Chatten Login' : 'Chatten Registration'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-gray-400 mb-1 text-sm font-medium">Username</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-2.5 rounded bg-gray-900 text-white border border-gray-700 focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none transition-colors"
              required
            />
          </div>
          
          <div>
            <label className="block text-gray-400 mb-1 text-sm font-medium">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2.5 rounded bg-gray-900 text-white border border-gray-700 focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none transition-colors"
              required
            />
          </div>

          <button 
            type="submit" 
            className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-2.5 px-4 rounded transition duration-200 mt-2"
          >
            {isLogin ? 'Authenticate' : 'Create Account'}
          </button>
        </form>

        <p className="text-gray-400 text-sm text-center mt-6">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button 
            onClick={() => setIsLogin(!isLogin)} 
            className="text-green-400 hover:text-green-300 hover:underline transition-colors font-medium"
            type="button"
          >
            {isLogin ? 'Register' : 'Login'}
          </button>
        </p>
      </div>
    </div>
  );
}