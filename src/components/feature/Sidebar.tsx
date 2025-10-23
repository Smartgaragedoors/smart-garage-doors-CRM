
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSidebar } from '../../contexts/SidebarContext';

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: 'ri-dashboard-line', path: '/' },
  { id: 'jobs', label: 'Jobs Manager', icon: 'ri-briefcase-line', path: '/jobs' },
  { id: 'technicians', label: 'Technicians', icon: 'ri-user-settings-line', path: '/technicians' },
  { id: 'schedule', label: 'Schedule', icon: 'ri-calendar-line', path: '/schedule' },
  { id: 'dispatching', label: 'Dispatching', icon: 'ri-calendar-check-line', path: '/dispatching' },
  // { id: 'supplies', label: 'Supplies', icon: 'ri-tools-line', path: '/supplies' },
  { id: 'customers', label: 'Customer Management', icon: 'ri-user-line', path: '/customers' },
  { id: 'messages', label: 'Messages', icon: 'ri-message-3-line', path: '/messages' },
  { id: 'settings', label: 'Settings', icon: 'ri-settings-line', path: '/settings' }
];

export default function Sidebar() {
  const { isCollapsed, setIsCollapsed, toggleSidebar, isMobile, setIsMobile } = useSidebar();
  const navigate = useNavigate();
  const location = useLocation();

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024; // lg breakpoint
      setIsMobile(mobile);
      // Auto-collapse on mobile by default
      if (mobile) {
        setIsCollapsed(true);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [setIsMobile, setIsCollapsed]);

  const handleMenuItemClick = (path: string) => {
    // Navigate to the path first
    navigate(path);
    
    // Auto-collapse on mobile after navigation
    if (isMobile) {
      setTimeout(() => {
        setIsCollapsed(true);
      }, 100);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <>
      {/* Mobile overlay */}
      {isMobile && !isCollapsed && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsCollapsed(true)}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        bg-white border-r border-gray-200 transition-all duration-300 flex flex-col z-50 shadow-lg
        ${isMobile 
          ? (isCollapsed ? 'w-16' : 'w-64 fixed left-0 top-0 h-full') 
          : (isCollapsed ? 'w-16' : 'w-64')
        }
      `}>
        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center justify-between">
            {!isCollapsed && (
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <i className="ri-home-gear-line text-white text-xl"></i>
                </div>
                <div>
                  <span className="font-bold text-xl text-gray-900" style={{ fontFamily: 'Pacifico, serif' }}>
                    Smart Garage
                  </span>
                  <div className="text-xs text-gray-500 font-medium">CRM System</div>
                </div>
              </div>
            )}
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-lg hover:bg-white/50 transition-colors"
            >
              <i className={`ri-menu-${isCollapsed ? 'unfold' : 'fold'}-line text-gray-600 text-lg`}></i>
            </button>
          </div>
        </div>
      
        <nav className="mt-4 flex-1 px-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleMenuItemClick(item.path)}
              className={`w-full flex items-center px-3 py-3 text-left hover:bg-gray-50 transition-all duration-200 rounded-lg mb-1 ${
                location.pathname === item.path 
                  ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-r-2 border-blue-600 text-blue-700 font-medium' 
                  : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              <i className={`${item.icon} text-lg ${isCollapsed ? 'mx-auto' : 'mr-3'} ${location.pathname === item.path ? 'text-blue-600' : ''}`}></i>
              {!isCollapsed && <span className="font-medium">{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-gray-200 bg-gray-50/50">
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-3 py-3 text-left hover:bg-red-50 transition-all duration-200 rounded-lg text-red-600 hover:text-red-700"
          >
            <i className={`ri-logout-box-line text-lg ${isCollapsed ? 'mx-auto' : 'mr-3'}`}></i>
            {!isCollapsed && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </div>
    </>
  );
}
