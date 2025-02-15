import Post from "@/components/Post";

export default function Home() {
  return (
    <div className="flex flex-col items-center gap-6 p-6 w-full">
      <section className="flex flex-col space-y-6 max-w-2xl w-full">
        <Post />
        <Post />
        <Post />
      </section>
    </div>
  );
}