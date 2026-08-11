import { useState } from "react";
import { ShipWheelIcon } from "lucide-react";
import { Link, useNavigate } from "react-router";

import useSignUp from "../hooks/useSignUp";

const SignUpPage = () => {
  const navigate = useNavigate();
  const [signupData, setSignupData] = useState({
    fullName: "",
    email: "",
    password: "",
  });

  // This is how we did it at first, without using our custom hook
  // const queryClient = useQueryClient();
  // const {
  //   mutate: signupMutation,
  //   isPending,
  //   error,
  // } = useMutation({
  //   mutationFn: signup,
  //   onSuccess: () => queryClient.invalidateQueries({ queryKey: ["authUser"] }),
  // });

  // This is how we did it using our custom hook - optimized version
  const { isPending, error, signupMutation } = useSignUp();

  const handleSignup = (e) => {
    e.preventDefault();
    signupMutation({
      ...signupData,
      email: signupData.email.trim().toLowerCase(),
    }, {
      onSuccess: () => {
        navigate("/login");
      },
    });
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

          <form onSubmit={handleSignup} className="flex-1 space-y-4">
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
                  required
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

            <button className="btn btn-primary w-full" type="submit">
              {isPending ? (
                <>
                  <span className="loading loading-spinner loading-xs" />
                  Loading...
                </>
              ) : (
                "Create Account"
              )}
            </button>

            <div className="text-center text-sm">
              <span className="opacity-70">Already have an account?</span>{" "}
              <Link to="/login" className="font-semibold text-primary hover:underline">
                Sign in
              </Link>
            </div>
          </form>
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