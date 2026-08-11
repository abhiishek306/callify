import { Link, useLocation } from "react-router";
import useAuthUser from "../hooks/useAuthUser";
import { BellIcon, HomeIcon, MessageCircleMoreIcon, PencilLineIcon, ShipWheelIcon, UsersIcon } from "lucide-react";

const Sidebar = () => {
  const { authUser } = useAuthUser();
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <aside className="hidden h-screen w-72 flex-col border-r border-base-300 bg-base-200/95 lg:flex">
      <div className="border-b border-base-300 p-5">
        <Link to="/" className="flex items-center gap-2.5">
          <ShipWheelIcon className="size-8 text-primary" />
          <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-2xl font-semibold tracking-wide text-transparent">
            Streamify
          </span>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        <Link
          to="/"
          className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition ${
            currentPath === "/" ? "bg-primary/10 text-primary" : "hover:bg-base-300/70"
          }`}
        >
          <HomeIcon className="size-5" />
          <span className="font-medium">Home</span>
        </Link>

        <Link
          to="/friends"
          className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition ${
            currentPath === "/friends" ? "bg-primary/10 text-primary" : "hover:bg-base-300/70"
          }`}
        >
          <UsersIcon className="size-5" />
          <span className="font-medium">Friends</span>
        </Link>

        <Link
          to="/notifications"
          className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition ${
            currentPath === "/notifications" ? "bg-primary/10 text-primary" : "hover:bg-base-300/70"
          }`}
        >
          <BellIcon className="size-5" />
          <span className="font-medium">Notifications</span>
        </Link>
      </nav>

      <div className="border-t border-base-300 p-4">
        <div className="flex items-center gap-3 rounded-2xl bg-base-100/80 p-3">
          <div className="avatar">
            <div className="w-11 rounded-full ring-2 ring-primary/20">
              <img src={authUser?.profilePic} alt="User Avatar" />
            </div>
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm">{authUser?.fullName}</p>
            <div className="flex items-center gap-1 text-xs text-success">
              <span className="inline-block h-2 w-2 rounded-full bg-success" />
              <span>Online</span>
            </div>
          </div>
          <Link to="/profile" className="rounded-full bg-base-200 p-2 text-base-content transition hover:bg-base-300" aria-label="Edit profile">
            <PencilLineIcon className="size-4" />
          </Link>
        </div>
      </div>
    </aside>
  );
};
export default Sidebar;