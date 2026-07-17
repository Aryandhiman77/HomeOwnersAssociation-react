import React, { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { FiArrowLeft, FiLock, FiMail, FiShield } from "react-icons/fi";
import logo from "../../assets/images/footerImage.png";
import { isAdminLoggedIn, loginAdmin, verifyAdminOtp } from "../../lib/adminAuth";

const AdminLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [isOtpStep, setOtpStep] = useState(false);
  const [isLoading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  if (isAdminLoggedIn()) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const result = isOtpStep
        ? await verifyAdminOtp(email.trim(), otp.trim())
        : await loginAdmin(email.trim(), password);

      if (result.authenticated) {
        navigate("/admin/dashboard", { replace: true });
        return;
      }

      if (result.otpRequired) {
        setOtpStep(true);
        setMessage(result.message || "OTP sent to your email.");
      }
    } catch (requestError) {
      setError(requestError.message || "Unable to sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#eef2f4] px-5 py-8 text-[#263846]">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center justify-center">
        <section className="grid w-full overflow-hidden rounded border border-[#d7dadd] bg-white shadow-[0_16px_45px_rgba(47,66,81,0.14)] lg:grid-cols-[0.9fr_1.1fr]">
          <div className="hidden bg-[#2e4353] p-10 text-white lg:flex lg:flex-col lg:justify-between">
            <div>
              <div className="inline-flex rounded bg-white/95 p-2">
                <img src={logo} alt="HOA Nightmares" className="h-10 w-28 object-contain" />
              </div>
              <h1 className="mt-10 text-4xl font-semibold leading-tight">
                Admin Portal
              </h1>
              <p className="mt-4 max-w-sm leading-7 text-white/72">
                Secure access for reviewing submissions, CMS content, attorney records, and site settings.
              </p>
            </div>
            <div className="rounded border border-white/15 bg-white/8 p-4 text-sm text-white/72">
              <div className="flex items-center gap-2 font-semibold text-white">
                <FiShield />
                Protected workspace
              </div>
              <p className="mt-2">Use your live admin credentials to continue.</p>
            </div>
          </div>

          <div className="p-6 sm:p-10 lg:p-12">
            <div className="mb-8 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded bg-[#405b6d] text-xl text-white">
                  <FiLock />
                </div>
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#d3a85f]">
                    HOA Nightmares
                  </p>
                  <h2 className="text-3xl font-semibold text-[#2f4251]">
                    Admin Login
                  </h2>
                </div>
              </div>
              <Link
                to="/"
                className="hidden items-center gap-2 text-sm font-semibold text-[#405b6d] underline-offset-4 hover:underline sm:inline-flex"
              >
                <FiArrowLeft />
                Website
              </Link>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <label className="block text-sm font-semibold">
                Email Address
                <div className="mt-2 flex items-center rounded border border-[#cfd3d7] bg-white px-3 focus-within:border-[#4a8bc1]">
                  <FiMail className="text-[#8b949b]" />
                  <input
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    type="email"
                    autoComplete="email"
                    required
                    disabled={isOtpStep || isLoading}
                    className="w-full bg-transparent px-3 py-3 outline-none disabled:text-[#8b949b]"
                    placeholder="admin@company.com"
                  />
                </div>
              </label>

              {!isOtpStep && (
                <label className="block text-sm font-semibold">
                  Password
                  <div className="mt-2 flex items-center rounded border border-[#cfd3d7] bg-white px-3 focus-within:border-[#4a8bc1]">
                    <FiLock className="text-[#8b949b]" />
                    <input
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      type="password"
                      autoComplete="current-password"
                      required
                      disabled={isLoading}
                      className="w-full bg-transparent px-3 py-3 outline-none"
                      placeholder="Enter your password"
                    />
                  </div>
                </label>
              )}

              {isOtpStep && (
                <label className="block text-sm font-semibold">
                  Verification Code
                  <div className="mt-2 flex items-center rounded border border-[#cfd3d7] bg-white px-3 focus-within:border-[#4a8bc1]">
                    <FiShield className="text-[#8b949b]" />
                    <input
                      value={otp}
                      onChange={(event) => setOtp(event.target.value)}
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      required
                      disabled={isLoading}
                      className="w-full bg-transparent px-3 py-3 outline-none"
                      placeholder="Enter OTP"
                    />
                  </div>
                </label>
              )}

              {message && (
                <p className="rounded border border-[#b9d7ef] bg-[#eef7ff] px-4 py-3 text-sm font-semibold text-[#315b78]">
                  {message}
                </p>
              )}

              {error && (
                <p className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded bg-[#4a8bc1] px-5 py-3 text-lg font-semibold text-white shadow-sm hover:bg-[#3f7cac] disabled:opacity-60"
              >
                {isLoading ? "Please wait..." : isOtpStep ? "Verify OTP" : "Sign In"}
              </button>

              {isOtpStep && (
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => {
                    setOtpStep(false);
                    setOtp("");
                    setMessage("");
                    setError("");
                  }}
                  className="w-full rounded border border-[#cfd3d7] px-5 py-3 text-sm font-bold text-[#405b6d] disabled:opacity-60"
                >
                  Use different credentials
                </button>
              )}
            </form>
          </div>
        </section>
      </div>
    </main>
  );
};

export default AdminLogin;