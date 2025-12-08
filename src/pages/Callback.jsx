import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDAuth } from "auth-node-test";

export default function Callback() {
  const navigate = useNavigate();
  const { handleCallback } = useDAuth();

  useEffect(() => {
    const processCallback = async () => {
      try {
        await handleCallback();
        navigate("/dashboard");
      } catch (error) {
        console.error("Callback error:", error);
        navigate("/");
      }
    };

    processCallback();
  }, [handleCallback, navigate]);

  return (
    <div className="h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h1 className="text-xl font-semibold">Completing sign-in...</h1>
      </div>
    </div>
  );
}


