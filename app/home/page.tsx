import Sidebar from "../components/Sidebar";
import Post from "../components/Post";
import ChatList from "../components/ChatList";

export default function Home() {
  return (
    <div className="grid grid-cols-[250px_1fr_250px] gap-6 p-6 w-full">
      <Sidebar />

      <section className="flex flex-col space-y-6">
        <Post />
        <Post />
        <Post />
      </section>

      <ChatList />
    </div>
  );
}