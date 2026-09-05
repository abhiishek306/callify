import { useEffect, useState } from "react";
import { useParams } from "react-router";
import useAuthUser from "../hooks/useAuthUser";
import { useQuery } from "@tanstack/react-query";
import { getStreamToken, getUserFriends } from "../lib/api";

import {
  Channel,
  Chat,
  MessageList,
  Thread,
  Window,
} from "stream-chat-react";
import { StreamChat } from "stream-chat";
import toast from "react-hot-toast";

import ChatLoader from "../components/ChatLoader";
import CallButton from "../components/CallButton";
import { useSocket } from "../hooks/useSocket";

const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY;

const ChatPage = () => {
  const { id: targetUserId } = useParams();

  const [chatClient, setChatClient] = useState(null);
  const [channel, setChannel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [typingUsers, setTypingUsers] = useState([]);
  const [draftMessage, setDraftMessage] = useState("");
  const [showQuickActions, setShowQuickActions] = useState(true);
  const [draftSaved, setDraftSaved] = useState(false);
  const [deliveryState, setDeliveryState] = useState("Read");

  const quickReplies = ["Hey!", "How are you?", "Let’s practice!", "See you soon!"];
  const reactionChoices = ["👍", "❤️", "😂", "🎉", "🔥"];

  const { authUser } = useAuthUser();
  const socketRef = useSocket();

  const { data: tokenData } = useQuery({
    queryKey: ["streamToken"],
    queryFn: getStreamToken,
    enabled: !!authUser,
  });

  const { data: friendsData = [] } = useQuery({
    queryKey: ["userFriends"],
    queryFn: getUserFriends,
    enabled: !!authUser,
  });

  useEffect(() => {
    if (!targetUserId) return;

    const savedDraft = window.localStorage.getItem(`chat-draft-${targetUserId}`);
    if (savedDraft) {
      setDraftMessage(savedDraft);
      setDraftSaved(true);
    } else {
      setDraftMessage("");
      setDraftSaved(false);
    }
  }, [targetUserId]);

  useEffect(() => {
    if (!targetUserId) return;

    if (draftMessage.trim()) {
      window.localStorage.setItem(`chat-draft-${targetUserId}`, draftMessage);
      setDraftSaved(true);
    } else {
      window.localStorage.removeItem(`chat-draft-${targetUserId}`);
      setDraftSaved(false);
    }
  }, [draftMessage, targetUserId]);

  useEffect(() => {
    const initChat = async () => {
      if (!tokenData?.token || !authUser) return;

      try {
        console.log("Initializing stream chat client...");

        const client = StreamChat.getInstance(STREAM_API_KEY);

        await client.connectUser(
          {
            id: authUser._id,
            name: authUser.fullName,
            image: authUser.profilePic,
          },
          tokenData.token
        );

        //
        const channelId = [authUser._id, targetUserId].sort().join("-");

        // you and me
        // if i start the chat => channelId: [myId, yourId]
        // if you start the chat => channelId: [yourId, myId]  => [myId,yourId]

        const currChannel = client.channel("messaging", channelId, {
          members: [authUser._id, targetUserId],
        });

        await currChannel.watch();

        setChatClient(client);
        setChannel(currChannel);

        const roomId = currChannel.id;
        socketRef.current?.emit("join-room", { roomId, userId: authUser._id });
      } catch (error) {
        console.error("Error initializing chat:", error);
        toast.error("Could not connect to chat. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    initChat();
  }, [tokenData, authUser, targetUserId]);

  useEffect(() => {
    if (!socketRef.current || !channel || !authUser) return;

    const socket = socketRef.current;

    socket.on("receive-message", ({ roomId, userId, message }) => {
      if (roomId === channel.id && userId !== authUser._id) {
        channel.sendMessage({
          text: message,
          user_id: userId,
        });
      }
    });

    socket.on("typing-update", ({ roomId, userId, isTyping }) => {
      if (roomId === channel.id && userId !== authUser._id) {
        setTypingUsers((prev) => {
          if (isTyping) {
            return prev.includes(userId) ? prev : [...prev, userId];
          }
          return prev.filter((id) => id !== userId);
        });
      }
    });

    return () => {
      socket.off("receive-message");
      socket.off("typing-update");
    };
  }, [channel, authUser, socketRef]);

  const sendTextMessage = (text) => {
    const message = text.trim();

    if (!message || !channel || !authUser) return;

    channel.sendMessage({
      text: message,
      user_id: authUser._id,
    });

    socketRef.current?.emit("send-message", {
      roomId: channel.id,
      userId: authUser._id,
      message,
    });

    setDraftMessage("");
    setShowQuickActions(true);
    setDraftSaved(false);
    setDeliveryState("Delivered");
    window.localStorage.removeItem(`chat-draft-${targetUserId}`);
  };

  const handleQuickReaction = (emoji) => {
    const reaction = `${emoji} ${draftMessage || "Thanks!"}`.trim();
    sendTextMessage(reaction);
    toast.success(`Reaction sent: ${emoji}`);
  };

  const handleVoiceNote = () => {
    const voiceNoteText = "🎙️ Voice note • 0:42";
    sendTextMessage(voiceNoteText);
    toast.success("Voice note sent");
  };

  const handleVideoCall = () => {
    if (channel) {
      const callUrl = `${window.location.origin}/call/${channel.id}`;
      const message = `I've started a video call. Join me here: ${callUrl}`;

      sendTextMessage(message);
      toast.success("Video call link sent successfully!");
    }
  };

  const handleTyping = (isTyping) => {
    if (!channel || !authUser) return;
    socketRef.current?.emit("typing", {
      roomId: channel.id,
      userId: authUser._id,
      isTyping,
    });
  };

  const handleSendMessage = (event) => {
    event?.preventDefault();
    sendTextMessage(draftMessage);
  };

  const handleAttachmentSelect = (event) => {
    const file = event.target.files?.[0];
    if (!file || !channel || !authUser) return;

    const attachmentText = `📎 Attachment: ${file.name}`;

    channel.sendMessage({
      text: attachmentText,
      user_id: authUser._id,
    });

    socketRef.current?.emit("send-message", {
      roomId: channel.id,
      userId: authUser._id,
      message: attachmentText,
    });

    event.target.value = "";
  };

  const targetUser = friendsData.find((friend) => friend._id === targetUserId);
  const displayName = targetUser?.fullName || targetUserId;
  const displayAvatar = targetUser?.profilePic || "https://i.pravatar.cc/150?img=3";

  if (loading || !chatClient || !channel) return <ChatLoader />;

  return (
    <div className="h-[93vh] bg-base-100">
      <Chat client={chatClient}>
        <Channel channel={channel}>
          <div className="w-full h-full flex flex-col">
            <div className="border-b border-base-300 bg-base-200 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="avatar size-10 rounded-full ring-2 ring-primary/20">
                  <img src={displayAvatar} alt={displayName} />
                </div>
                <div>
                  <h3 className="font-semibold">{displayName}</h3>
                  <div className="flex items-center gap-2 text-xs opacity-70">
                    <span className="h-2.5 w-2.5 rounded-full bg-success" />
                    <span>Online</span>
                    <span>•</span>
                    <span>{deliveryState}</span>
                  </div>
                </div>
              </div>
              <CallButton handleVideoCall={handleVideoCall} disabled={!channel} />
            </div>
            <div className="flex-1 min-h-0 bg-[radial-gradient(circle_at_top,_rgba(0,0,0,0.02),_transparent_60%)]">
              <Window>
                {typingUsers.length > 0 && (
                  <div className="mx-4 mt-3 rounded-full border border-base-300 bg-base-100/90 px-3 py-2 text-sm text-base-content/70 shadow-sm">
                    {typingUsers.join(", ")} is typing...
                  </div>
                )}
                <div className="flex-1 overflow-y-auto px-3 py-2">
                  <div className="mb-3 flex justify-center">
                    <div className="rounded-full border border-base-300 bg-base-100/90 px-3 py-1 text-xs font-medium text-base-content/70 shadow-sm">
                      Today • 2 new messages
                    </div>
                  </div>
                  <MessageList />
                </div>
                <div className="border-t border-base-300 bg-base-100/95 px-3 py-3 shadow-[0_-4px_10px_rgba(0,0,0,0.04)]">
                  {showQuickActions && (
                    <div className="mb-2 flex flex-wrap gap-2">
                      {reactionChoices.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          className="rounded-full border border-base-300 bg-base-100 px-2 py-1 text-sm transition hover:bg-base-200"
                          onClick={() => handleQuickReaction(emoji)}
                        >
                          {emoji}
                        </button>
                      ))}
                      {quickReplies.map((reply) => (
                        <button
                          key={reply}
                          type="button"
                          className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-sm font-medium text-primary transition hover:bg-primary/20"
                          onClick={() => sendTextMessage(reply)}
                        >
                          {reply}
                        </button>
                      ))}
                      <button
                        type="button"
                        className="rounded-full border border-base-300 bg-base-100 px-2.5 py-1 text-sm transition hover:bg-base-200"
                        onClick={() => setShowQuickActions(false)}
                      >
                        +
                      </button>
                    </div>
                  )}
                  <form onSubmit={handleSendMessage} className="flex items-center gap-2 rounded-full border border-base-300 bg-white px-3 py-2 shadow-sm">
                    <button
                      type="button"
                      className="rounded-full bg-base-200 px-2.5 py-2 text-sm transition hover:bg-base-300"
                      onClick={() => setShowQuickActions((prev) => !prev)}
                    >
                      {showQuickActions ? '✕' : '⋯'}
                    </button>
                    <textarea
                      value={draftMessage}
                      onChange={(event) => {
                        setDraftMessage(event.target.value);
                        if (!event.target.value.trim()) {
                          handleTyping(false);
                        }
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" && !event.shiftKey) {
                          event.preventDefault();
                          handleSendMessage(event);
                        }
                      }}
                      onFocus={() => handleTyping(true)}
                      onBlur={() => handleTyping(false)}
                      rows={1}
                      placeholder="Type a message"
                      className="flex-1 resize-none border-none bg-transparent text-sm outline-none"
                    />
                    <button
                      type="button"
                      className="rounded-full bg-base-200 px-2.5 py-2 text-sm transition hover:bg-base-300"
                      onClick={handleVoiceNote}
                      title="Send voice note"
                    >
                      🎤
                    </button>
                    <label className="cursor-pointer rounded-full bg-base-200 px-2.5 py-2 text-sm transition hover:bg-base-300">
                      📎
                      <input type="file" className="hidden" onChange={handleAttachmentSelect} />
                    </label>
                    <button
                      type="submit"
                      className="rounded-full bg-primary px-3 py-2 text-sm font-semibold text-primary-content transition hover:opacity-90"
                    >
                      Send
                    </button>
                  </form>
                  <div className="mt-2 flex items-center justify-between px-1 text-xs text-base-content/60">
                    <span>{draftSaved ? "Draft saved locally" : "No unsent draft"}</span>
                    <span>Auto-save enabled</span>
                  </div>
                </div>
              </Window>
            </div>
          </div>
          <Thread />
        </Channel>
      </Chat>
    </div>
  );
};
export default ChatPage;