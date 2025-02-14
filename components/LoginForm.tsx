import { doSocialLogin } from "@/app/actions"

const LoginForm = () => {
    return (
        <form action={doSocialLogin}>
            <button
                className="bg-black text-white p-1 rounded-md m-1 text-1g"
                type="submit" name="action" value="google">
                Sign In With Google
            </button>
        </form>
    )
}

export default LoginForm