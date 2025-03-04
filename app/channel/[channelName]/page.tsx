import { Toaster } from "sonner";
import Call from "@/components/chat/Call";

type CallParams = Promise<{ channelName: string }>;

const Page = async (props: { params: CallParams }) => {
    const { channelName } = await props.params;
    const channel = channelName || "root";

    return (
        <main className="flex w-full flex-col">
            <p className="absolute z-10 mt-2 ml-12 text-2xl font-bold text-gray-900">
                {channel}
            </p>
            <Call appId={process.env.NEXT_PUBLIC_AGORA_APP_ID!} channelName={channel} />
            <Toaster position="bottom-center" richColors />
        </main>
    );
};

export default Page;
