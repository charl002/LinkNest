/**
 * Logout component
 *
 * Renders a logout button that triggers the `doLogout` server action when submitted.
 */
"use client";
import { signOut } from "next-auth/react";

const Logout = () => {
    return(
        <button className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-md"
            onClick={() => signOut({ callbackUrl: "/" })}
        >
            Logout
        </button>
    )
}

export default Logout