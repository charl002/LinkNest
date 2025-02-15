import { doSocialLogin } from "@/app/actions"
import { FaGoogle } from "react-icons/fa";

const LoginForm = () => {
    return (
        <form action={doSocialLogin}>
            <button
                 className="flex items-center space-x-2 bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-md"
                type="submit" name="action" value="google"
            >
                <FaGoogle className="text-xl text-[#4285F4]"/> 
                <span className="font-medium">Sign in</span>
            </button>
        </form>
    )
}

export default LoginForm