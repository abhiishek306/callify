import { useState } from "react";
import { ShipWheelIcon } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import useLogin from "../hooks/useLogin";

const LoginPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });

  // This is how we did it at first, without using our custom hook
  // const queryClient = useQueryClient();
  // const {
  //   mutate: loginMutation,
  //   isPending,
  //   error,
  // } = useMutation({
  //   mutationFn: login,
  //   onSuccess: () => queryClient.invalidateQueries({ queryKey: ["authUser"] }),
  // });

  // This is how we did it using our custom hook - optimized version
  const { isPending, error, loginMutation } = useLogin();

  const handleLogin = (e) => {
    e.preventDefault();
    loginMutation({
      ...loginData,
      email: loginData.email.trim().toLowerCase(),
    }, {
      onSuccess: (data) => {
        queryClient.setQueryData(["authUser"], { user: data.user });
        navigate(data.user?.isOnboarded ? "/" : "/onboarding");
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

          <form onSubmit={handleLogin} className="flex-1 space-y-5">
            <div>
              <h2 className="text-2xl font-semibold">Welcome back</h2>
              <p className="mt-1 text-sm opacity-70">Sign in to continue chatting and learning together.</p>
            </div>

            <div className="space-y-3">
              <label className="form-control w-full">
                <span className="label-text mb-2">Email</span>
                <input
                  type="email"
                  placeholder="hello@example.com"
                  className="input input-bordered w-full"
                  value={loginData.email}
                  onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
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

            <button type="submit" className="btn btn-primary w-full" disabled={isPending}>
              {isPending ? (
                <>
                  <span className="loading loading-spinner loading-xs" />
                  Signing in...
                </>
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