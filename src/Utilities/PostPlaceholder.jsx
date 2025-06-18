const PostPlaceholder = ({ post }) => (
    <div className="bg-white border rounded-lg mb-6 animate-pulse">
        <div className="flex items-center p-4">
            <div className="w-8 h-8 rounded-full bg-gray-300 mr-3"></div>
            <div className="h-4 bg-gray-300 rounded w-1/4"></div>
        </div>
        <div className="w-full h-96 bg-gray-300"></div>
        <div className="p-4 space-y-3">
             <div className="h-4 bg-gray-300 rounded w-1/3"></div>
             <div className="h-4 bg-gray-300 rounded w-full"></div>
             <div className="h-4 bg-gray-300 rounded w-3/4"></div>
        </div>
    </div>
);

export default PostPlaceholder;