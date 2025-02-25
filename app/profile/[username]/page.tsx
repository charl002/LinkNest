import Sidebar from "../../../components/Sidebar";
import ChatList from "../../../components/ChatList";
import ProfilePage from "../../../components/ProfilePage";
import { Toaster } from "sonner";

type ProfileParams = Promise<{ username: string }>

const Profile = async (props : { params: ProfileParams }) => {
    const { username } = await props.params; 
    const user = decodeURIComponent(username);

    return (
        <div className="grid grid-cols-[300px_2fr_300px] gap-6 p-6 w-full">
            <Sidebar />
            <ProfilePage user={user} />
            <ChatList />
            <Toaster position="bottom-center" richColors></Toaster>
        </div>
    );
};

export default Profile;
