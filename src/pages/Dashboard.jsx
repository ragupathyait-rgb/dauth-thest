import { useNavigate } from "react-router-dom";
import { useDAuth } from "auth-node-test";
import { useEffect, useState } from "react";
import { setAuthToken } from "../services/apiService";
import axios from "axios";

export default function Dashboard() {
  const navigate = useNavigate();
  const { isAuthenticated, getTokens, logout, user, isLoading } = useDAuth();
  const [apiData, setApiData] = useState(null);
  const [apiError, setApiError] = useState(null);

  // Set token in API service when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const tokens = getTokens();
      if (tokens?.access_token) {
        // Set token for all API requests
        setAuthToken(tokens.access_token);
        console.log("Token set for API requests");
      }
    }
  }, [isAuthenticated, getTokens]);

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const tokens = getTokens();

  // Example: Call your backend API
  const callBackendAPI = async () => {
    try {
      setApiError(null);
      const tokenData = JSON.parse(localStorage.getItem("dauth_tokens"));
      const accessToken = tokenData?.access_token;
      console.log("Access Token: >>>>>>>>>>>>>>>>>>>>>.", accessToken);
      const response = await axios.get("http://localhost:4000/api/user/profile", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
  
      setApiData(response.data);
    } catch (error) {
      console.error("API Error:", error);
      setApiError(error.response?.data?.message || error.message || "Failed to fetch data");
    }
  };

//   {
//     "sub": "manny@bmail.earth",
//     "wallet": "0xf0c3f43602227cf80fa51425fca869f748c0b83e",
//     "email": "1_d494f4357258@privaterelay.ncog.com\r\n",
//     "email_verified": true,
//     "name": "Manimaran",
//     "phone_number": "65465465456"
// }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      {user && (
        <div className="space-y-4 p-4 bg-gray-50 rounded-xl shadow-sm border">
          <div className="p-4 bg-white rounded-lg shadow flex items-center gap-4">
            {user.picture && (
              <img
                src={user.picture}
                alt="Profile"
                className="w-16 h-16 rounded-full border"
              />
            )}
            <div>
              <p className="text-xl font-semibold">
                Welcome, <span className="font-bold">{user.name || user.email}</span>!
              </p>
              {user.email && (
                <p className="text-sm text-gray-600 mt-1">
                  Email: {user.email.trim()}
                </p>
              )}
              {user.masked_email && (
                <p className="text-sm text-gray-600 mt-1">
                  Masked Email: {user.masked_email}
                </p>
              )}
              {user.phone_number && (
                <p className="text-sm text-gray-600">
                  Phone: {user.phone_number}
                </p>
              )}
              {user.sub && (
                <p className="text-sm text-gray-600">
                  Username: {user.name}
                </p>
              )}
              {user.userId && (
                <p className="text-sm text-gray-600">
                  User ID: {user.userId}
                </p>
              )}
              {/* Wallet Section */}
              {user.wallet && (
                <div className="p-4 bg-white rounded-lg shadow flex items-center justify-between mt-4">
                  <div>
                    <p className="text-sm text-gray-500">Wallet Address</p>
                    <p className="font-mono text-sm mt-1">{user.wallet}</p>
                  </div>
                  <button
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    onClick={() => navigator.clipboard.writeText(user.wallet)}
                  >
                    Copy
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      <p className="mb-4">You are logged in via DAuth.</p>

      {/* Example: Test API call */}
      <div className="mb-4 p-4 border rounded">
        <h2 className="text-lg font-semibold mb-2">Test Backend API</h2>
        <p className="text-sm text-gray-600 mb-2">
          Token is automatically sent in Authorization header to your backend
        </p>
        <button
          onClick={callBackendAPI}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Call Backend API
        </button>
        {apiData && (
          <div className="mt-4 p-2 bg-green-50 rounded">
            <p className="text-sm font-semibold">API Response:</p>
            <pre className="mt-2 text-xs overflow-auto">
              {JSON.stringify(apiData, null, 2)}
            </pre>
          </div>
        )}
        {apiError && (
          <div className="mt-4 p-2 bg-red-50 rounded">
            <p className="text-sm font-semibold text-red-600">Error:</p>
            <p className="text-xs text-red-600">{apiError}</p>
          </div>
        )}
      </div>

      {tokens && (
        <details className="mt-4">
          <summary className="cursor-pointer text-blue-600 hover:text-blue-800 mb-2">View Tokens</summary>
          <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto text-xs">
            {JSON.stringify(tokens, null, 2)}
          </pre>
        </details>
      )}
      <button
        className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
        onClick={() => {
          setAuthToken(null); // Clear token
          logout({ returnTo: "/" });
        }}
      >
        Logout
      </button>
    </div>
  );
}
