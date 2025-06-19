import { Bell } from 'lucide-react';
import useUnreadNotifications from '../hooks/useUnreadNotifications';
import { Link } from 'react-router-dom';

const Navbar = ({ props }) => {
  const hasUnread = useUnreadNotifications();

  const Capitalize = (value) => {
    return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
  };

  return (
    <>
      {
        props !== 'HOME' ? '' :
          <nav className="flex justify-between items-center p-4 sticky top-0 z-[100] bg-white/30 backdrop-blur-md shadow-sm">
            <h1 className="text-lg font-bold text-blue-600 dark:text-blue-400">
              {props !== 'HOME' ? Capitalize(props) : '🔥 Chatterbox'}
            </h1>
            <div className="relative">
              <Link to="/notifications" className="relative">
                <Bell className="text-blue-600 dark:text-blue-400 w-6 h-6" />
                {hasUnread && (
                  <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
                )}
              </Link>
            </div>
          </nav>
      }
    </>
  );
};

export default Navbar;
