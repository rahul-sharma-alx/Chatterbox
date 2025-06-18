// InitialsAvatar.jsx
function getInitials(name) {
  return name
    .split(" ")
    .map(word => word[0])
    .join("")
    .toUpperCase();
}

export default function InitialsAvatar({ name }) {
  return (
    <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-lg">
      {getInitials(name)}
    </div>
  );
}

// Usage:
// <InitialsAvatar name="Rahul Sharma" />