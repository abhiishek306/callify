import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  getOutgoingFriendReqs,
  getRecommendedUsers,
  getUserFriends,
  sendFriendRequest,
} from "../lib/api";
import { Link, useSearchParams } from "react-router";
import { CheckCircleIcon, MapPinIcon, PencilIcon, UserPlusIcon, UsersIcon } from "lucide-react";

import { capitialize } from "../lib/utils";
import useAuthUser from "../hooks/useAuthUser";

import { getLanguageFlag } from "../components/FriendCard";
import NoFriendsFound from "../components/NoFriendsFound";

const HomePage = () => {
  const queryClient = useQueryClient();
  const { authUser } = useAuthUser();
  const photoInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeFilter, setActiveFilter] = useState("all");
  const [showStatusComposer, setShowStatusComposer] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [statusDraft, setStatusDraft] = useState("");
  const [statusHighlights, setStatusHighlights] = useState(() => {
    const buildDefaultStatuses = () => [
      { id: "1", name: "Your status", avatar: "https://i.pravatar.cc/150?img=12", note: "Just now", type: "text", preview: null, expiresAt: Date.now() + 24 * 60 * 60 * 1000 },
      { id: "2", name: "Maria", avatar: "https://i.pravatar.cc/150?img=32", note: "Learning English", type: "text", preview: null, expiresAt: Date.now() + 24 * 60 * 60 * 1000 },
      { id: "3", name: "Ravi", avatar: "https://i.pravatar.cc/150?img=48", note: "At the café", type: "text", preview: null, expiresAt: Date.now() + 24 * 60 * 60 * 1000 },
      { id: "4", name: "Leah", avatar: "https://i.pravatar.cc/150?img=51", note: "Coffee break", type: "text", preview: null, expiresAt: Date.now() + 24 * 60 * 60 * 1000 },
    ];

    const savedStatuses = localStorage.getItem("callify-status-highlights");

    if (savedStatuses) {
      try {
        const parsedStatuses = JSON.parse(savedStatuses);
        return parsedStatuses.length ? parsedStatuses : buildDefaultStatuses();
      } catch {
        return buildDefaultStatuses();
      }
    }

    return buildDefaultStatuses();
  });
  const searchQuery = searchParams.get("q") || "";

  const { data: friends = [], isLoading: loadingFriends } = useQuery({
    queryKey: ["friends"],
    queryFn: getUserFriends,
  });

  const { data: recommendedUsers = [], isLoading: loadingUsers } = useQuery({
    queryKey: ["users"],
    queryFn: getRecommendedUsers,
  });

  const { data: outgoingFriendReqs } = useQuery({
    queryKey: ["outgoingFriendReqs"],
    queryFn: getOutgoingFriendReqs,
  });

  const { mutate: sendRequestMutation, isPending } = useMutation({
    mutationFn: sendFriendRequest,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["outgoingFriendReqs"] }),
  });

  const outgoingRequestsIds = useMemo(
    () => new Set((outgoingFriendReqs || []).map((req) => req.recipient._id)),
    [outgoingFriendReqs]
  );

  useEffect(() => {
    const activeStatuses = statusHighlights.filter((status) => !status.expiresAt || status.expiresAt > Date.now());
    localStorage.setItem("callify-status-highlights", JSON.stringify(activeStatuses));
  }, [statusHighlights]);

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredFriends = useMemo(() => {
    if (!normalizedQuery) return friends;

    return friends.filter((friend) => {
      const haystack = `${friend.fullName || ""} ${friend.bio || ""} ${friend.nativeLanguage || ""} ${friend.learningLanguage || ""}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [friends, normalizedQuery]);

  const filteredRecommendedUsers = useMemo(() => {
    if (!normalizedQuery) return recommendedUsers;

    return recommendedUsers.filter((user) => {
      const haystack = `${user.fullName || ""} ${user.bio || ""} ${user.nativeLanguage || ""} ${user.learningLanguage || ""} ${user.location || ""}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [recommendedUsers, normalizedQuery]);

  const showFriendsSection = activeFilter === "all" || activeFilter === "friends";
  const showLearnersSection = activeFilter === "all" || activeFilter === "learners";

  const fileToDataUrl = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error("Unable to read file"));
      reader.readAsDataURL(file);
    });

  const handleAddStatus = async (mediaFile = null) => {
    const trimmedStatus = statusDraft.trim();
    const hasMedia = Boolean(mediaFile);

    if (!trimmedStatus && !hasMedia) return;

    const contentLabel = hasMedia
      ? mediaFile.type.startsWith("video/")
        ? "Video status"
        : "Photo status"
      : trimmedStatus.length > 24
        ? `${trimmedStatus.slice(0, 24)}...`
        : trimmedStatus;

    const preview = hasMedia ? await fileToDataUrl(mediaFile) : null;

    const newStatus = {
      id: Date.now().toString(),
      name: authUser?.fullName || "Your status",
      avatar: authUser?.profilePic || "https://i.pravatar.cc/150?img=12",
      note: contentLabel,
      type: hasMedia ? (mediaFile.type.startsWith("video/") ? "video" : "image") : "text",
      preview,
      expiresAt: Date.now() + 24 * 60 * 60 * 1000,
    };

    setStatusHighlights((prev) => [newStatus, ...prev.filter((status) => !(status.name === newStatus.name && status.note === "Just now" && status.type === "text"))]);
    setStatusDraft("");
    setShowStatusComposer(false);
  };

  const handleDeleteStatus = (statusId) => {
    setStatusHighlights((prev) => prev.filter((status) => status.id !== statusId));
    setSelectedStatus(null);
  };

  const handleStatusMediaSelect = async (event, mediaType) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (mediaType === "image" && !file.type.startsWith("image/")) return;
    if (mediaType === "video" && !file.type.startsWith("video/")) return;

    await handleAddStatus(file);
    event.target.value = "";
  };

  const presenceMap = useMemo(() => {
    const map = {};

    friends.forEach((friend, index) => {
      const cycle = index % 3;
      map[friend._id] =
        cycle === 0
          ? { label: "Active now", tone: "bg-success" }
          : cycle === 1
            ? { label: "Typing…", tone: "bg-warning" }
            : { label: "Away", tone: "bg-base-400" };
    });

    return map;
  }, [friends]);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="container mx-auto space-y-8 sm:space-y-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Chats</h2>
            <p className="opacity-70">Your conversations and contacts in one place</p>
          </div>
          <Link to="/notifications" className="btn btn-outline btn-sm">
            <UsersIcon className="mr-2 size-4" />
            Friend Requests
          </Link>
        </div>

        <section className="rounded-2xl border border-base-300 bg-base-200/70 p-4">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-primary/80">Status</p>
              <h3 className="mt-1 text-lg font-semibold">Updates</h3>
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-xs"
              onClick={() => setShowStatusComposer((prev) => !prev)}
            >
              {showStatusComposer ? "Close" : "+ Add"}
            </button>
          </div>

          {showStatusComposer && (
            <div className="mb-4 rounded-2xl border border-base-300 bg-base-100 p-3">
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  value={statusDraft}
                  onChange={(event) => setStatusDraft(event.target.value)}
                  placeholder="Write your status update"
                  className="input input-sm flex-1"
                  maxLength={80}
                />
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => photoInputRef.current?.click()}
                  >
                    Photo
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => videoInputRef.current?.click()}
                  >
                    Video
                  </button>
                  <button type="button" onClick={() => handleAddStatus()} className="btn btn-primary btn-sm">
                    <PencilIcon className="mr-1 size-3.5" />
                    Save
                  </button>
                </div>
              </div>

              <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={(event) => handleStatusMediaSelect(event, "image")} />
              <input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={(event) => handleStatusMediaSelect(event, "video")} />
            </div>
          )}

          <div className="flex gap-3 overflow-x-auto pb-1">
            {statusHighlights.map((status) => (
              <button
                key={status.id}
                type="button"
                className="flex min-w-[92px] flex-col items-center gap-2 rounded-xl border border-transparent bg-transparent p-1 text-center transition hover:border-primary/20"
                onClick={() => setSelectedStatus(status)}
              >
                <div className={`avatar size-14 overflow-hidden rounded-full ring-2 ring-offset-2 ring-offset-base-200 ${status.name === "Your status" ? "ring-primary/60 shadow-[0_0_0_4px_rgba(59,130,246,0.18)] animate-pulse" : "ring-primary/30"}`}>
                  {status.preview ? (
                    status.type === "video" ? (
                      <video src={status.preview} className="h-full w-full object-cover" muted playsInline />
                    ) : (
                      <img src={status.preview} alt={status.name} className="h-full w-full object-cover" />
                    )
                  ) : (
                    <img src={status.avatar} alt={status.name} className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs font-medium leading-none">{status.name}</p>
                  <p className="text-[10px] opacity-60">{status.note}</p>
                </div>
              </button>
            ))}
          </div>
        </section>

        {selectedStatus && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
            <div className="relative flex h-[80vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-base-100 shadow-2xl">
              <button
                type="button"
                onClick={() => setSelectedStatus(null)}
                className="absolute right-4 top-4 z-10 btn btn-circle btn-sm bg-base-100/80 text-base-content border-none"
              >
                ✕
              </button>

              <div className="flex items-center justify-between border-b border-base-300 bg-base-200 px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="avatar size-10 rounded-full">
                    <img src={selectedStatus.avatar} alt={selectedStatus.name} />
                  </div>
                  <div>
                    <p className="font-semibold">{selectedStatus.name}</p>
                    <p className="text-xs opacity-60">{selectedStatus.note}</p>
                  </div>
                </div>

                <button
                  type="button"
                  className="btn btn-sm btn-outline btn-error"
                  onClick={() => handleDeleteStatus(selectedStatus.id)}
                >
                  Delete
                </button>
              </div>

              <div className="flex flex-1 items-center justify-center bg-base-200">
                {selectedStatus.type === "text" ? (
                  <div className="px-6 text-center">
                    <p className="text-3xl font-semibold leading-relaxed">{selectedStatus.note}</p>
                  </div>
                ) : selectedStatus.type === "video" ? (
                  <video src={selectedStatus.preview} className="h-full w-full object-cover" controls autoPlay />
                ) : (
                  <img src={selectedStatus.preview || selectedStatus.avatar} alt={selectedStatus.name} className="h-full w-full object-cover" />
                )}
              </div>
            </div>
          </div>
        )}

        <section className="rounded-2xl border border-base-300 bg-base-200/70 p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex-1">
              <label className="input input-bordered flex items-center gap-2 bg-base-100/80">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-4 opacity-60">
                  <path d="M10.5 3a7.5 7.5 0 1 1 0 15 7.5 7.5 0 0 1 0-15Zm0 0a7.5 7.5 0 0 1 7.5 7.5h-1.5A6 6 0 0 0 10.5 4.5Zm0 0v1.5A6 6 0 0 0 4.5 10.5H3A7.5 7.5 0 0 1 10.5 3Zm0 0a7.5 7.5 0 0 1 7.5 7.5h-1.5A6 6 0 0 0 10.5 4.5Zm0 0v1.5A6 6 0 0 0 4.5 10.5H3A7.5 7.5 0 0 1 10.5 3Z" />
                </svg>
                <input
                  value={searchQuery}
                  onChange={(event) => {
                    const nextValue = event.target.value.trimStart();
                    setSearchParams(nextValue ? { q: nextValue } : {});
                  }}
                  placeholder="Search contacts or learners"
                  className="grow border-none bg-transparent outline-none"
                />
                {searchQuery ? (
                  <button type="button" className="btn btn-ghost btn-xs" onClick={() => setSearchParams({})}>
                    ✕
                  </button>
                ) : null}
              </label>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { id: "all", label: "All" },
                { id: "friends", label: "Friends" },
                { id: "learners", label: "Learners" },
              ].map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  className={`btn btn-sm ${activeFilter === filter.id ? "btn-primary" : "btn-ghost"}`}
                  onClick={() => setActiveFilter(filter.id)}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between text-sm opacity-70">
            <span>{filteredFriends.length} contacts • {filteredRecommendedUsers.length} learners</span>
            <span>{searchQuery ? "Filtered results" : "Quick access"}</span>
          </div>

          <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
            {filteredFriends.slice(0, 6).map((friend, index) => {
              const presence = presenceMap[friend._id] || { label: "Offline", tone: "bg-base-400" };

              return (
                <div key={friend._id} className="flex min-w-[76px] flex-col items-center gap-2">
                  <div className={`avatar size-12 rounded-full ring-2 ${index % 2 === 0 ? "ring-primary/40" : "ring-success/40"}`}>
                    <img src={friend.profilePic} alt={friend.fullName} />
                    <span className={`absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-base-100 ${presence.tone}`} />
                  </div>
                  <span className="w-full truncate text-center text-xs">{friend.fullName}</span>
                  <span className="text-[10px] opacity-60">{presence.label}</span>
                </div>
              );
            })}
          </div>
        </section>

        {loadingFriends ? (
          <div className="flex justify-center py-12">
            <span className="loading loading-spinner loading-lg" />
          </div>
        ) : friends.length === 0 ? (
          <NoFriendsFound />
        ) : showFriendsSection ? (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Pinned Chats</h3>
              <span className="text-xs opacity-60">Recent • Unread</span>
            </div>
            {filteredFriends.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-base-300 bg-base-100/70 p-5 text-center text-sm opacity-70">
                No matching contacts found.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {filteredFriends.slice(0, 6).map((friend, index) => (
                  <Link
                    key={friend._id}
                    to={`/chat/${friend._id}`}
                    className={`flex items-center justify-between rounded-2xl border px-4 py-3 transition hover:bg-base-200 ${index % 2 === 0 ? "border-primary/20 bg-primary/5" : "border-base-300 bg-base-100"}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="avatar size-12 rounded-full ring-2 ring-primary/20">
                        <img src={friend.profilePic} alt={friend.fullName} />
                      </div>
                      <div>
                        <p className="font-semibold">{friend.fullName}</p>
                        <p className="text-sm opacity-70">Last message • {index % 2 === 0 ? "new" : "seen"}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs opacity-60">10:30</p>
                      <div className={`mt-2 inline-flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-xs font-semibold ${index % 2 === 0 ? "bg-primary text-primary-content" : "bg-base-300 text-base-content"}`}>
                        {index % 2 === 0 ? "2" : ""}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        ) : null}

        {showLearnersSection ? (
        <section>
          <div className="mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Meet New Learners</h2>
                <p className="opacity-70">
                  Discover perfect language exchange partners based on your profile
                </p>
              </div>
            </div>
          </div>

          {loadingUsers ? (
            <div className="flex justify-center py-12">
              <span className="loading loading-spinner loading-lg" />
            </div>
          ) : recommendedUsers.length === 0 ? (
            <div className="card bg-base-200 p-6 text-center">
              <h3 className="font-semibold text-lg mb-2">No recommendations available</h3>
              <p className="text-base-content opacity-70">
                Check back later for new language partners!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRecommendedUsers.map((user) => {
                const hasRequestBeenSent = outgoingRequestsIds.has(user._id);

                return (
                  <div
                    key={user._id}
                    className="card bg-base-200 hover:shadow-lg transition-all duration-300"
                  >
                    <div className="card-body p-5 space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="avatar size-16 rounded-full">
                          <img src={user.profilePic} alt={user.fullName} />
                        </div>

                        <div>
                          <h3 className="font-semibold text-lg">{user.fullName}</h3>
                          {user.location && (
                            <div className="flex items-center text-xs opacity-70 mt-1">
                              <MapPinIcon className="size-3 mr-1" />
                              {user.location}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Languages with flags */}
                      <div className="flex flex-wrap gap-1.5">
                        <span className="badge badge-secondary">
                          {getLanguageFlag(user.nativeLanguage)}
                          Native: {capitialize(user.nativeLanguage)}
                        </span>
                        <span className="badge badge-outline">
                          {getLanguageFlag(user.learningLanguage)}
                          Learning: {capitialize(user.learningLanguage)}
                        </span>
                      </div>

                      {user.bio && <p className="text-sm opacity-70">{user.bio}</p>}

                      {/* Action button */}
                      <button
                        className={`btn w-full mt-2 ${
                          hasRequestBeenSent ? "btn-disabled" : "btn-primary"
                        } `}
                        onClick={() => sendRequestMutation(user._id)}
                        disabled={hasRequestBeenSent || isPending}
                      >
                        {hasRequestBeenSent ? (
                          <>
                            <CheckCircleIcon className="size-4 mr-2" />
                            Request Sent
                          </>
                        ) : (
                          <>
                            <UserPlusIcon className="size-4 mr-2" />
                            Send Friend Request
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
        ) : null}
      </div>
    </div>
  );
};

export default HomePage;