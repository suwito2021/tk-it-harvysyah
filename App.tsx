import React, { useState, useCallback } from 'react';
import LandingPage from './components/LandingPage.tsx';
import TeacherPortal from './components/TeacherPortal.tsx';
import ParentPortal from './components/ParentPortal.tsx';
import PrincipalPortal from './components/PrincipalPortal.tsx';
import Login from './components/Login.tsx';
import Sidebar from './components/Sidebar.tsx';
import Header from './components/Header.tsx';
import SchoolInfoModal from './components/SchoolInfoModal.tsx';
import type { Teacher, Student, Principal } from './types';

type Portal = 'landing' | 'teacher' | 'parent' | 'principal';
type User = Teacher | Student | Principal;

const App: React.FC = () => {
  const [activePortal, setActivePortal] = useState<Portal>('landing');
  const [loggedInUser, setLoggedInUser] = useState<User | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSchoolInfoVisible, setIsSchoolInfoVisible] = useState(false);

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen(prev => !prev);
  }, []);
  
  const closeSidebar = useCallback(() => {
    setIsSidebarOpen(false);
  }, []);

  const handleShowSchoolInfo = useCallback(() => {
    setIsSchoolInfoVisible(true);
    closeSidebar();
  }, [closeSidebar]);

  const handleCloseSchoolInfo = useCallback(() => {
    setIsSchoolInfoVisible(false);
  }, []);

  const handlePortalSelect = useCallback((portal: Portal) => {
    setActivePortal(portal);
    setLoggedInUser(null); // Reset user on new portal selection
    closeSidebar();
  }, [closeSidebar]);

  const handleBackToHome = useCallback(() => {
    setActivePortal('landing');
    setLoggedInUser(null);
    closeSidebar();
  }, [closeSidebar]);

  const handleLoginSuccess = useCallback((user: User) => {
    setLoggedInUser(user);
    closeSidebar();
  }, [closeSidebar]);

  const renderPortal = () => {
    switch (activePortal) {
      case 'teacher':
        return loggedInUser ? 
            <TeacherPortal onBack={handleBackToHome} teacher={loggedInUser as Teacher} /> : 
            <Login portalType="teacher" onBack={handleBackToHome} onLoginSuccess={handleLoginSuccess} />;
      case 'parent':
        return loggedInUser ? 
            <ParentPortal onBack={handleBackToHome} student={loggedInUser as Student} /> : 
            <Login portalType="parent" onBack={handleBackToHome} onLoginSuccess={handleLoginSuccess} />;
      case 'principal':
        return loggedInUser ? 
            <PrincipalPortal onBack={handleBackToHome} principal={loggedInUser as Principal} /> : 
            <Login portalType="principal" onBack={handleBackToHome} onLoginSuccess={handleLoginSuccess} />;
      case 'landing':
      default:
        return <LandingPage />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
        <Sidebar 
            isOpen={isSidebarOpen} 
            onClose={closeSidebar}
            onNavigate={handlePortalSelect}
            onGoHome={handleBackToHome}
            onShowSchoolInfo={handleShowSchoolInfo}
            isLoggedIn={!!loggedInUser}
            onLogout={handleBackToHome}
        />
        <div className="flex flex-col transition-all duration-300 md:pl-64">
            <Header onMenuClick={toggleSidebar} />
            <main className="flex-grow p-4 md:p-8 flex items-center justify-center">
                {renderPortal()}
            </main>
        </div>
        {isSchoolInfoVisible && <SchoolInfoModal onClose={handleCloseSchoolInfo} />}
    </div>
  );
};

export default App;