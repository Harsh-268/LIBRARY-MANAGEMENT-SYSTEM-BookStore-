import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {useAuth} from '../context/AuthContext.jsx';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();


  const{login}=useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic frontend validation
    if (!email || !password) {
      toast.error('Please enter valid credentials.');
      return;
    }

    setIsLoading(true);

    try {
      const result=await login(email,password)
      
      
      // setTimeout(()=>console.log("request sent"), 1000);
      if (result.success) {
        console.log("h")
        // const {user}=useAuth()
        

        toast.success('Successfully signed in!');
  
        if(result.user.role === 'ADMIN') {
          navigate('/admin/overview');
        } else {
          navigate('/get-books');
        }
      }else{
        throw new Error(result.message)
      }

    } catch (err) {
        const errorMessage = err.response?.data?.message || 'Incorrect email or password.';
        toast.error(errorMessage);
    } finally {
      setIsLoading(false);
      
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f8fa] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      
      {/* Header Section */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center">
        {/* GitHub-style Logo Icon */}
        <svg height="48" aria-hidden="true" viewBox="0 0 16 16" version="1.1" width="48" data-view-component="true" className="fill-[#24292f] mb-6">
        </svg>
        <h2 className="text-center text-[24px] font-light tracking-tight text-[#24292f]">
          Sign in to BookStore
        </h2>
      </div>

      {/* Main Form Card */}
      <div className="mt-4 sm:mx-auto sm:w-full sm:max-w-[340px]">
        <div className="bg-white py-5 px-4 shadow-sm sm:rounded-md sm:px-6 border border-[#d0d7de]">
          
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-[#24292f] mb-1.5">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none block w-full px-3 py-1.5 border border-[#d0d7de] rounded-md shadow-sm placeholder-gray-400 bg-[#f6f8fa] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0969da] focus:border-[#0969da] sm:text-sm transition-colors"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label htmlFor="password" className="block text-sm font-semibold text-[#24292f]">
                  Password
                </label>
                <Link to="/forgot-password" className="text-xs text-[#0969da] hover:underline" tabIndex="-1">
                  Forgot password?
                </Link>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none block w-full px-3 py-1.5 border border-[#d0d7de] rounded-md shadow-sm placeholder-gray-400 bg-[#f6f8fa] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0969da] focus:border-[#0969da] sm:text-sm transition-colors"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#2da44e] hover:bg-[#2c974b] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2da44e] disabled:opacity-70 disabled:cursor-not-allowed transition-all"
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  'Sign in'
                )}
              </button>
            </div>
          </form>
        </div>

       
        <div className="mt-4 py-4 px-4 border border-[#d0d7de] rounded-md text-center text-sm text-[#24292f]">
          New to LMS?{' '}
          <Link to="/register" className="text-[#0969da] hover:underline">
            Create an account
          </Link>
          .
        </div>
      </div>
    </div>
  );
}