const ChatScreen = () => (
    <div className="p-4 md:p-6 h-full bg-gray-50 rounded-lg">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Chats</h2>
        {/* Chat list */}
        <div className="space-y-4">
            {['Alice', 'Bob', 'Charlie', 'David'].map(name => (
                <div key={name} className="flex items-center bg-white p-3 rounded-xl shadow-sm hover:bg-gray-100 transition-colors duration-200">
                    <img src={`https://placehold.co/48x48/E2E8F0/4A5568?text=${name.charAt(0)}`} alt={name} className="w-12 h-12 rounded-full mr-4" />
                    <div className="flex-grow">
                        <p className="font-semibold text-gray-700">{name}</p>
                        <p className="text-sm text-gray-500">Last message...</p>
                    </div>
                    <span className="text-xs text-gray-400">2 min ago</span>
                </div>
            ))}
        </div>
    </div>
);

export default ChatScreen;