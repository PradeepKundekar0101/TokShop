import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Camera, Video, Mic, Settings } from 'lucide-react';

interface CameraSettingsModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (settings: CameraSettings) => void;
}

export interface CameraSettings {
  deviceId: string;
  resolution: { width: number; height: number };
}

interface CameraDevice {
  deviceId: string;
  label: string;
}

const RESOLUTION_OPTIONS = [
  { label: '1080p (Full HD)', width: 1920, height: 1080 },
  { label: '720p (HD)', width: 1280, height: 720 },
  { label: '480p (SD)', width: 854, height: 480 },
  { label: '360p', width: 640, height: 360 },
];

export function CameraSettingsModal({ open, onClose, onConfirm }: CameraSettingsModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>('');
  const [selectedResolution, setSelectedResolution] = useState<string>('1280x720');
  const [actualResolution, setActualResolution] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      loadCameras();
    } else {
      stopStream();
    }
    
    return () => {
      stopStream();
    };
  }, [open]);

  useEffect(() => {
    if (open && selectedCamera) {
      startPreview();
    }
  }, [selectedCamera, selectedResolution, open]);

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const loadCameras = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      await navigator.mediaDevices.getUserMedia({ video: true });
      
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices
        .filter(device => device.kind === 'videoinput')
        .map((device, index) => ({
          deviceId: device.deviceId,
          label: device.label || `Camera ${index + 1}`,
        }));
      
      setCameras(videoDevices);
      
      if (videoDevices.length > 0 && !selectedCamera) {
        setSelectedCamera(videoDevices[0].deviceId);
      }
    } catch (err) {
      console.error('Failed to load cameras:', err);
      setError('Failed to access camera. Please check permissions.');
    } finally {
      setIsLoading(false);
    }
  };

  const startPreview = async () => {
    if (!selectedCamera) return;
    
    try {
      setIsLoading(true);
      setError(null);
      stopStream();
      
      const [width, height] = selectedResolution.split('x').map(Number);
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: { exact: selectedCamera },
          width: { ideal: width },
          height: { ideal: height },
          frameRate: { ideal: 30 },
        },
        audio: false,
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      const videoTrack = stream.getVideoTracks()[0];
      const settings = videoTrack.getSettings();
      setActualResolution(`${settings.width} x ${settings.height}`);
      
    } catch (err) {
      console.error('Failed to start preview:', err);
      setError('Failed to start camera preview.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = () => {
    const [width, height] = selectedResolution.split('x').map(Number);
    stopStream();
    onConfirm({
      deviceId: selectedCamera,
      resolution: { width, height },
    });
  };

  const handleClose = () => {
    stopStream();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Camera Settings
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
                <div className="text-white">Loading camera...</div>
              </div>
            )}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-contain"
              style={{ transform: 'scaleX(-1)' }}
            />
            {actualResolution && (
              <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                {actualResolution}
              </div>
            )}
          </div>
          
          {error && (
            <div className="text-red-500 text-sm text-center">{error}</div>
          )}
          
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="camera" className="flex items-center gap-2">
                <Camera className="w-4 h-4" />
                Camera
              </Label>
              <Select value={selectedCamera} onValueChange={setSelectedCamera}>
                <SelectTrigger id="camera">
                  <SelectValue placeholder="Select camera" />
                </SelectTrigger>
                <SelectContent className="z-[10000]">
                  {cameras.map((camera) => (
                    <SelectItem key={camera.deviceId} value={camera.deviceId}>
                      {camera.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="resolution" className="flex items-center gap-2">
                <Video className="w-4 h-4" />
                Quality
              </Label>
              <Select value={selectedResolution} onValueChange={setSelectedResolution}>
                <SelectTrigger id="resolution">
                  <SelectValue placeholder="Select quality" />
                </SelectTrigger>
                <SelectContent className="z-[10000]">
                  {RESOLUTION_OPTIONS.map((res) => (
                    <SelectItem key={`${res.width}x${res.height}`} value={`${res.width}x${res.height}`}>
                      {res.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {actualResolution && (
                <p className="text-xs text-muted-foreground">
                  Actual: {actualResolution} (camera may not support selected quality)
                </p>
              )}
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!selectedCamera || isLoading}>
            <Mic className="w-4 h-4 mr-2" />
            Go Live
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
