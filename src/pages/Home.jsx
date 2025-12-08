import { useDAuth } from "auth-node-test";

export default function Home() {
  const { loginWithRedirect, isAuthenticated, isLoading, user, logout } = useDAuth();
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="h-screen flex items-center justify-center">
      {!isAuthenticated ? (
        <button
          onClick={() => loginWithRedirect()}
          className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Login with DAuth
        </button>
      ) : (
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Welcome {user?.name || user?.email}</h2>
          <button
            onClick={() => logout({ returnTo: window.location.origin })}
            className="px-6 py-3 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
