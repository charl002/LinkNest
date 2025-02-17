const Profile = async ({ params }: { params: { email: string } }) => {
    const user = decodeURIComponent(params.email);

    if (!user) {
        return <div>User not found</div>;
    }

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold">{user} Profile</h1>
        </div>
    );
};

export default Profile;