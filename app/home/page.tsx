import { auth } from "@/auth";
import { redirect } from "next/navigation";
import UserCheck from "../../components/auth/UserCheck";

export default async function Home() {
    const session = await auth();

    if (!session?.user) redirect("/");

    return (
        <UserCheck />
    );
}