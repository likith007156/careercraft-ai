import React, { useContext, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { AppContext } from '../../context/AppContext';
import { 
  LayoutDashboard, BookOpen, Brain, Code2, 
  MessageSquare, Mic, Star, BarChart3, 
  Library, Edit3, ChevronLeft, ChevronRight, Menu,
  Sun, Moon
} from 'lucide-react';

const Sidebar = () => {
  const { user, darkMode, toggleDarkMode } = useContext(AppContext);
  const [collapsed, setCollapsed] = useState(false);

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Learn', path: '/learn', icon: BookOpen },
    { name: 'Quiz', path: '/quiz', icon: Brain },
    { name: 'Code Lab', path: '/code', icon: Code2 },
    { name: 'Communication', path: '/communication', icon: MessageSquare },
    { name: 'Interview', path: '/interview', icon: Mic },
    { name: 'My Project', path: '/myproject', icon: Star },
    { name: 'Progress', path: '/progress', icon: BarChart3 },
    { name: 'Resources', path: '/resources', icon: Library },
    { name: 'Notes', path: '/notes', icon: Edit3 }
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside 
        className={`hidden md:flex flex-col h-screen fixed left-0 top-0 z-30 bg-background-sidebar border-r border-black/5 dark:border-white/5 transition-all duration-300 ${collapsed ? 'w-20' : 'w-64'}`}
      >
        {/* Header Logo */}
        <div className="flex items-center justify-between p-6 border-b border-black/5 dark:border-white/5">
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="bg-primary w-9 h-9 rounded-card flex items-center justify-center font-bold text-white text-lg shrink-0">
              CC
            </div>
            {!collapsed && (
              <span className="font-serif font-bold text-lg text-text-primary tracking-wide">
                CareerCraft AI
              </span>
            )}
          </div>
          <button 
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-button hover:bg-black/5 dark:hover:bg-white/5 text-text-secondary hover:text-text-primary transition-colors"
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* User Mini-Profile */}
        {!collapsed && (
          <div className="p-5 border-b border-black/5 dark:border-white/5 bg-black/[0.01] dark:bg-white/[0.01]">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-primary p-0.5 flex items-center justify-center font-bold text-white uppercase text-base">
                {user.username.substring(0, 2)}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-sm truncate text-text-primary">{user.username}</p>
                <p className="text-xs text-text-secondary">Level {user.level} Prep</p>
              </div>
            </div>
            {/* XP progress bar */}
            <div className="mt-3">
              <div className="flex justify-between text-[10px] text-text-secondary mb-1">
                <span>XP Progress</span>
                <span>{user.totalXp} XP</span>
              </div>
              <div className="w-full bg-black/10 dark:bg-white/10 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="bg-primary h-full transition-all duration-500"
                  style={{ width: `${(user.totalXp % 500) / 5}%` }}
                ></div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Items */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) => 
                  `flex items-center space-x-4 px-4 py-3 rounded-card text-sm font-medium transition-all duration-200 group ${
                    isActive 
                      ? 'bg-primary text-white shadow-card' 
                      : 'text-text-secondary hover:bg-black/5 dark:hover:bg-white/5 hover:text-text-primary'
                  }`
                }
              >
                <Icon size={20} className="shrink-0" />
                {!collapsed && <span className="truncate">{item.name}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer with Theme Toggle */}
        {!collapsed ? (
          <div className="p-4 border-t border-black/5 dark:border-white/5 flex flex-col items-center space-y-3">
            <button
              onClick={toggleDarkMode}
              className="w-full py-2 px-3 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 rounded-button text-text-primary font-bold text-xs flex items-center justify-center space-x-2 transition-all border border-black/5 dark:border-white/5"
            >
              {darkMode ? (
                <>
                  <Sun size={14} className="text-amber-500" />
                  <span>Steep Light Mode</span>
                </>
              ) : (
                <>
                  <Moon size={14} className="text-blue-500" />
                  <span>Classic Dark Mode</span>
                </>
              )}
            </button>
            <div className="text-[10px] text-text-secondary text-center">
              Focus: <span className="text-secondary font-semibold">{user.companyFocus}</span>
            </div>
          </div>
        ) : (
          <div className="p-4 border-t border-black/5 dark:border-white/5 flex justify-center">
            <button 
              onClick={toggleDarkMode}
              title={darkMode ? "Switch to Steep Light Mode" : "Switch to Classic Dark Mode"}
              className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-text-secondary hover:text-text-primary"
            >
              {darkMode ? <Sun size={18} className="text-amber-500" /> : <Moon size={18} className="text-blue-500" />}
            </button>
          </div>
        )}
      </aside>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-background-card/95 border-t border-black/5 dark:border-white/5 backdrop-blur-lg flex items-center justify-around py-2 px-1">
        {navItems.slice(0, 5).map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) => 
                `flex flex-col items-center py-1 px-3 rounded-md text-[10px] font-medium transition-colors ${
                  isActive ? 'text-primary' : 'text-text-secondary'
                }`
              }
            >
              <Icon size={20} />
              <span className="mt-1 truncate max-w-[60px]">{item.name}</span>
            </NavLink>
          );
        })}
        {/* Mobile theme toggle button instead of "More" or in addition */}
        <button
          onClick={toggleDarkMode}
          className="flex flex-col items-center py-1 px-3 rounded-md text-[10px] font-medium text-text-secondary hover:text-primary transition-colors"
        >
          {darkMode ? <Sun size={20} className="text-amber-500" /> : <Moon size={20} className="text-blue-500" />}
          <span className="mt-1">Theme</span>
        </button>
      </nav>
    </>
  );
};

export default Sidebar;
