import { useState, useEffect, lazy, Suspense } from 'react';
import { Volume2, VolumeX, Video, VideoOff, Mic, MicOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLiveKit } from '@/hooks/use-livekit';

// Lazy load the heavy LiveKit component
const LiveKitVideoPlayer = lazy(() => import('@/components/livekit-video-player'));

interface ShowVideoProps {
  show?: any;
  isShowOwner?: boolean;
  userId?: string;
}

// Independent video component - can be commented out without affecting the page
export function ShowVideo({ show, isShowOwner = false, userId }: ShowVideoProps) {
  if (!show) return null;

  const [muted, setMuted] = useState(false);
  const [livekitEnabled, setLivekitEnabled] = useState(false);

  const showId = show._id || show.id;
  const isLive = show?.status === 'active' && show?.started && !show?.ended;

  // Initialize LiveKit
  const {
    room,
    isConnecting,
    isConnected,
    error: livekitError,
    hasVideo,
    hasAudio,
    isHost,
    isMuted,
    toggleCamera,
    toggleMicrophone,
    toggleAudioMute,
  } = useLiveKit({
    roomId: showId,
    userId: userId || '',
    userName: userId || '',
    enabled: livekitEnabled,
  });

  // Auto-enable LiveKit when show is live
  useEffect(() => {
    if (show?.ended) {
      setLivekitEnabled(false);
      return;
    }

    if (show && !show.started) {
      setLivekitEnabled(false);
      return;
    }

    if (isLive && !livekitEnabled) {
      console.log('🔴 Show is live, enabling LiveKit...');
      setLivekitEnabled(true);
    }
  }, [isLive, livekitEnabled, show?.ended, show?.started, show]);

  // Show loading state
  if (!isLive) {
    return (
      <div className="flex-1 bg-zinc-900 flex items-center justify-center">
        <div className="text-center">
          <Video className="h-16 w-16 text-zinc-600 mx-auto mb-4" />
          <p className="text-zinc-400">Show not started yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-zinc-900 relative">
      {/* Video Player */}
      {livekitEnabled && room && (
        <Suspense fallback={
          <div className="w-full h-full flex items-center justify-center">
            <p className="text-zinc-400">Loading video...</p>
          </div>
        }>
          <LiveKitVideoPlayer room={room} />
        </Suspense>
      )}

      {/* Connection Error */}
      {livekitError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
          <div className="text-center">
            <VideoOff className="h-16 w-16 text-red-400 mx-auto mb-4" />
            <p className="text-red-400">{livekitError}</p>
          </div>
        </div>
      )}

      {/* Video Controls - Bottom Overlay */}
      {livekitEnabled && (
        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
          {/* Viewer Controls */}
          {!isShowOwner && (
            <div className="flex gap-2">
              <Button
                size="icon"
                variant="secondary"
                className="bg-black/50 hover:bg-black/70 backdrop-blur-sm"
                onClick={toggleAudioMute}
                data-testid="button-toggle-mute"
              >
                {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </Button>
            </div>
          )}

          {/* Host Controls */}
          {isShowOwner && (
            <div className="flex gap-2">
              <Button
                size="icon"
                variant="secondary"
                className="bg-black/50 hover:bg-black/70 backdrop-blur-sm"
                onClick={toggleCamera}
                data-testid="button-toggle-camera"
              >
                {hasVideo ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
              </Button>
              <Button
                size="icon"
                variant="secondary"
                className="bg-black/50 hover:bg-black/70 backdrop-blur-sm"
                onClick={toggleMicrophone}
                data-testid="button-toggle-mic"
              >
                {hasAudio ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
              </Button>
            </div>
          )}

          {/* Connection Status */}
          <div className="bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full text-xs">
            {isConnecting && <span className="text-yellow-400">Connecting...</span>}
            {isConnected && <span className="text-green-400">● Live</span>}
            {!isConnecting && !isConnected && <span className="text-red-400">Disconnected</span>}
          </div>
        </div>
      )}
    </div>
  );
}
