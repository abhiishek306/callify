import Sidebar from "./Siderbar";
import Navbar from "./Navbar";

const Layout = ({ children, showSidebar = false }) => {
  return (
    <div className="min-h-screen bg-base-100">
      <div className="flex min-h-screen">
        {showSidebar && <Sidebar />}

        <div className="flex-1 flex flex-col">
          <Navbar />
          <main className="flex-1 overflow-y-auto bg-[radial-gradient(circle_at_top,_rgba(0,0,0,0.02),_transparent_70%)]">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};
export default Layout;