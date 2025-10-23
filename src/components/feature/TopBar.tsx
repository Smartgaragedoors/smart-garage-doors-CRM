
import { useState } from 'react';
import { useSidebar } from '../../contexts/SidebarContext';

export default function TopBar() {
  const [showProfile, setShowProfile] = useState(false);
  const { toggleSidebar, isMobile } = useSidebar();

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Mobile hamburger menu */}
          {isMobile && (
            <button
              onClick={toggleSidebar}
              className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 lg:hidden transition-colors"
            >
              <i className="ri-menu-line text-xl"></i>
            </button>
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">CRM Dashboard</h1>
            <p className="text-sm text-gray-500">Manage your garage door service business</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <button className="relative p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
            <i className="ri-notification-line text-xl"></i>
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">3</span>
          </button>
          
          {/* Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowProfile(!showProfile)}
              className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-sm">AD</span>
              </div>
              <div className="text-left">
                <div className="text-gray-900 font-medium">Admin User</div>
                <div className="text-xs text-gray-500">Administrator</div>
              </div>
              <i className="ri-arrow-down-s-line text-gray-400"></i>
            </button>
            
            {showProfile && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                      <span className="text-white font-bold">AD</span>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">Admin User</div>
                      <div className="text-sm text-gray-500">admin@smartgarage.com</div>
                    </div>
                  </div>
                </div>
                <div className="py-2">
                  <button className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                    <i className="ri-user-line mr-3 text-gray-400"></i>
                    Profile Settings
                  </button>
                  <button className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                    <i className="ri-settings-line mr-3 text-gray-400"></i>
                    Account Settings
                  </button>
                  <button className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                    <i className="ri-question-line mr-3 text-gray-400"></i>
                    Help & Support
                  </button>
                  <hr className="my-2" />
                  <button className="flex items-center w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors">
                    <i className="ri-logout-box-line mr-3"></i>
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}