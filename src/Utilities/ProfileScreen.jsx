const ProfileScreen = () => (
    <div className="p-4 md:p-6 h-full bg-gray-50 rounded-lg">
        <div className="flex flex-col items-center">
             <img src="https://placehold.co/96x96/E2E8F0/4A5568?text=U" alt="Profile" className="w-24 h-24 rounded-full mb-4 shadow-md" />
            <h2 className="text-2xl font-bold text-gray-800">Your Name</h2>
            <p className="text-gray-500 mb-4">@yourusername</p>
            <div className="flex space-x-6 text-center">
                <div>
                    <p className="font-bold text-lg">150</p>
                    <p className="text-sm text-gray-600">Posts</p>
                </div>
                <div>
                    <p className="font-bold text-lg">1.2k</p>
                    <p className="text-sm text-gray-600">Followers</p>
                </div>
                <div>
                    <p className="font-bold text-lg">340</p>
                    <p className="text-sm text-gray-600">Following</p>
                </div>
            </div>
             <button className="mt-6 bg-blue-500 text-white font-semibold py-2 px-6 rounded-lg hover:bg-blue-600 transition-colors duration-200 shadow-sm">
                Edit Profile
            </button>
        </div>
    </div>
);

export default ProfileScreen;