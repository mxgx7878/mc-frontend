// src/components/layout/DashboardLayout.tsx
import { ReactNode, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Menu, 
  X, 
  LogOut, 
  User, 
  Settings,
  ChevronDown
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

interface DashboardLayoutProps {
  children: ReactNode;
  menuItems: Array<{
    label: string;
    path: string;
    icon: ReactNode;
  }>;
}

const DashboardLayout = ({ children, menuItems }: DashboardLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileDropdown, setProfileDropdown] = useState(false);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  // ✅ Navigate to profile page based on user role
  const handleProfileClick = () => {
    setProfileDropdown(false);
    navigate(`/${user?.role}/profile`);
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-secondary-50">
      {/* Header */}
      <header className="bg-white border-b border-secondary-200 fixed top-0 left-0 right-0 z-40">
        <div className="flex items-center justify-between px-4 py-4">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 rounded-lg hover:bg-secondary-100 transition-colors"
          >
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          {/* Logo */}
          <div className="flex items-center gap-3">
            <img
              src="https://demowebportals.com/material_connect/public/assets/img/logo-text.png"
              alt="Material Connect"
              className="h-8"
            />
          </div>

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setProfileDropdown(!profileDropdown)}
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary-100 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center text-white font-medium">
                {user?.profile_image ? (
                  <img
                    src={`${import.meta.env.VITE_IMAGE_BASE_URL}${user.profile_image}`}
                    alt={user.name}
                    className="w-full h-full rounded-full object-cover"
                  />) : (
                  user?.name.charAt(0).toUpperCase()
                )}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-secondary-900">{user?.name}</p>
                <p className="text-xs text-secondary-500 capitalize">{user?.role}</p>
              </div>
              <ChevronDown size={16} className="text-secondary-400" />
            </button>

            {/* Dropdown Menu */}
            {profileDropdown && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setProfileDropdown(false)}
                />
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-secondary-200 py-2 z-50">
                  <div className="px-4 py-3 border-b border-secondary-200">
                    <p className="text-sm font-medium text-secondary-900">{user?.name}</p>
                    <p className="text-xs text-secondary-500">{user?.email}</p>
                  </div>
                  
                  {/* ✅ Profile button with navigation */}
                  <button 
                    onClick={handleProfileClick}
                    className="w-full px-4 py-2 text-left text-sm text-secondary-700 hover:bg-secondary-50 flex items-center gap-2 transition-colors"
                  >
                    <User size={16} />
                    Profile Settings
                  </button>
                  
                  <button className="w-full px-4 py-2 text-left text-sm text-secondary-700 hover:bg-secondary-50 flex items-center gap-2 transition-colors">
                    <Settings size={16} />
                    Settings
                  </button>
                  
                  <hr className="my-2 border-secondary-200" />
                  
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2 text-left text-sm text-error-600 hover:bg-error-50 flex items-center gap-2 transition-colors"
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <aside
        className={`
          fixed top-16 left-0 bottom-0 w-64 bg-white border-r border-secondary-200 z-30 transition-transform duration-300
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
      >
        <nav className="p-4 space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-lg transition-all
                ${
                  isActive(item.path)
                    ? 'bg-primary-50 text-primary-600 font-medium'
                    : 'text-secondary-700 hover:bg-secondary-50'
                }
              `}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="pt-16 lg:pl-64">
        <div className="p-6">
          {children}
        </div>
      </main>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default DashboardLayout;