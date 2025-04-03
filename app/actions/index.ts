/**
 * Server-side authentication actions.
 *
 * @function doSocialLogin
 * Authenticates the user using a social provider (e.g., Google) based on the 'action' value from form data.
 * Redirects to the homepage upon successful login.
 *
 * @function doLogout
 * Signs the user out and redirects them to the homepage.
 */
'use server'

import { signIn, signOut } from "@/lib/auth"

export async function doSocialLogin(formData: FormData) {
    const action = formData.get('action');
    if (typeof action === 'string') {
        await signIn(action, { redirectTo: "/" });
        console.log(action);
    } else {
        console.error("Invalid action value");
    }
}


export async function doLogout(){
    await signOut({ redirectTo: "/"})
}