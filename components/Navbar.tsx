import { auth } from "@/auth";
import Image from "next/image";
import Logout from "./Logout";

const Navbar = async () => {

    const session = await auth();
    const userImage = session?.user?.image ?? "../public/defaultProfilePic.jpg";
    const userName = session?.user?.name ?? "User";

    return (
      <nav className="bg-white shadow-md py-4 px-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">LinkNest</h1>
        {session?.user && (
        <div className="flex items-center space-x-3">
          <Image
            src={userImage}
            alt="User Profile"
            width={40}
            height={40}
            className="rounded-full border border-gray-300"
          />
        <p className="text-gray-700 font-medium">{userName}</p>
        <Logout />
      </div>
        )}
      </nav>
    );
  };

  export default Navbar;