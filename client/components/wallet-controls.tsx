"use client";

import { useState, useEffect } from "react";
import { 
  useCurrentUser, 
  useIsSignedIn, 
  useSignOut,
  useSignInWithEmail,
  useVerifyEmailOTP,
  useSignInWithSms,
  useVerifySmsOTP,
  useSignInWithOAuth
} from "@coinbase/cdp-hooks";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export function WalletControls() {
  const { currentUser } = useCurrentUser();
  const { isSignedIn } = useIsSignedIn();
  const { signOut } = useSignOut();
  const { signInWithEmail } = useSignInWithEmail();
  const { verifyEmailOTP } = useVerifyEmailOTP();
  const { signInWithSms } = useSignInWithSms();
  const { verifySmsOTP } = useVerifySmsOTP();
  const { signInWithOAuth } = useSignInWithOAuth();
  
  const [copied, setCopied] = useState(false);
  const [showAuthMethods, setShowAuthMethods] = useState(false);
  const [authStep, setAuthStep] = useState<"method" | "email" | "sms" | "otp">("method");
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [flowId, setFlowId] = useState("");
  const [authType, setAuthType] = useState<"email" | "sms">("email");
  const [authLoading, setAuthLoading] = useState(false);
  const [balance, setBalance] = useState('0');
  const [loading, setLoading] = useState(false);

  const address = currentUser?.evmAccounts?.[0];

  // Fetch balance when user is logged in
  useEffect(() => {
    const fetchBalance = async () => {
      if (!address) {
        setBalance('0');
        return;
      }

      setLoading(true);
      try {
        const response = await fetch(`${API_URL}/api/cdp/balance/${address}`);
        const data = await response.json();
        setBalance(data.balance || '0');
      } catch (err) {
        console.error('Failed to fetch balance:', err);
        setBalance('0');
      } finally {
        setLoading(false);
      }
    };

    fetchBalance();
  }, [address]);
  // Handle email sign in
  const handleEmailSignIn = async () => {
    if (!emailOrPhone) return;
    
    setAuthLoading(true);
    
    try {
      const result = await signInWithEmail({ email: emailOrPhone });
      setFlowId(result.flowId);
      setAuthType("email");
      setAuthStep("otp");
    } catch (err) {
      console.error(err);
    } finally {
      setAuthLoading(false);
    }
  };

  // Handle mobile SMS sign in
  const handleSmsSignIn = async () => {
    if (!emailOrPhone) return;
    
    setAuthLoading(true);
    
    try {
      const result = await signInWithSms({ phoneNumber: emailOrPhone });
      setFlowId(result.flowId);
      setAuthType("sms");
      setAuthStep("otp");
    } catch (err) {
      console.error(err);
    } finally {
      setAuthLoading(false);
    }
  };

  // Verify OTP
  const handleVerifyOtp = async () => {
    if (!otp || !flowId) return;
    
    setAuthLoading(true);
    
    try {
      if (authType === "email") {
        await verifyEmailOTP({ flowId, otp });
      } else {
        await verifySmsOTP({ flowId, otp });
      }
      // User now authenticated; reset state
      setShowAuthMethods(false);
      setAuthStep("method");
      setEmailOrPhone("");
      setOtp("");
    } catch (err) {
      console.error(err);
    } finally {
      setAuthLoading(false);
    }
  };

  // Handle OAuth sign in
  const handleOAuthSignIn = async (provider: "google" | "x") => {
    setAuthLoading(true);
    
    try {
      // Check if CDP Project ID is configured
      const projectId = process.env.NEXT_PUBLIC_CDP_PROJECT_ID;
      console.log('🔍 OAuth Debug - Project ID:', projectId ? '✅ Set' : '❌ Missing');
      console.log('🔍 OAuth Debug - Provider:', provider);
      
      if (!projectId) {
        const errorMsg = 'CDP Project ID is not configured. Please set NEXT_PUBLIC_CDP_PROJECT_ID in your .env.local file and restart the dev server.';
        console.error('❌', errorMsg);
        alert(errorMsg);
        setAuthLoading(false);
        return;
      }
      
      console.log('🔄 Attempting OAuth sign-in with', provider);
      await signInWithOAuth(provider);
      console.log('✅ OAuth sign-in initiated successfully');
      setShowAuthMethods(false);
      setAuthStep("method");
    } catch (err: any) {
      console.error('❌ OAuth sign-in error:', err);
      console.error('Error details:', {
        message: err?.message,
        name: err?.name,
        stack: err?.stack,
        code: err?.code,
        cause: err?.cause
      });
      
      // Provide user-friendly error message
      const errorMessage = err?.message || err?.toString() || 'Network error occurred';
      
      let userMessage = `Failed to sign in with ${provider}.\n\nError: ${errorMessage}\n\nTroubleshooting steps:\n`;
      userMessage += `1. Verify NEXT_PUBLIC_CDP_PROJECT_ID is set in .env.local (current: ${process.env.NEXT_PUBLIC_CDP_PROJECT_ID ? '✅ Set' : '❌ Missing'})\n`;
      userMessage += `2. Restart your dev server after adding the Project ID\n`;
      userMessage += `3. Check that ${provider} OAuth is enabled in your CDP project dashboard\n`;
      userMessage += `4. Ensure redirect URIs are configured (e.g., http://localhost:3000)\n`;
      userMessage += `5. Check your network connection and CDP service status\n`;
      userMessage += `\nCheck the browser console for more details.`;
      
      alert(userMessage);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleFaucet = async () => {
    if (!address) return;
    
    try {
      const response = await fetch(`${API_URL}/api/cdp/faucet`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          address: address,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Faucet request failed");
      }
      
      // Refetch balance after faucet success
      const balanceResponse = await fetch(`${API_URL}/api/cdp/balance/${address}`);
      const balanceData = await balanceResponse.json();
      setBalance(balanceData.balance || '0');
      
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  
  // If not signed in or no address, show sign in UI
  if (!isSignedIn || !address) {
    return (
      <>
        <button 
          className="flex items-center justify-center w-full h-8 px-2 text-sm rounded-md bg-sidebar-accent hover:bg-sidebar-accent/80 text-sidebar-accent-foreground transition-colors"
          onClick={() => setShowAuthMethods(true)}
        >
          sign in
        </button>
        
        {/* Auth Modal */}
        {showAuthMethods && (
          <div className="fixed top-20 right-4 bg-card border border-border rounded-lg p-5 shadow-lg z-[1000] min-w-[300px]">
            {authStep === "method" ? (
              <div className="flex flex-col gap-3">
                <h3 className="text-lg font-semibold text-card-foreground mb-2">Sign In</h3>
                <button
                  className="w-full h-9 px-4 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => setAuthStep("email")}
                  disabled={authLoading}
                >
                  email
                </button>
                <button
                  className="w-full h-9 px-4 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => setAuthStep("sms")}
                  disabled={authLoading}
                >
                  mobile
                </button>
                <button
                  className="w-full h-9 px-4 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => handleOAuthSignIn("google")}
                  disabled={authLoading}
                >
                  google
                </button>
                <button
                  className="w-full h-9 px-4 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => handleOAuthSignIn("x")}
                  disabled={authLoading}
                >
                  X
                </button>
                <button
                  className="w-full h-9 px-4 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => setShowAuthMethods(false)}
                  disabled={authLoading}
                >
                  cancel
                </button>
              </div>
            ) : authStep === "email" ? (
              <div className="flex flex-col gap-3">
                <h3 className="text-lg font-semibold text-card-foreground mb-2">Email Sign In</h3>
                <input
                  type="email"
                  placeholder="enter your email"
                  value={emailOrPhone}
                  onChange={(e) => setEmailOrPhone(e.target.value)}
                  className="w-full h-9 px-3 rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <button
                  className="w-full h-9 px-4 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleEmailSignIn}
                  disabled={authLoading || !emailOrPhone}
                >
                  {authLoading ? "sending..." : "send OTP"}
                </button>
                <button
                  className="w-full h-9 px-4 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => { setAuthStep("method"); setEmailOrPhone(""); }}
                  disabled={authLoading}
                >
                  back
                </button>
              </div>
            ) : authStep === "sms" ? (
              <div className="flex flex-col gap-3">
                <h3 className="text-lg font-semibold text-card-foreground mb-2">SMS Sign In</h3>
                <input
                  type="tel"
                  placeholder="Enter phone (+1234567890)"
                  value={emailOrPhone}
                  onChange={(e) => setEmailOrPhone(e.target.value)}
                  className="w-full h-9 px-3 rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <button
                  className="w-full h-9 px-4 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleSmsSignIn}
                  disabled={authLoading || !emailOrPhone}
                >
                  {authLoading ? "sending..." : "send OTP"}
                </button>
                <button
                  className="w-full h-9 px-4 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => { setAuthStep("method"); setEmailOrPhone(""); }}
                  disabled={authLoading}
                >
                  back
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <h3 className="text-lg font-semibold text-card-foreground mb-2">Enter OTP</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  enter the 6-digit code sent to {emailOrPhone}
                </p>
                <input
                  type="text"
                  placeholder="Enter OTP code"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  maxLength={6}
                  className="w-full h-9 px-3 rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <button
                  className="w-full h-9 px-4 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleVerifyOtp}
                  disabled={authLoading || !otp}
                >
                  {authLoading ? "verifying..." : "verify OTP"}
                </button>
                <button
                  className="w-full h-9 px-4 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => { setAuthStep("method"); setEmailOrPhone(""); setOtp(""); }}
                  disabled={authLoading}
                >
                  back
                </button>
              </div>
            )}
          </div>
        )}
      </>
    );
  }

  return (
    <div className="flex flex-col gap-2 w-full">
      <button 
        className="flex items-center justify-center w-full h-8 px-2 text-sm rounded-md bg-sidebar-accent hover:bg-sidebar-accent/80 text-sidebar-accent-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={handleFaucet} 
        disabled={loading || authLoading}
      >
        faucet
      </button>
      <div className="flex items-center justify-between w-full h-8 px-2 rounded-md bg-sidebar-accent/50 text-sidebar-accent-foreground text-xs">
        <span>
          {address.slice(0, 6)}...{address.slice(-4)}
        </span>
        <button
          onClick={handleCopyAddress}
          className="text-sidebar-accent-foreground hover:text-sidebar-accent-foreground/80 transition-colors"
        >
          {copied ? '✓' : '📋'}
        </button>
      </div>
      <div className="flex items-center justify-center w-full h-8 px-2 rounded-md bg-sidebar-accent/50 text-sidebar-accent-foreground text-xs">
        {balance} USDC
      </div>
      <button 
        className="flex items-center justify-center w-full h-8 px-2 text-sm rounded-md bg-sidebar-accent hover:bg-sidebar-accent/80 text-sidebar-accent-foreground transition-colors"
        onClick={() => signOut()}
      >
        sign out
      </button>
    </div>
  );
}
