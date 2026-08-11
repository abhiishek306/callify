import { BellIcon } from "lucide-react";

function NoNotificationsFound() {
  return (
    <div className="flex flex-col items-center justify-center rounded-[24px] border border-base-300 bg-base-200/70 py-16 text-center shadow-sm">
      <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
        <BellIcon className="size-8" />
      </div>
      <h3 className="mb-2 text-lg font-semibold">No notifications yet</h3>
      <p className="max-w-md text-sm opacity-70">
        When you receive friend requests or messages, they’ll appear here in a neat activity feed.
      </p>
    </div>
  );
}

export default NoNotificationsFound;