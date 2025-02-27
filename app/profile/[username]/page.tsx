import Sidebar from "../../../components/custom-ui/Sidebar";
import ChatList from "../../../components/chat/ChatList";
import ProfilePage from "../../../components/profile/ProfilePage";

type ProfileParams = Promise<{ username: string }>

const Profile = async (props : { params: ProfileParams }) => {
    const { username } = await props.params; 
    const user = decodeURIComponent(username);

    return (
        <div className="grid grid-cols-[300px_2fr_300px] gap-6 p-6 w-full">
            <Sidebar />
            <ProfilePage user={user} />
            <ChatList />
        </div>
    );
};

export default Profile;
