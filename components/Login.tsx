import React, { useState } from 'react';
import { getSheetData } from '../services/googleSheetsService';
import { BookIcon, UsersIcon, ShieldCheckIcon, ChevronLeftIcon, EyeIcon, EyeOffIcon } from './icons';
import type { Teacher, Student, Principal } from '../types';

type PortalType = 'teacher' | 'parent' | 'principal';
type User = Teacher | Student | Principal;

interface LoginProps {
  portalType: PortalType;
  onBack: () => void;
  onLoginSuccess: (user: User) => void;
}

const portalConfig = {
  teacher: {
    title: 'Login Portal Guru',
    icon: <BookIcon className="w-10 h-10 text-white" />,
    placeholder: 'Masukan Pin Anda',
    sheetName: 'Teacher',
    loginField: 'Phone' as keyof Teacher,
    iconBgClass: 'bg-emerald-500',
  },
  parent: {
    title: 'Login Portal Orang Tua',
    icon: <UsersIcon className="w-10 h-10 text-white" />,
    placeholder: 'Masukan Pin Anda',
    sheetName: 'Student',
    loginField: 'NISN' as keyof Student,
    iconBgClass: 'bg-blue-500',
  },
  principal: {
    title: 'Login Portal Kepala Sekolah',
    icon: <ShieldCheckIcon className="w-10 h-10 text-white" />,
    placeholder: 'Masukan Pin Anda',
    sheetName: 'Principal',
    loginField: 'Phone' as keyof Principal,
    iconBgClass: 'bg-emerald-600',
  },
};

const Login: React.FC<LoginProps> = ({ portalType, onBack, onLoginSuccess }) => {
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  
  const config = portalConfig[portalType];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const users = await getSheetData<User>(config.sheetName);
      const user = users.find(u => String(u[config.loginField as keyof User]).trim() === inputValue.trim());
      
      if (user) {
        onLoginSuccess(user);
      } else {
        setError('Data tidak ditemukan. Silakan periksa kembali input Anda.');
      }
    } catch (err) {
      setError('Terjadi kesalahan saat login. Silakan coba lagi.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 w-full max-w-md mx-auto text-center relative border-t-8 border-emerald-600">
        <button onClick={onBack} className="absolute top-4 left-4 flex items-center text-gray-500 hover:text-gray-800 font-semibold">
            <ChevronLeftIcon className="w-5 h-5 mr-1" />
            Kembali
        </button>
      <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 mt-10 mx-auto ${config.iconBgClass}`}>
        {config.icon}
      </div>
      <h2 className="text-2xl md:text-3xl font-bold text-gray-800">{config.title}</h2>
      <p className="text-gray-500 mb-8">TK IT Harvysyah</p>

      <form onSubmit={handleLogin} className="space-y-6">
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={config.placeholder}
            required
            className="w-full px-4 py-3 pr-12 bg-gray-700 text-white rounded-lg border-2 border-transparent focus:outline-none focus:border-emerald-500 placeholder-gray-400"
            aria-label={config.placeholder}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
          >
            {showPassword ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
          </button>
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-emerald-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-emerald-600 transition-colors duration-300 disabled:bg-gray-400"
        >
          {isLoading ? 'Memverifikasi...' : 'Masuk'}
        </button>
      </form>
      {error && <p className="text-red-500 mt-4 text-sm">{error}</p>}
    </div>
  );
};

export default Login;
