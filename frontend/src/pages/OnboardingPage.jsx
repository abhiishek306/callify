import { useEffect, useRef, useState } from "react";
import useAuthUser from "../hooks/useAuthUser";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { completeOnboarding } from "../lib/api";
import { CameraIcon, LoaderIcon, MapPinIcon, ShipWheelIcon, ShuffleIcon, UploadIcon } from "lucide-react";
import { LANGUAGES } from "../constants";

const OnboardingPage = () => {
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

  const { mutate: onboardingMutation, isPending } = useMutation({
    mutationFn: completeOnboarding,
    onSuccess: () => {
      toast.success("Profile onboarded successfully");
      queryClient.invalidateQueries({ queryKey: ["authUser"] });
    },

    onError: (error) => {
      toast.error(error.response.data.message);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const onboardingData = new FormData();

    Object.entries(formState).forEach(([key, value]) => {
      onboardingData.append(key, value);
    });

    if (profilePicFile) {
      onboardingData.append("profilePic", profilePicFile);
    } else if (profilePicPreview) {
      onboardingData.append("profilePic", profilePicPreview);
    }

    onboardingMutation(onboardingData);
  };

  const handleRandomAvatar = () => {
    const idx = Math.floor(Math.random() * 100) + 1; // 1-100 included
    const randomAvatar = `https://avatar.iran.liara.run/public/${idx}.png`;

    if (profilePicPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(profilePicPreview);
    }

    setProfilePicFile(null);
    setProfilePicPreview(randomAvatar);
    toast.success("Random profile picture generated!");
  };

  const handleProfilePicChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (profilePicPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(profilePicPreview);
    }

    setProfilePicFile(file);
    setProfilePicPreview(URL.createObjectURL(file));
    toast.success("Profile picture selected!");
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(37,211,102,0.15),_transparent_45%)] p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-4xl overflow-hidden rounded-[28px] border border-primary/20 bg-base-100 shadow-2xl shadow-primary/10">
        <div className="p-6 sm:p-8">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold sm:text-3xl">Complete your profile</h1>
            <p className="mt-2 text-sm opacity-70">Set up your identity so your future chat partners know who you are.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div
                className="flex size-32 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-base-300 ring-2 ring-transparent transition-all hover:ring-primary"
                onClick={openFilePicker}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    openFilePicker();
                  }
                }}
              >
                {profilePicPreview ? (
                  <img src={profilePicPreview} alt="Profile Preview" className="h-full w-full object-cover" />
                ) : (
                  <CameraIcon className="size-12 text-base-content opacity-40" />
                )}
              </div>

              <div className="flex flex-col items-center gap-2 sm:flex-row">
                <label className="btn btn-outline cursor-pointer">
                  <UploadIcon className="mr-2 size-4" />
                  Upload Photo
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleProfilePicChange} />
                </label>
                <button type="button" onClick={handleRandomAvatar} className="btn btn-accent">
                  <ShuffleIcon className="mr-2 size-4" />
                  Generate Random Avatar
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="form-control">
                <span className="label-text mb-2">Full Name</span>
                <input
                  type="text"
                  name="fullName"
                  value={formState.fullName}
                  onChange={(e) => setFormState({ ...formState, fullName: e.target.value })}
                  className="input input-bordered w-full"
                  placeholder="Your full name"
                />
              </label>

              <label className="form-control">
                <span className="label-text mb-2">Location</span>
                <div className="relative">
                  <MapPinIcon className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-base-content opacity-70" />
                  <input
                    type="text"
                    name="location"
                    value={formState.location}
                    onChange={(e) => setFormState({ ...formState, location: e.target.value })}
                    className="input input-bordered w-full pl-10"
                    placeholder="City, Country"
                  />
                </div>
              </label>
            </div>

            <label className="form-control">
              <span className="label-text mb-2">Bio</span>
              <textarea
                name="bio"
                value={formState.bio}
                onChange={(e) => setFormState({ ...formState, bio: e.target.value })}
                className="textarea textarea-bordered h-24"
                placeholder="Tell others about yourself and your language learning goals"
              />
            </label>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="form-control">
                <span className="label-text mb-2">Native Language</span>
                <select
                  name="nativeLanguage"
                  value={formState.nativeLanguage}
                  onChange={(e) => setFormState({ ...formState, nativeLanguage: e.target.value })}
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
                <span className="label-text mb-2">Learning Language</span>
                <select
                  name="learningLanguage"
                  value={formState.learningLanguage}
                  onChange={(e) => setFormState({ ...formState, learningLanguage: e.target.value })}
                  className="select select-bordered w-full"
                >
                  <option value="">Select language you're learning</option>
                  {LANGUAGES.map((lang) => (
                    <option key={`learning-${lang}`} value={lang.toLowerCase()}>
                      {lang}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <button className="btn btn-primary w-full" disabled={isPending} type="submit">
              {!isPending ? (
                <>
                  <ShipWheelIcon className="mr-2 size-5" />
                  Complete Onboarding
                </>
              ) : (
                <>
                  <LoaderIcon className="mr-2 size-5 animate-spin" />
                  Onboarding...
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
export default OnboardingPage;