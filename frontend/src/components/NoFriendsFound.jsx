const NoFriendsFound = () => {
  return (
    <div className="rounded-[24px] border border-base-300 bg-base-200/80 p-8 text-center shadow-sm transition-all duration-300">
      <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
        <span className="text-2xl">💬</span>
      </div>
      <h3 className="mb-2 text-lg font-semibold">No friends yet</h3>
      <p className="mx-auto max-w-md text-sm opacity-70">
        Connect with language partners below to start practicing together and build your chat list.
      </p>
    </div>
  );
};

export default NoFriendsFound;