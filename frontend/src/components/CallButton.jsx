import { VideoIcon } from "lucide-react";

function CallButton({ handleVideoCall, disabled = false }) {
  return (
    <div className="w-full border-b bg-base-100 px-3 py-2 flex items-center justify-end z-10">
      <button
        type="button"
        onClick={handleVideoCall}
        disabled={disabled}
        className="btn btn-success btn-sm text-white gap-2"
        title="Start video call"
      >
        <VideoIcon className="size-5" />
        <span>Video</span>
      </button>
    </div>
  );
}

export default CallButton;