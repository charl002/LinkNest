import LoginForm from "@/components/LoginForm";

// Testing to see if Jest works
export function add(x: number, y: number) {
  return x + y;
}

export default function Home() {
  return (
    <div className="flex flex-col justify-center items-center m-4">
      <h1 className="text-3xl my-3">Sign In</h1>
      <LoginForm/>
    </div>
  );
}
