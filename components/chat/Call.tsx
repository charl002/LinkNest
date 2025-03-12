"use client";

import AgoraRTC, {
  AgoraRTCProvider,
  LocalVideoTrack,
  RemoteUser,
  useJoin,
  useLocalCameraTrack,
  useLocalMicrophoneTrack,
  usePublish,
  useRTCClient,
  useRemoteAudioTracks,
  useRemoteUsers,
} from "agora-rtc-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";

const sendCallEndMessage = async (currentUsername: string, friendUsername: string) => {
  try {
    const postMessagePromise = fetch("/api/postmessage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        senderUsername: currentUsername,
        receiverUsername: friendUsername,
        message: '📞 The call has ended!',
        isCallMsg: true,
      }),
    });

    const postUnreadMessagePromise = fetch("/api/postunreadmessage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sender: currentUsername,
        receiver: friendUsername,
        count: 1, // Mark it as unread
      }),
    });

    await Promise.all([postMessagePromise, postUnreadMessagePromise]);

  } catch (error) {
    console.error("Error posting call end message:", error);
  }
};

function Call() {
  const client = useRTCClient(
    AgoraRTC.createClient({ codec: "vp8", mode: "rtc" })
  );

  const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID!;
  const searchParams = useSearchParams();
  const router = useRouter();
  const friendUsername = searchParams.get("friend") ?? "Guest";
  const currentUsername = searchParams.get("user") ?? "Guest";
  const [first, second] = [currentUsername, friendUsername].sort();
  const channelName = `${first}_${second}`;
  
  const handleLeaveCall = async () => {
    // Send the call end message
    await sendCallEndMessage(currentUsername, friendUsername);

    // Leave the call and redirect to the chat page
    router.push(`/chat?friend=${friendUsername}&user=${currentUsername}`);
  };

  return (
    <AgoraRTCProvider client={client}>
      <Videos currentUsername={currentUsername} friendUsername={friendUsername} channelName={channelName} AppID={appId} />
      <div className="fixed z-10 bottom-0 left-0 right-0 flex justify-center pb-4">
        <Link
          className="px-5 py-3 text-base font-medium text-center text-white bg-red-500 rounded-lg hover:bg-red-400"
          href='#'
          onClick={handleLeaveCall}>
          Leave Call
        </Link>
      </div>
    </AgoraRTCProvider>
  );
}

function Videos(props: {currentUsername: string; friendUsername: string; channelName: string; AppID: string }) {
  const { currentUsername, friendUsername, AppID, channelName } = props;
  const { isLoading: isLoadingMic, localMicrophoneTrack } = useLocalMicrophoneTrack();
  const { isLoading: isLoadingCam, localCameraTrack } = useLocalCameraTrack();
  const remoteUsers = useRemoteUsers();
  const { audioTracks } = useRemoteAudioTracks(remoteUsers);

  useJoin({
    appid: AppID,
    channel: channelName,
    token: null,
  });
  usePublish([localMicrophoneTrack, localCameraTrack]);

  audioTracks.map((track) => track.play());
  const deviceLoading = isLoadingMic || isLoadingCam;
  if (deviceLoading)
    return (
      <div className="flex flex-col items-center pt-40">Loading devices...</div>
    );

  return (
    <div
        className="flex flex-col justify-between w-full h-full"
        style={{ backgroundColor: 'white' }}
      >
      <div
        className={`gap-1 flex-1 w-full h-full mx-auto my-auto flex items-center justify-center`}
      >
        <div className="relative w-full h-full">
          <LocalVideoTrack
            track={localCameraTrack}
            play={true}
            className="border-4 border-green-500 rounded-sm"
          />
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 mt-2">
            <span className="text-white text-2xl font-bold bg-black bg-opacity-50 px-4 py-2 rounded-lg">
              {currentUsername}
            </span>
          </div>
        </div>
        {remoteUsers.length > 0 ? (
          remoteUsers.map((user) => (
            <div key={user.uid} className="relative w-full h-full">
              <RemoteUser
                user={user}
                className="w-full h-full border-4 border-gray-500 rounded-sm"
              />
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 mt-2">
                <span className="text-white text-2xl font-bold bg-black bg-opacity-50 px-4 py-2 rounded-lg">
                  {friendUsername}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center text-gray-500">Waiting for other users to join...</div>
        )}
      </div>
    </div>
  );
}

export default Call;