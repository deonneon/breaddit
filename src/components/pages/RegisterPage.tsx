import { useEffect } from 'react';
import RegisterForm from '../auth/RegisterForm';
import { useAuth } from '../../context/AuthContext';

const RegisterPage = () => {
  const { user } = useAuth();

  useEffect(() => {
    // Redirect to home if already logged in
    if (user) {
      window.location.href = '/';
    }
  }, [user]);

  // Don't render the register form if user is already logged in
  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center justify-center">
            <span className="text-orange-500 mr-1">B</span>readdit
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Create a new account
          </p>
        </div>
        
        <RegisterForm />
      </div>
    </div>
  );
};

export default RegisterPage; 