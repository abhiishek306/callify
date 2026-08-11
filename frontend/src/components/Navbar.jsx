import { Link, useLocation, useSearchParams } from "react-router";
import useAuthUser from "../hooks/useAuthUser";
import { BellIcon, LogOutIcon, MessageCircleMoreIcon, PencilLineIcon, SearchIcon, ShipWheelIcon } from "lucide-react";
import ThemeSelector from "./ThemeSelector";
import useLogout from "../hooks/useLogout";

const Navbar = () => {
  const { authUser } = useAuthUser();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const isChatPage = location.pathname?.startsWith("/chat");
  const searchQuery = searchParams.get("q") || "";

  // const queryClient = useQueryClient();
  // const { mutate: logoutMutation } = useMutation({
  //   mutationFn: logout,
  //   onSuccess: () => queryClient.invalidateQueries({ queryKey: ["authUser"] }),
  // });

  const { logoutMutation } = useLogout();

  return (
    <nav className="sticky top-0 z-30 border-b border-base-300 bg-base-200/95 backdrop-blur">
      <div className="container mx-auto flex h-16 items-center px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          {isChatPage ? (
            <Link to="/" className="flex items-center gap-2.5">
              <ShipWheelIcon className="size-8 text-primary" />
              <span className="text-xl font-semibold tracking-wide text-base-content">Streamify</span>
            </Link>
          ) : (
            <div className="flex min-w-[220px] items-center gap-2 rounded-full border border-base-300 bg-base-100 px-3 py-2">
              <SearchIcon className="size-4 opacity-70" />
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => {
                  const nextValue = event.target.value.trimStart();
                  setSearchParams(nextValue ? { q: nextValue } : {});
                }}
                placeholder="Search chats"
                className="w-full border-none bg-transparent text-sm outline-none placeholder:text-base-content/50"
              />
            </div>
          )}
        </div>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <Link to="/notifications" className="btn btn-ghost btn-circle">
            <BellIcon className="h-5 w-5 text-base-content opacity-70" />
          </Link>
          <Link to="/" className="btn btn-ghost btn-circle">
            <MessageCircleMoreIcon className="h-5 w-5 text-base-content opacity-70" />
          </Link>
          <Link to="/profile" className="btn btn-ghost btn-circle" aria-label="Edit profile">
            <PencilLineIcon className="h-5 w-5 text-base-content opacity-70" />
          </Link>
          <ThemeSelector />
          <div className="avatar">
            <div className="w-9 rounded-full ring-2 ring-primary/20">
              <img src={authUser?.profilePic} alt="User Avatar" rel="noreferrer" />
            </div>
          </div>
          <button className="btn btn-ghost btn-circle" onClick={logoutMutation}>
            <LogOutIcon className="h-5 w-5 text-base-content opacity-70" />
          </button>
        </div>
      </div>
    </nav>
  );
};
export default Navbar;