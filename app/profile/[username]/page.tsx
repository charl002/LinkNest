import Sidebar from "../../../components/Sidebar";
import ChatList from "../../../components/ChatList";
import ProfilePage from "../../../components/ProfilePage";

type ProfileParams = Promise<{ username: string }>

const Profile = async (props : { params: ProfileParams }) => {
    const { username } = await props.params; 
    const user = decodeURIComponent(username);

    return (
        <div className="grid grid-cols-[250px_1fr_250px] gap-6 p-6 w-full">
            <Sidebar />
            <ProfilePage user={user} />
            <ChatList />
        </div>
    );
};

export default Profile;
