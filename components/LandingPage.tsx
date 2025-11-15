import React from 'react';

const LandingPage: React.FC = () => {
  return (
    <div className="w-full max-w-6xl mx-auto text-center">
      <img 
        src="https://iili.io/KmUyjwu.png" 
        alt="Logo TK IT Harvysyah" 
        className="mx-auto mb-8 w-32 h-32 md:w-40 md:h-40"
      />
      <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-800">Selamat di Aplikasi</h1>
      <p className="text-lg md:text-xl mb-8 text-gray-600">Generasi Qurani TK IT Harvysyah</p>
      <img
        src="https://iili.io/f9XLdV2.jpg"
        alt="Kegiatan Belajar Mengajar TK IT Harvysyah"
        className="mx-auto mt-8 rounded-lg shadow-lg max-w-4xl w-full"
      />
    </div>
  );
};

export default LandingPage;