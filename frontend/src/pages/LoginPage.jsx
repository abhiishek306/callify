import { useState } from "react";
import { ShipWheelIcon } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import useLogin from "../hooks/useLogin";
import { sendPhoneOtp, verifyPhoneOtp } from "../lib/api";

const LoginPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [loginMode, setLoginMode] = useState("email");
  const [loginData, setLoginData] = useState({
    identifier: "",
    password: "",
  });
  const [otpStep, setOtpStep] = useState(false);
  const [otpInput, setOtpInput] = useState("");
  const [otpMessage, setOtpMessage] = useState("");
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  const { isPending, error, loginMutation } = useLogin();

  const finishLogin = () => {
    loginMutation(
      {
        email: loginMode === "email" ? loginData.identifier.trim().toLowerCase() : "",
        phoneNumber: loginMode === "phone" ? loginData.identifier.trim() : "",
        password: loginData.password,
      },
      {
        onSuccess: (data) => {
          queryClient.setQueryData(["authUser"], { user: data.user });
          navigate(data.user?.isOnboarded ? "/" : "/onboarding");
        },
      }
    );
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    const trimmedIdentifier = loginData.identifier.trim();

    if (!trimmedIdentifier || !loginData.password) {
      return;
    }

    if (loginMode === "phone") {
      try {
        setIsSendingOtp(true);
        const result = await sendPhoneOtp(trimmedIdentifier);
        setOtpMessage(result.message || `Verification code sent to ${trimmedIdentifier}`);
        setOtpStep(true);
      } catch (error) {
        setOtpMessage(error.response?.data?.message || "Unable to send verification code.");
      } finally {
        setIsSendingOtp(false);
      }
      return;
    }

    finishLogin();
  };

  const handleVerifyOtpAndLogin = async () => {
    if (!otpInput.trim()) {
      setOtpMessage("Please enter the 6-digit code.");
      return;
    }

    try {
      setIsVerifyingOtp(true);
      await verifyPhoneOtp({
        phoneNumber: loginData.identifier.trim(),
        code: otpInput.trim(),
      });
      finishLogin();
    } catch (error) {
      setOtpMessage(error.response?.data?.message || "The verification code is incorrect. Please try again.");
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(37,211,102,0.15),_transparent_45%)] p-4 sm:p-6 md:p-8" data-theme="forest">
      <div className="mx-auto flex w-full max-w-6xl overflow-hidden rounded-[28px] border border-primary/20 bg-base-100 shadow-2xl shadow-primary/10 lg:flex-row">
        <div className="flex w-full flex-col p-6 sm:p-8 lg:w-1/2">
          <div className="mb-8 flex items-center gap-2">
            <ShipWheelIcon className="size-9 text-primary" />
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-3xl font-bold tracking-wider text-transparent">
              Streamify
            </span>
          </div>

          {error && (
            <div className="alert alert-error mb-4">
              <span>{error.response.data.message}</span>
            </div>
          )}

          {!otpStep ? (
            <form onSubmit={handleSendOtp} className="flex-1 space-y-5">
              <div>
                <h2 className="text-2xl font-semibold">Welcome back</h2>
                <p className="mt-1 text-sm opacity-70">Sign in using your email or mobile number.</p>
              </div>

              <div className="space-y-3">
                <div className="flex gap-2 rounded-full border border-base-300 bg-base-100 p-1">
                  {[
                    { value: "email", label: "Email" },
                    { value: "phone", label: "Phone" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={`flex-1 rounded-full px-3 py-2 text-sm font-medium transition ${
                        loginMode === option.value ? "bg-primary text-primary-content" : "text-base-content/70"
                      }`}
                      onClick={() => setLoginMode(option.value)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>

                <label className="form-control w-full">
                  <span className="label-text mb-2">{loginMode === "email" ? "Email" : "Phone number"}</span>
                  <input
                    type={loginMode === "email" ? "email" : "tel"}
                    placeholder={loginMode === "email" ? "hello@example.com" : "+1 555 123 4567"}
                    className="input input-bordered w-full"
                    value={loginData.identifier}
                    onChange={(e) => setLoginData({ ...loginData, identifier: e.target.value })}
                    required
                  />
                </label>

                <label className="form-control w-full">
                  <span className="label-text mb-2">Password</span>
                  <input
                    type="password"
                    placeholder="••••••••"
                    className="input input-bordered w-full"
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    required
                  />
                </label>
              </div>

              <button type="submit" className="btn btn-primary w-full" disabled={isPending || isSendingOtp}>
                {isPending || isSendingOtp ? (
                  <>
                    <span className="loading loading-spinner loading-xs" />
                    {isSendingOtp ? "Sending code..." : "Signing in..."}
                  </>
                ) : loginMode === "phone" ? (
                  "Next"
                ) : (
                  "Sign In"
                )}
              </button>

              <div className="text-center text-sm">
                <span className="opacity-70">Don’t have an account?</span>{" "}
                <Link to="/signup" className="font-semibold text-primary hover:underline">
                  Create one
                </Link>
              </div>
            </form>
          ) : (
            <div className="flex flex-1 flex-col justify-center space-y-5">
              <div>
                <h2 className="text-2xl font-semibold">Verify your number</h2>
                <p className="mt-2 text-sm opacity-70">We sent a 6-digit code to {loginData.identifier}.</p>
              </div>

              {otpMessage && (
                <div className="alert alert-info text-sm">
                  <span>{otpMessage}</span>
                </div>
              )}

              <label className="form-control w-full">
                <span className="label-text mb-2">Enter code</span>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="123456"
                  className="input input-bordered w-full"
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ""))}
                />
              </label>

              <button className="btn btn-primary w-full" onClick={handleVerifyOtpAndLogin} disabled={isVerifyingOtp}>
                {isVerifyingOtp ? (
                  <>
                    <span className="loading loading-spinner loading-xs" />
                    Verifying...
                  </>
                ) : (
                  "Verify & Sign In"
                )}
              </button>

              <div className="flex gap-3">
                <button
                  type="button"
                  className="btn btn-ghost flex-1"
                  onClick={async () => {
                    try {
                      setIsSendingOtp(true);
                      const result = await sendPhoneOtp(loginData.identifier.trim());
                      setOtpMessage(result.message || `Verification code sent to ${loginData.identifier}`);
                    } catch (error) {
                      setOtpMessage(error.response?.data?.message || "Unable to resend code.");
                    } finally {
                      setIsSendingOtp(false);
                    }
                  }}
                >
                  Resend
                </button>

                <button
                  type="button"
                  className="btn btn-ghost flex-1"
                  onClick={() => {
                    setOtpStep(false);
                    setOtpInput("");
                    setOtpMessage("");
                  }}
                >
                  Edit number
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="hidden w-full items-center justify-center bg-primary/10 p-8 lg:flex lg:w-1/2">
          <div className="max-w-md text-center">
            <div className="mx-auto mb-6 aspect-square max-w-sm">
              <img src="/i.png" alt="Language connection illustration" className="h-full w-full" />
            </div>
            <h2 className="text-xl font-semibold">Connect with language partners worldwide</h2>
            <p className="mt-3 text-sm opacity-70">
              Practice conversations, make friends, and improve your language skills together.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
export default LoginPage;