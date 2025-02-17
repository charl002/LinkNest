import Sidebar from "../../../components/Sidebar";
import ChatList from "../../../components/ChatList";
import ProfilePage from "../../../components/ProfilePage";

interface ProfileProps {
    params: { email: string };
}

const Profile = ({ params }: ProfileProps) => {

    const user = decodeURIComponent(params.email);

    return (
        <div className="grid grid-cols-[250px_1fr_250px] gap-6 p-6 w-full">
            <Sidebar />
            <ProfilePage user={user} />
            <ChatList />
        </div>
    );
};

export default Profile;