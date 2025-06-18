import { Bell } from 'lucide-react';
import useUnreadNotifications from '../hooks/useUnreadNotifications';
import { Link } from 'react-router-dom';

const Navbar = ({props}) => {
  const hasUnread = useUnreadNotifications();
  const Capitalize = (value)=>{
    return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
  }

  return (
    <nav className="flex justify-between items-center p-4 bg-white shadow">
      <h1 className="text-lg font-bold">{props !== 'HOME' ? Capitalize(props) : '🔥 Chatterbox'}</h1>
      <div className="relative">
        <Link to="/notifications" className="relative">
          <Bell className="text-gray-700 w-6 h-6" />
          {hasUnread && (
            <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
          )}
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;
