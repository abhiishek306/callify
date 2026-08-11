import { useState } from "react";
import { ShipWheelIcon } from "lucide-react";
import { Link, useNavigate } from "react-router";

import useSignUp from "../hooks/useSignUp";
import { sendPhoneOtp, verifyPhoneOtp } from "../lib/api";

const SignUpPage = () => {
  const navigate = useNavigate();
  const [signupData, setSignupData] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    password: "",
  });
  const [otpStep, setOtpStep] = useState(false);
  const [otpInput, setOtpInput] = useState("");
  const [otpMessage, setOtpMessage] = useState("");
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  const { isPending, error, signupMutation } = useSignUp();

  const handleSendOtp = async (e) => {
    e.preventDefault();

    if (!signupData.fullName || !signupData.password) {
      setOtpMessage("Please fill in your name and password.");
      return;
    }

    if (!signupData.phoneNumber.trim()) {
      setOtpMessage("Phone number is required for verification.");
      return;
    }

    try {
      setIsSendingOtp(true);
      const phoneNumber = signupData.phoneNumber.trim();
      const result = await sendPhoneOtp(phoneNumber);
      setOtpMessage(result.message || `Verification code sent to ${phoneNumber}`);
      setOtpStep(true);
    } catch (error) {
      setOtpMessage(error.response?.data?.message || "Unable to send verification code. Please try again.");
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleSignup = () => {
    signupMutation(
      {
        ...signupData,
        email: signupData.email.trim().toLowerCase(),
        phoneNumber: signupData.phoneNumber.trim(),
      },
      {
        onSuccess: () => {
          navigate("/login");
        },
      }
    );
  };

  const handleVerifyOtpAndSignup = async () => {
    if (!otpInput.trim()) {
      setOtpMessage("Please enter the 6-digit code.");
      return;
    }

    try {
      setIsVerifyingOtp(true);
      await verifyPhoneOtp({
        phoneNumber: signupData.phoneNumber.trim(),
        code: otpInput.trim(),
      });
      setOtpMessage("Phone verified successfully.");
      handleSignup();
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

          {otpMessage && !otpStep && (
            <div className="alert alert-info mb-4 text-sm">
              <span>{otpMessage}</span>
            </div>
          )}

          {!otpStep ? (
            <form onSubmit={handleSendOtp} className="flex-1 space-y-4">
              <div>
                <h2 className="text-2xl font-semibold">Create your account</h2>
                <p className="mt-1 text-sm opacity-70">Join and start connecting with language partners right away.</p>
              </div>

              <div className="space-y-3">
                <label className="form-control w-full">
                  <span className="label-text mb-2">Full Name</span>
                  <input
                    type="text"
                    placeholder="John Doe"
                    className="input input-bordered w-full"
                    value={signupData.fullName}
                    onChange={(e) => setSignupData({ ...signupData, fullName: e.target.value })}
                    required
                  />
                </label>

                <label className="form-control w-full">
                  <span className="label-text mb-2">Email</span>
                  <input
                    type="email"
                    placeholder="john@gmail.com"
                    className="input input-bordered w-full"
                    value={signupData.email}
                    onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                  />
                </label>

                <label className="form-control w-full">
                  <span className="label-text mb-2">Phone number</span>
                  <input
                    type="tel"
                    placeholder="+1 555 123 4567"
                    className="input input-bordered w-full"
                    value={signupData.phoneNumber}
                    onChange={(e) => setSignupData({ ...signupData, phoneNumber: e.target.value })}
                  />
                </label>

                <label className="form-control w-full">
                  <span className="label-text mb-2">Password</span>
                  <input
                    type="password"
                    placeholder="********"
                    className="input input-bordered w-full"
                    value={signupData.password}
                    onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                    required
                  />
                  <span className="label-text-alt mt-1">Password must be at least 6 characters long</span>
                </label>

                <label className="flex cursor-pointer items-start gap-2 rounded-xl border border-base-300 bg-base-100 p-3">
                  <input type="checkbox" className="checkbox checkbox-sm mt-0.5" required />
                  <span className="text-sm leading-tight">
                    I agree to the <span className="text-primary hover:underline">terms of service</span> and <span className="text-primary hover:underline">privacy policy</span>.
                  </span>
                </label>
              </div>

              <button className="btn btn-primary w-full" type="submit" disabled={isSendingOtp}>
                {isPending || isSendingOtp ? (
                  <>
                    <span className="loading loading-spinner loading-xs" />
                    {isSendingOtp ? "Sending code..." : "Loading..."}
                  </>
                ) : (
                  "Next"
                )}
              </button>

              <div className="text-center text-sm">
                <span className="opacity-70">Already have an account?</span>{" "}
                <Link to="/login" className="font-semibold text-primary hover:underline">
                  Sign in
                </Link>
              </div>
            </form>
          ) : (
            <div className="flex flex-1 flex-col justify-center space-y-5">
              <div>
                <h2 className="text-2xl font-semibold">Verify your number</h2>
                <p className="mt-2 text-sm opacity-70">We sent a 6-digit code to {signupData.phoneNumber}.</p>
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

              <button className="btn btn-primary w-full" onClick={handleVerifyOtpAndSignup} disabled={isVerifyingOtp}>
                {isVerifyingOtp ? (
                  <>
                    <span className="loading loading-spinner loading-xs" />
                    Verifying...
                  </>
                ) : (
                  "Verify & Create Account"
                )}
              </button>

              <div className="flex gap-3">
                <button
                  type="button"
                  className="btn btn-ghost flex-1"
                  onClick={async () => {
                    try {
                      setIsSendingOtp(true);
                      const result = await sendPhoneOtp(signupData.phoneNumber.trim());
                      setOtpMessage(result.message || `Verification code sent to ${signupData.phoneNumber}`);
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

export default SignUpPage;