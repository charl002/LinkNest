import CreatePost from "@/components/post/CreatePost"
import { Toaster } from "sonner"

export default function CreatePostPage() {
  return (
    <>
      <CreatePost />
      <Toaster position="bottom-center" richColors></Toaster>
    </>
  );
}