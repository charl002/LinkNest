import { Toaster } from "sonner";
import ProfilePage from "../../../components/profile/ProfilePage";

type ProfileParams = Promise<{ username: string }>

const Profile = async (props : { params: ProfileParams }) => {
    const { username } = await props.params; 
    const user = decodeURIComponent(username);

    return (
        <>
            <ProfilePage user={user} />
            <Toaster position="bottom-center" richColors></Toaster>
        </>
    );
};

export default Profile;
