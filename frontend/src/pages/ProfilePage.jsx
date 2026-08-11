import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { CameraIcon, LoaderIcon, MapPinIcon, PencilLineIcon, ShuffleIcon, UploadIcon } from "lucide-react";

import useAuthUser from "../hooks/useAuthUser";
import { updateUserProfile } from "../lib/api";
import { LANGUAGES } from "../constants";

const ProfilePage = () => {
  const { authUser } = useAuthUser();
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);

  const [formState, setFormState] = useState({
    fullName: authUser?.fullName || "",
    bio: authUser?.bio || "",
    nativeLanguage: authUser?.nativeLanguage || "",
    learningLanguage: authUser?.learningLanguage || "",
    location: authUser?.location || "",
  });
  const [profilePicPreview, setProfilePicPreview] = useState(authUser?.profilePic || "");
  const [profilePicFile, setProfilePicFile] = useState(null);

  useEffect(() => {
    setFormState({
      fullName: authUser?.fullName || "",
      bio: authUser?.bio || "",
      nativeLanguage: authUser?.nativeLanguage || "",
      learningLanguage: authUser?.learningLanguage || "",
      location: authUser?.location || "",
    });
    setProfilePicPreview(authUser?.profilePic || "");
    setProfilePicFile(null);
  }, [authUser]);

  useEffect(() => {
    return () => {
      if (profilePicPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(profilePicPreview);
      }
    };
  }, [profilePicPreview]);

  const { mutate: saveProfile, isPending } = useMutation({
    mutationFn: updateUserProfile,
    onSuccess: () => {
      toast.success("Profile updated successfully");
      queryClient.invalidateQueries({ queryKey: ["authUser"] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Could not update your profile");
    },
  });

  const handleSubmit = (event) => {
    event.preventDefault();

    const formData = new FormData();

    Object.entries(formState).forEach(([key, value]) => {
      if (value) formData.append(key, value);
    });

    if (profilePicFile) {
      formData.append("profilePic", profilePicFile);
    } else if (profilePicPreview) {
      formData.append("profilePic", profilePicPreview);
    }

    saveProfile(formData);
  };

  const handleRandomAvatar = () => {
    const idx = Math.floor(Math.random() * 100) + 1;
    const randomAvatar = `https://avatar.iran.liara.run/public/${idx}.png`;

    if (profilePicPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(profilePicPreview);
    }

    setProfilePicFile(null);
    setProfilePicPreview(randomAvatar);
    toast.success("New profile picture generated");
  };

  const handleProfilePicChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (profilePicPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(profilePicPreview);
    }

    setProfilePicFile(file);
    setProfilePicPreview(URL.createObjectURL(file));
    toast.success("Profile photo selected");
  };

  const openFilePicker = () => fileInputRef.current?.click();

  return (
    <div className="min-h-screen bg-base-100 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="overflow-hidden rounded-[28px] border border-base-300 bg-base-200/70 shadow-xl shadow-primary/5">
          <div className="border-b border-base-300 bg-[radial-gradient(circle_at_top,_rgba(37,211,102,0.18),_transparent_48%)] p-6 sm:p-8">
            <div className="flex flex-col items-center text-center">
              <div
                className="group relative flex size-28 cursor-pointer items-center justify-center overflow-hidden rounded-full ring-4 ring-base-100 shadow-lg shadow-primary/10 transition hover:scale-[1.02]"
                onClick={openFilePicker}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    openFilePicker();
                  }
                }}
              >
                {profilePicPreview ? (
                  <img src={profilePicPreview} alt="Profile preview" className="h-full w-full object-cover" />
                ) : (
                  <CameraIcon className="size-10 text-base-content opacity-50" />
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition group-hover:opacity-100">
                  <CameraIcon className="size-6 text-white" />
                </div>
              </div>

              <h1 className="mt-5 text-2xl font-bold sm:text-3xl">{authUser?.fullName || "Your profile"}</h1>
              <p className="mt-2 max-w-xl text-sm opacity-70">
                {authUser?.bio || "Add a short bio so people know your vibe and learning goals."}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 p-6 sm:p-8">
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <label className="btn btn-outline cursor-pointer">
                <UploadIcon className="mr-2 size-4" />
                Upload photo
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleProfilePicChange} />
              </label>

              <button type="button" onClick={handleRandomAvatar} className="btn btn-accent">
                <ShuffleIcon className="mr-2 size-4" />
                Random avatar
              </button>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <label className="form-control">
                <span className="label-text mb-2 font-medium">Display name</span>
                <input
                  type="text"
                  value={formState.fullName}
                  onChange={(event) => setFormState({ ...formState, fullName: event.target.value })}
                  className="input input-bordered w-full"
                  placeholder="Your name"
                />
              </label>

              <label className="form-control">
                <span className="label-text mb-2 font-medium">Location</span>
                <div className="relative">
                  <MapPinIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-base-content opacity-70" />
                  <input
                    type="text"
                    value={formState.location}
                    onChange={(event) => setFormState({ ...formState, location: event.target.value })}
                    className="input input-bordered w-full pl-10"
                    placeholder="City, country"
                  />
                </div>
              </label>
            </div>

            <label className="form-control">
              <span className="label-text mb-2 font-medium">Bio</span>
              <textarea
                value={formState.bio}
                onChange={(event) => setFormState({ ...formState, bio: event.target.value })}
                className="textarea textarea-bordered h-28"
                placeholder="Tell people what you’re learning and what you enjoy talking about"
              />
            </label>

            <div className="grid gap-5 md:grid-cols-2">
              <label className="form-control">
                <span className="label-text mb-2 font-medium">Native language</span>
                <select
                  value={formState.nativeLanguage}
                  onChange={(event) => setFormState({ ...formState, nativeLanguage: event.target.value })}
                  className="select select-bordered w-full"
                >
                  <option value="">Select your native language</option>
                  {LANGUAGES.map((lang) => (
                    <option key={`native-${lang}`} value={lang.toLowerCase()}>
                      {lang}
                    </option>
                  ))}
                </select>
              </label>

              <label className="form-control">
                <span className="label-text mb-2 font-medium">Learning language</span>
                <select
                  value={formState.learningLanguage}
                  onChange={(event) => setFormState({ ...formState, learningLanguage: event.target.value })}
                  className="select select-bordered w-full"
                >
                  <option value="">Select a language you’re learning</option>
                  {LANGUAGES.map((lang) => (
                    <option key={`learning-${lang}`} value={lang.toLowerCase()}>
                      {lang}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="flex justify-end pt-2">
              <button type="submit" className="btn btn-primary min-w-[220px]" disabled={isPending}>
                {!isPending ? (
                  <>
                    <PencilLineIcon className="mr-2 size-4" />
                    Save changes
                  </>
                ) : (
                  <>
                    <LoaderIcon className="mr-2 size-4 animate-spin" />
                    Saving...
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
