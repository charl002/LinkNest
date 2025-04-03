"use client";

import { emitPrivateMessage, postMessageAndUnread } from "@/utils/messageUtils";
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
import { useSocket } from "../provider/SocketProvider";
import LoadingLogo from "../custom-ui/LoadingLogo";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { customToast } from "@/components/ui/customToast";
import { useGroupChats } from "../provider/GroupChatsProvider";
import { GroupChat } from "@/types/group";



function Call() {
  const client = useRTCClient(
    AgoraRTC.createClient({ codec: "vp8", mode: "rtc" })
  );

  const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID!;
  const searchParams = useSearchParams();
  const router = useRouter();
  const friend = searchParams.get("friend") ?? "Guest";
  const friendUsername = decodeURIComponent(friend);
  const current = searchParams.get("user") ?? "Guest";
  const groupchatId = searchParams.get("group");
  const currentUsername = decodeURIComponent(current);
  const [first, second] = [currentUsername, friendUsername].sort();
  const channelName = friendUsername === "Guest" ? groupchatId ?? `${first}_${second}` : `${first}_${second}`;
  const { groupChats } = useGroupChats();
  const [group, setGroup] = useState<GroupChat | null>(null);
  const [members, setMembers] = useState<string[]>([]);
   

  const socket = useSocket();
  
  const handleLeaveCall = async () => {

    if (friendUsername != "Guest"){
    // Send the call end message
      await sendCallEndMessage(currentUsername, friendUsername);

      // Leave the call and redirect to the chat page
      router.push(`/chat?friend=${friendUsername}&user=${currentUsername}`);
    }
    else if (groupchatId){

      const groupData = groupChats.find((group) => group.id === groupchatId);
      if (!groupData) {
        throw new Error("Group not found");
      }

      console.log(groupchatId);

      setGroup(groupData);

      if (groupchatId && group?.members) {

        const validMembers = group.members.filter((member) => member !== null && member != currentUsername) as string[];

        setMembers(validMembers);

        await sendGroupCallEndMessage(currentUsername, validMembers);

        router.push(`/chat?group=${groupchatId}&user=${currentUsername}`);
      }
    }
  };

  const sendCallEndMessage = async (currentUsername: string, friendUsername: string) => {
    try {
      if(!socket) return;

      const postMessageData = await postMessageAndUnread(currentUsername, '📞 I left the call room.', true, friendUsername);
  
      emitPrivateMessage(socket, currentUsername, '📞 I left the call room.', postMessageData.docId, true, friendUsername);
      
    } catch (error) {
      console.error("Error posting call end message:", error);
    }
  };

  const sendGroupCallEndMessage = async (currentUsername: string, validMembers: string[]) => {
    try {
      if(!socket || !groupchatId) return;

      const postMessageData = await postMessageAndUnread(
        currentUsername,
        '📞 I left the group call room.',
        false,
        undefined,          
        groupchatId,        
        validMembers
      );

      emitPrivateMessage(
        socket,
        currentUsername,
        '📞 I left the group call room.',
        postMessageData.id,
        false, // Not a call message
        undefined,
        groupchatId,
        validMembers
      );
      
    } catch (error) {
      console.error("Error posting group call end message:", error);
    }
  };

  return (
    <AgoraRTCProvider client={client}>
      <Videos currentUsername={currentUsername} friendUsername={friendUsername} channelName={channelName} AppID={appId} callMembers={members}/>
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

function Videos(props: {currentUsername: string; friendUsername: string; channelName: string; AppID: string; callMembers: string[];}) {
  const { currentUsername, friendUsername, AppID, channelName, callMembers} = props;
  const { isLoading: isLoadingMic, localMicrophoneTrack } = useLocalMicrophoneTrack();
  const { isLoading: isLoadingCam, localCameraTrack } = useLocalCameraTrack();
  const remoteUsers = useRemoteUsers();
  const { audioTracks } = useRemoteAudioTracks(remoteUsers);
  const router = useRouter();
  const { data: session } = useSession();
  const email = session?.user?.email;
  const [isValidUser, setIsValidUser] = useState(false);

  useJoin({
    appid: AppID,
    channel: channelName,
    token: null,
  });
  usePublish([localMicrophoneTrack, localCameraTrack]);

  audioTracks.map((track) => track.play());

  useEffect(() => {

    const validateUser = async () => {
      try {
        const userResponse = await fetch(`/api/getsingleuser?email=${email}`);
        if (!userResponse.ok) throw new Error("Failed to fetch user");

        const sessionUser = await userResponse.json();
        const fetchedUsername = sessionUser.data?.username || "Unknown";

        if (friendUsername == "Guest" && !callMembers.includes(currentUsername)){
          customToast({ message: "You cannot access this call!", type: "error" });
          router.push("/")
        }

        if (fetchedUsername !== currentUsername) {
          customToast({ message: "You cannot access this call!", type: "error" });
          router.push("/");
        } else {
          setIsValidUser(true);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        router.push("/");
      }
    };

    validateUser();

    if (friendUsername != "Guest"){
      if (remoteUsers.length >= 2) {
        customToast({ message: "This call is full, you cannot join at the moment", type: "error" });
        router.push("/");
      } 
    }

  }, [remoteUsers, router, email, currentUsername, friendUsername, callMembers]);

  if (!isValidUser) return <LoadingLogo />;

  const deviceLoading = isLoadingMic || isLoadingCam;
  if (deviceLoading)
    return (
      <LoadingLogo></LoadingLogo>
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
                playVideo={true}
                playAudio={true}
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