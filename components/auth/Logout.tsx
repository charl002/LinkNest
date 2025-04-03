/**
 * Logout component
 *
 * Renders a logout button that triggers the `doLogout` server action when submitted.
 */
"use client";
import { doLogout } from "@/app/actions"

const Logout = () => {
    return(
        <form action={doLogout}>
            <button className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-md" type="submit">
                Logout
            </button>
        </form>
    )
}

export default Logout