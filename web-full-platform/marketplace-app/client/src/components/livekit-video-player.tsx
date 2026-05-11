import { Room, Track, VideoQuality } from 'livekit-client';
import { 
  RoomAudioRenderer, 
  RoomContext,
  VideoTrack,
  useTracks
} from '@livekit/components-react';
import '@livekit/components-styles';
import { useEffect, useRef } from 'react';

interface LiveKitVideoPlayerProps {
  room: Room;
}

function LocalVideoPreview({ room }: { room: Room }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const localParticipant = room.localParticipant;
    
    const attachLocalVideo = () => {
      const cameraPublication = localParticipant.getTrackPublication(Track.Source.Camera);
      console.log('📹 LocalVideoPreview - camera publication:', cameraPublication?.trackSid);
      
      if (cameraPublication?.track && videoRef.current) {
        const mediaStreamTrack = cameraPublication.track.mediaStreamTrack;
        console.log('📹 LocalVideoPreview - attaching mediaStreamTrack:', !!mediaStreamTrack);
        if (mediaStreamTrack) {
          const stream = new MediaStream([mediaStreamTrack]);
          videoRef.current.srcObject = stream;
          console.log('📹 LocalVideoPreview - stream attached successfully');
        }
      }
    };

    attachLocalVideo();

    const handleTrackPublished = () => {
      console.log('📹 LocalVideoPreview - track published event');
      attachLocalVideo();
    };

    localParticipant.on('localTrackPublished', handleTrackPublished);
    
    return () => {
      localParticipant.off('localTrackPublished', handleTrackPublished);
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [room]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted
      className="w-full h-full object-cover"
      style={{
        transform: 'scaleX(-1) translateZ(0)',
        backfaceVisibility: 'hidden',
        imageRendering: 'auto',
      }}
      onLoadedMetadata={(e) => {
        const video = e.target as HTMLVideoElement;
        console.log('📹 Local video dimensions:', video.videoWidth, 'x', video.videoHeight);
      }}
    />
  );
}

function VideoGrid({ room }: { room: Room }) {
  const tracks = useTracks([Track.Source.Camera, Track.Source.ScreenShare]);
  const localParticipant = room.localParticipant;
  const hasLocalCamera = !!localParticipant.getTrackPublication(Track.Source.Camera)?.track;
  const canPublish = localParticipant.permissions?.canPublish ?? false;

  useEffect(() => {
    tracks.forEach((trackRef) => {
      if (!trackRef.participant.isLocal && trackRef.publication) {
        const remotePub = trackRef.publication;
        if ('setVideoQuality' in remotePub) {
          (remotePub as any).setVideoQuality(VideoQuality.HIGH);
        }
      }
    });
  }, [tracks]);

  const remoteTracks = tracks.filter(t => !t.participant.isLocal);
  const showLocalPreview = canPublish && hasLocalCamera;
  
  console.log('📹 VideoGrid state:', { canPublish, hasLocalCamera, showLocalPreview, tracksCount: tracks.length, remoteTracksCount: remoteTracks.length });

  return (
    <div className="w-full h-full bg-black flex items-center justify-center">
      {showLocalPreview ? (
        <div className="w-full h-full">
          <LocalVideoPreview room={room} />
        </div>
      ) : remoteTracks.length > 0 ? (
        <div className="w-full h-full">
          {remoteTracks.map((trackRef) => (
            <div key={trackRef.participant.identity} className="w-full h-full">
              <VideoTrack 
                trackRef={trackRef}
                className="w-full h-full object-cover"
                style={{ 
                  imageRendering: 'auto',
                  transform: 'translateZ(0)',
                  backfaceVisibility: 'hidden'
                }}
              />
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function LiveKitVideoPlayer({ room }: LiveKitVideoPlayerProps) {
  return (
    <RoomContext.Provider value={room}>
      <div className="w-full h-full" data-testid="livekit-video-container">
        <VideoGrid room={room} />
        <RoomAudioRenderer />
      </div>
    </RoomContext.Provider>
  );
}

// Add default export for lazy loading compatibility
export default LiveKitVideoPlayer;
