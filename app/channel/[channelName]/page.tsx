import Call from "@/components/chat/Call";

export default function Page({ params }: { params: { channel: string } }) {
    const channelName = params.channel || "root";

    return (
        <main className="flex w-full flex-col">
            <p className="absolute z-10 mt-2 ml-12 text-2xl font-bold text-gray-900">
                {channelName}
            </p>
            <Call appId={process.env.NEXT_PUBLIC_AGORA_APP_ID!} channelName={channelName} />
        </main>
    );
}
