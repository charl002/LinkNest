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

function Call(props: { appId: string; channelName: string }) {
  const client = useRTCClient(
    AgoraRTC.createClient({ codec: "vp8", mode: "rtc" })
  );

  return (
    <AgoraRTCProvider client={client}>
      <Videos channelName={props.channelName} AppID={props.appId} />
      <div className="fixed z-10 bottom-0 left-0 right-0 flex justify-center pb-4">
        <Link
          className="px-5 py-3 text-base font-medium text-center text-white bg-red-500 rounded-lg hover:bg-red-400"
          href="/home">
          Leave Call
        </Link>
      </div>
    </AgoraRTCProvider>
  );
}

function Videos(props: { channelName: string; AppID: string }) {
  const { AppID, channelName } = props;
  const { isLoading: isLoadingMic, localMicrophoneTrack } =
    useLocalMicrophoneTrack();
  const { isLoading: isLoadingCam, localCameraTrack } = useLocalCameraTrack();
  const remoteUsers = useRemoteUsers();
  //console.log('Remote Users: ' + remoteUsers);
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
  const unit = "minmax(0, 2fr) ";

  //console.log("Remote users:", remoteUsers);

  return (
    <div
        className="flex flex-col justify-between w-full h-full"
        style={{ backgroundColor: 'white' }}
      >
      <div
        className={`gap-1 flex-1 w-full h-full mx-auto my-auto flex items-center justify-center`}
        style={{
          gridTemplateColumns:
            remoteUsers.length > 9
              ? unit.repeat(4)
              : remoteUsers.length > 4
              ? unit.repeat(3)
              : remoteUsers.length > 1
              ? unit.repeat(2)
              : unit,
        }}
      >
        <div className="relative w-full h-full">
          <LocalVideoTrack
            track={localCameraTrack}
            play={true}
            className="border-4 border-green-500 rounded-sm"
          />
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 mt-2">
            <span className="text-white text-2xl font-bold bg-black bg-opacity-50 px-4 py-2 rounded-lg">
              User 1
            </span>
          </div>
        </div>
        {remoteUsers.map((user) => (
          <div key={user.uid} className="relative w-full h-full">
            <RemoteUser
              user={user}
              className="w-full h-full border-4 border-gray-500 rounded-sm"
            />
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 mt-2">
              <span className="text-white text-2xl font-bold bg-black bg-opacity-50 px-4 py-2 rounded-lg">
                User 2
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Call;