import { auth } from "@/auth";
import Image from "next/image";
import { redirect } from "next/navigation";
import Logout from "@/components/Logout"

const HomePage = async () => {

    const session = await auth();


    if(!session?.user) redirect("/");


    const userImage = session?.user?.image ?? "/path/to/default/image.png"; // Provide a default image

    return(
        <>
        <div className="flex flex-col items-center m-4">
            <h1>{session?.user?.name}</h1>

            <Image
                src={userImage}
                alt={session?.user?.name || "User Image"}
                width={72}
                height={72}
                className="rounded-full" />
        </div>
        <Logout />
        </>
    )
}

export default HomePage

