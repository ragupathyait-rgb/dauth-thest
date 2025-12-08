import { useSearchParams } from "react-router-dom";
import { useEffect, useState, useRef, useMemo } from "react";
import { DAuth } from "auth-node-test";

export default function Login() {
  const [params] = useSearchParams();
  const [status, setStatus] = useState("");
  const [wallet, setWallet] = useState("");
  const [userAccounts, setUserAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const walletCallMade = useRef(false);

  const client_id = params.get("client_id");
  const redirect_uri = params.get("redirect_uri");
  const state = params.get("state");
  const code_challenge = params.get("code_challenge") || "";
  const code_challenge_method = params.get("code_challenge_method") || "S256";

  // Initialize DAuth SDK (memoized to avoid recreating on every render)
  const dauth = useMemo(() => new DAuth({
    clientId: client_id || import.meta.env.VITE_CLIENT_ID,
    redirectUri: `${window.location.origin}/callback`,
  }), [client_id, redirect_uri]);


  useEffect(() => {

    const getWalletDetails = async () => {
      // Prevent multiple calls using ref
      if (walletCallMade.current) {
        console.log("Wallet call already made, skipping...");
        return;
      }

      walletCallMade.current = true;
      console.log("Making wallet call...");
      console.log("Window.ncogProvider available:", !!window.ncogProvider);

      // Check if wallet is available
      if (!dauth.isWalletAvailable()) {
        console.warn("NCOG provider not detected. Waiting...");
        const isAvailable = await dauth.waitForWallet(5000);
        if (!isAvailable) {
          setStatus("NCOG wallet extension not detected. Please install or enable the NCOG extension.");
          setIsLoading(false);
          return;
        }
      }

      const walletData = await dauth.getWallet();
      console.log("Wallet data received:", walletData);

      if (!walletData) {
        setStatus("Could not connect to wallet. Please ensure NCOG extension is enabled and an account is selected.");
        setIsLoading(false);
        return;
      }

      if (walletData?.accountAddress) {
        console.log("Wallet found with address:", walletData.accountAddress);
        console.log("Getting user accounts...");

        try {
          const accounts = await dauth.getUserAccounts(walletData.accountAddress);
          console.log("User accounts retrieved:", accounts);

          if (accounts && accounts.length > 0) {
            setUserAccounts(accounts);
            setWallet(walletData);
            setIsLoading(false);
          } else {
            setStatus("No active accounts found for this wallet address. Please register an account first.");
            setIsLoading(false);
          }
        } catch (error) {
          console.error("Error getting user accounts:", error);
          setStatus(`Error retrieving accounts: ${error.message || 'Unknown error'}`);
          setIsLoading(false);
        }
      } else {
        console.warn("Wallet data missing accountAddress:", walletData);
        setStatus("Wallet account address not found. Please select an account in the NCOG extension.");
        setIsLoading(false);
      }
    }

    getWalletDetails();
  }, [dauth]);


  const handleAccountSelect = (account) => {
    console.log("Account selected: >>>>>>>>>>>>>>>", account);
    setSelectedAccount(account);
  };

  const handleLogin = async () => {
    if (!selectedAccount) {
      setStatus("Please select an account to continue.");
      return;
    }

    setStatus("Preparing authentication...");

    try {
      setStatus("Requesting challenge...");

      const { challenge } = await dauth.requestWalletChallenge({
        client_id,
        redirect_uri,
        state,
        code_challenge,
        code_challenge_method
      });

      setStatus("Waiting for wallet signature...");
      const signature = await dauth.getSignature(challenge);
      if (!signature) {
        setStatus("Signature rejected or wallet unavailable.");
        return;
      }

      setStatus("Verifying...");
      const { code } = await dauth.verifyWalletSignature({
        walletAddress: wallet?.accountAddress,
        publicKey: wallet?.publicKey,
        signature,
        client_id,
        redirect_uri,
        state,
        email: selectedAccount?.email,
      });

      setStatus("Redirecting...");
      window.location.href = `${redirect_uri}?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state || "")}`;
    } catch (error) {
      console.error("Login error:", error);
      setStatus("Authentication failed. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen flex justify-center items-center bg-gray-50">
        <div className="bg-white p-8 shadow-lg rounded-lg w-96 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your accounts...</p>
        </div>
      </div>
    );
  }

  if (userAccounts.length === 0 && !isLoading) {
    return (
      <div className="h-screen flex justify-center items-center bg-gray-50">
        <div className="bg-white p-8 shadow-lg rounded-lg w-96 text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">No Accounts Found</h2>
          <p className="text-gray-600 mb-4">{status || "No active accounts found for this wallet address."}</p>
          <div className="space-y-2">
            <button
              onClick={() => {
                walletCallMade.current = false;
                setIsLoading(true);
                setStatus("");
                window.location.reload();
              }}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
            <button
              onClick={() => window.location.href = "/"}
              className="w-full bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex justify-center items-center bg-gray-50">
      <div className="bg-white p-8 shadow-lg rounded-lg w-[30rem] max-w-md">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Choose an Account</h1>
          <p className="text-gray-600">Select the account you want to use to sign in</p>
        </div>

        <div className="space-y-2 mb-6 max-h-64 overflow-y-auto">
          {userAccounts.map((account) => (
            <div
              key={account.id}
              onClick={() => handleAccountSelect(account)}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${selectedAccount?.id === account.id
                  ? 'border-blue-500 bg-blue-50 shadow-md'
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                }`}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${selectedAccount?.id === account.id
                    ? 'border-blue-500 bg-blue-500'
                    : 'border-gray-300'
                  }`}>
                  {selectedAccount?.id === account.id && (
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                      {account.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{account.name}</p>
                      <p className="text-sm text-gray-500 truncate">{account.email}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={handleLogin}
          disabled={!selectedAccount}
          className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 ${selectedAccount
              ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
        >
          {selectedAccount ? 'Continue with Selected Account' : 'Select an Account to Continue'}
        </button>

        {status && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700 text-center">{status}</p>
          </div>
        )}

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            By continuing, you agree to the terms of service and privacy policy
          </p>
        </div>
      </div>
    </div>
  );
}
