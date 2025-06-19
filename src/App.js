//App.js
import React, { useEffect, useState } from 'react';
import { Home, Bell, Search, User, MessageCircle } from 'lucide-react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import ChatScreen from './Utilities/ChatScreen';
import NotificationsScreen from './Utilities/NotificationsScreen';
import SearchScreen from './Utilities/SearchScreen';
import Profile from './Pages/Profile'
import HomeScreen from './Pages/HomeScreen';
// import InitialsAvatar from './Utilities/InitialsAvatar';
import Navbar from './Utilities/Navbar';
import Login from './Pages/Login';
import UserProfile from './Pages/UserProfile';
import { useUserProfile, UserProfileProvider } from './context/UserProfileContext';
import LoadingAni from './components/LoadingAni';

const TABS = {
  CHAT: 'CHAT',
  NOTIFICATIONS: 'NOTIFICATIONS',
  SEARCH: 'SEARCH',
  PROFILE: 'PROFILE',
  HOME: 'HOME',
};
let logedUser = null;
const MainUI = () => {
  const [activeTab, setActiveTab] = useState(TABS.HOME);

  const renderContent = () => {
    switch (activeTab) {
      case TABS.HOME:
        return <HomeScreen />;
      case TABS.CHAT:
        return <ChatScreen />;
      case TABS.NOTIFICATIONS:
        return <NotificationsScreen />;
      case TABS.SEARCH:
        return <SearchScreen />;
      case TABS.PROFILE:
        return <Profile />;
      default:
        return <HomeScreen />;
    }
  };

  const TabButton = ({ tabName, icon: Icon }) => {
    const isActive = activeTab === tabName;
    return (
      <button
        onClick={() => setActiveTab(tabName)}
        className={`flex-1 flex justify-center items-center p-2 rounded-lg transition-all duration-300 ${isActive ? 'bg-blue-500 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-200'
          }`}
        aria-label={tabName.toLowerCase()}
      >
        <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
      </button>
    );
  };

  const { selectedUserId, setSelectedUserId } = useUserProfile();

  return (
    <div className="font-sans bg-gray-100 flex flex-col h-screen w-full">
      <main className="flex-grow flex justify-center items-start w-full py-0 md:py-8">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl flex flex-col h-full md:h-[calc(100vh-4rem)]">
          {/* Header */}
          <header className='sticky top-0 z-[100] bg-white/30 backdrop-blur-md shadow-sm' >
            <Navbar props={activeTab}/>
          </header>

          {/* Tab or Route Content */}
          <div className="flex-grow overflow-y-auto">
            {selectedUserId ? (
              <div>
                <button onClick={() => setSelectedUserId(null)} className="p-2 text-sm text-blue-600">← Back</button>
                <UserProfile userId={selectedUserId} />
              </div>
            ) : (
              renderContent()
            )}
          </div>

          {/* Bottom Navigation */}
          <nav className="sticky bottom-0 z-[100] bg-white/30 backdrop-blur-md shadow-sm">
            <div className="flex justify-around items-center space-x-2">
              <TabButton tabName={TABS.HOME} icon={Home} />
              <TabButton tabName={TABS.CHAT} icon={MessageCircle} />
              <TabButton tabName={TABS.NOTIFICATIONS} icon={Bell} />
              <TabButton tabName={TABS.SEARCH} icon={Search} />
              <TabButton tabName={TABS.PROFILE} icon={User} />
            </div>
          </nav>
        </div>
      </main>
      <p className="p-1 border-t border-gray-200 text-center w-full">
        Made with 💖 |<a href='https://alxpaced.netlify.app/'> Alxpace</a>
      </p>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      logedUser = currentUser;

    });
    return () => unsubscribe();
  }, []);

  if (loading) return <div className="text-center mt-20"><LoadingAni fullScreen />
</div>;

  return user ? (
    <UserProfileProvider>
      <MainUI />
    </UserProfileProvider>
  ) : <Login />;
}
