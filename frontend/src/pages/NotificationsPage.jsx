import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { acceptFriendRequest, getFriendRequests } from "../lib/api";
import { BellIcon, ClockIcon, MessageSquareIcon, UserCheckIcon } from "lucide-react";
import NoNotificationsFound from "../components/NoNotificationsFound";

const NotificationsPage = () => {
  const queryClient = useQueryClient();

  const { data: friendRequests, isLoading } = useQuery({
    queryKey: ["friendRequests"],
    queryFn: getFriendRequests,
  });

  const { mutate: acceptRequestMutation, isPending } = useMutation({
    mutationFn: acceptFriendRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friendRequests"] });
      queryClient.invalidateQueries({ queryKey: ["friends"] });
    },
  });

  const incomingRequests = friendRequests?.incomingReqs || [];
  const acceptedRequests = friendRequests?.acceptedReqs || [];

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="container mx-auto max-w-4xl space-y-8">
        <div className="rounded-[24px] border border-base-300 bg-base-200/70 p-5 shadow-sm">
          <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
          <p className="mt-1 text-sm opacity-70">Friend requests and new connections</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        ) : (
          <>
            {incomingRequests.length > 0 && (
              <section className="space-y-4">
                <h2 className="flex items-center gap-2 text-xl font-semibold">
                  <UserCheckIcon className="h-5 w-5 text-primary" />
                  Friend Requests
                  <span className="badge badge-primary ml-1">{incomingRequests.length}</span>
                </h2>

                <div className="space-y-3">
                  {incomingRequests.map((request) => (
                    <div
                      key={request._id}
                      className="rounded-2xl border border-base-300 bg-base-100/90 p-4 shadow-sm transition hover:bg-base-200"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="avatar h-14 w-14 rounded-full ring-2 ring-primary/20">
                            <img src={request.sender.profilePic} alt={request.sender.fullName} />
                          </div>
                          <div>
                            <h3 className="font-semibold">{request.sender.fullName}</h3>
                            <div className="mt-1 flex flex-wrap gap-1.5">
                              <span className="badge badge-secondary badge-sm">
                                Native: {request.sender.nativeLanguage}
                              </span>
                              <span className="badge badge-outline badge-sm">
                                Learning: {request.sender.learningLanguage}
                              </span>
                            </div>
                          </div>
                        </div>

                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => acceptRequestMutation(request._id)}
                          disabled={isPending}
                        >
                          Accept
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ACCEPTED REQS NOTIFICATONS */}
            {acceptedRequests.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <BellIcon className="h-5 w-5 text-success" />
                  New Connections
                </h2>

                <div className="space-y-3">
                  {acceptedRequests.map((notification) => (
                    <div key={notification._id} className="rounded-2xl border border-base-300 bg-base-100/90 p-4 shadow-sm">
                      <div className="flex items-start gap-3">
                        <div className="avatar mt-1 size-10 rounded-full ring-2 ring-success/20">
                          <img
                            src={notification.recipient.profilePic}
                            alt={notification.recipient.fullName}
                          />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold">{notification.recipient.fullName}</h3>
                          <p className="my-1 text-sm opacity-80">
                            {notification.recipient.fullName} accepted your friend request
                          </p>
                          <p className="flex items-center text-xs opacity-70">
                            <ClockIcon className="mr-1 h-3 w-3" />
                            Recently
                          </p>
                        </div>
                        <div className="badge badge-success">
                          <MessageSquareIcon className="mr-1 h-3 w-3" />
                          New Friend
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {incomingRequests.length === 0 && acceptedRequests.length === 0 && (
              <NoNotificationsFound />
            )}
          </>
        )}
      </div>
    </div>
  );
};
export default NotificationsPage;