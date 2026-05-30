"use client";

import { useEffect, useRef, useState } from "react";

// Script CDN URL
const MEDIAPIPE_CDN = "https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/selfie_segmentation.js";

export type VirtualBackgroundType =
  | "none"
  | "blur-low"
  | "blur-medium"
  | "blur-high"
  | "modern_office"
  | "cyberpunk_room"
  | "gradient_mesh";

// Preset image mapping
const PRESET_IMAGES: Record<string, string> = {
  modern_office: "/backgrounds/modern_office.png",
  cyberpunk_room: "/backgrounds/cyberpunk_room.png",
  gradient_mesh: "/backgrounds/gradient_mesh.png",
};

export function useVirtualBackground(
  originalStream: MediaStream | null,
  activeBackground: VirtualBackgroundType
) {
  const [processedStream, setProcessedStream] = useState<MediaStream | null>(null);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [isModelReady, setIsModelReady] = useState(false);

  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const canvasElementRef = useRef<HTMLCanvasElement | null>(null);
  const selfieSegmentationRef = useRef<any>(null);
  const activeBackgroundRef = useRef<VirtualBackgroundType>(activeBackground);
  const animationFrameIdRef = useRef<number | null>(null);
  const isDestroyedRef = useRef(false);
  const presetImagesRef = useRef<Record<string, HTMLImageElement>>({});

  // Keep track of active background in a ref to avoid recreating the loop
  useEffect(() => {
    activeBackgroundRef.current = activeBackground;
  }, [activeBackground]);

  // Load MediaPipe Selfie Segmentation Script dynamically
  useEffect(() => {
    if (activeBackground === "none") return;

    let isMounted = true;

    async function loadMediaPipe() {
      if ((window as any).SelfieSegmentation) {
        if (isMounted) setIsScriptLoaded(true);
        return;
      }

      try {
        const script = document.createElement("script");
        script.src = MEDIAPIPE_CDN;
        script.async = true;
        script.crossOrigin = "anonymous";
        script.onload = () => {
          if (isMounted) setIsScriptLoaded(true);
        };
        script.onerror = () => {
          console.error("Failed to load MediaPipe Selfie Segmentation from CDN.");
        };
        document.body.appendChild(script);
      } catch (err) {
        console.error("Error loading virtual background script:", err);
      }
    }

    loadMediaPipe();

    return () => {
      isMounted = false;
    };
  }, [activeBackground]);

  // Preload preset images
  useEffect(() => {
    Object.entries(PRESET_IMAGES).forEach(([key, src]) => {
      if (!presetImagesRef.current[key]) {
        const img = new Image();
        img.src = src;
        img.onload = () => {
          presetImagesRef.current[key] = img;
        };
      }
    });
  }, []);

  // Initialize and run the segmenter
  useEffect(() => {
    isDestroyedRef.current = false;

    if (!originalStream) {
      setProcessedStream(null);
      return;
    }

    const videoTrack = originalStream.getVideoTracks()[0];
    if (!videoTrack) {
      setProcessedStream(originalStream);
      return;
    }

    // If "none", simply return the original stream
    if (activeBackground === "none") {
      cleanupLoop();
      setProcessedStream(originalStream);
      return;
    }

    // Wait for the scripts to load
    if (!isScriptLoaded) {
      return;
    }

    const video = document.createElement("video");
    video.autoplay = true;
    video.playsInline = true;
    video.muted = true;
    video.srcObject = originalStream;
    videoElementRef.current = video;

    const canvas = document.createElement("canvas");
    canvasElementRef.current = canvas;

    let selfieSegmentation = selfieSegmentationRef.current;

    if (!selfieSegmentation) {
      const SelfieSegmentationClass = (window as any).SelfieSegmentation;
      if (!SelfieSegmentationClass) return;

      selfieSegmentation = new SelfieSegmentationClass({
        locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`,
      });

      selfieSegmentation.setOptions({
        modelSelection: 1, // 1 for landscape/more accurate
      });

      selfieSegmentationRef.current = selfieSegmentation;
    }

    let trackWidth = 640;
    let trackHeight = 480;

    // Get track settings or wait for loadedmetadata
    const settings = videoTrack.getSettings();
    if (settings.width && settings.height) {
      trackWidth = settings.width;
      trackHeight = settings.height;
      canvas.width = trackWidth;
      canvas.height = trackHeight;
    }

    video.onloadedmetadata = () => {
      trackWidth = video.videoWidth || 640;
      trackHeight = video.videoHeight || 480;
      canvas.width = trackWidth;
      canvas.height = trackHeight;
      video.play().catch(console.error);
    };

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Output stream from canvas
    const canvasStream = canvas.captureStream(30);
    const canvasVideoTrack = canvasStream.getVideoTracks()[0];

    // Combine canvas video track with original audio tracks
    const combinedStream = new MediaStream([
      canvasVideoTrack,
      ...originalStream.getAudioTracks(),
    ]);

    setProcessedStream(combinedStream);

    selfieSegmentation.onResults((results: any) => {
      if (isDestroyedRef.current || !ctx) return;

      const currentBg = activeBackgroundRef.current;
      const width = canvas.width;
      const height = canvas.height;

      ctx.save();
      ctx.clearRect(0, 0, width, height);

      // Draw the segmentation mask
      ctx.drawImage(results.segmentationMask, 0, 0, width, height);

      // Draw the person (source-in means only draw on top of mask pixels)
      ctx.globalCompositeOperation = "source-in";
      ctx.drawImage(results.image, 0, 0, width, height);

      // Draw the background behind the person (destination-over)
      ctx.globalCompositeOperation = "destination-over";

      if (currentBg.startsWith("blur")) {
        let blurPx = "15px";
        if (currentBg === "blur-low") blurPx = "6px";
        if (currentBg === "blur-medium") blurPx = "12px";
        if (currentBg === "blur-high") blurPx = "24px";

        ctx.filter = `blur(${blurPx})`;
        ctx.drawImage(results.image, 0, 0, width, height);
        ctx.filter = "none";
      } else {
        const bgImg = presetImagesRef.current[currentBg];
        if (bgImg) {
          ctx.drawImage(bgImg, 0, 0, width, height);
        } else {
          // Fallback solid dark color
          ctx.fillStyle = "#0f172a";
          ctx.fillRect(0, 0, width, height);
        }
      }

      ctx.restore();
    });

    setIsModelReady(true);

    // Frame processing loop
    let isProcessing = true;
    async function processFrame() {
      if (isDestroyedRef.current || !isProcessing) return;

      if (video.readyState >= 2) {
        try {
          await selfieSegmentation.send({ image: video });
        } catch (err) {
          console.error("SelfieSegmentation frame processing error:", err);
        }
      }

      animationFrameIdRef.current = requestAnimationFrame(processFrame);
    }

    processFrame();

    return () => {
      isProcessing = false;
      cleanupLoop();
    };
  }, [originalStream, isScriptLoaded, activeBackground === "none"]);

  function cleanupLoop() {
    isDestroyedRef.current = true;
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
    }
    if (videoElementRef.current) {
      videoElementRef.current.srcObject = null;
      videoElementRef.current = null;
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isDestroyedRef.current = true;
      cleanupLoop();
      if (selfieSegmentationRef.current) {
        try {
          selfieSegmentationRef.current.close();
        } catch (e) {}
        selfieSegmentationRef.current = null;
      }
    };
  }, []);

  return {
    processedStream,
    isModelReady,
  };
}

// Visual Background Picker component (beautiful and glassmorphic)
interface BackgroundPickerProps {
  activeBackground: VirtualBackgroundType;
  onChangeBackground: (bg: VirtualBackgroundType) => void;
  onClose: () => void;
}

export function BackgroundPicker({
  activeBackground,
  onChangeBackground,
  onClose,
}: BackgroundPickerProps) {
  const options: Array<{
    id: VirtualBackgroundType;
    label: string;
    description: string;
    previewStyle: string;
  }> = [
    {
      id: "none",
      label: "No Background",
      description: "Original camera view",
      previewStyle: "bg-slate-900 border border-slate-700 flex items-center justify-center text-xs text-slate-400",
    },
    {
      id: "blur-low",
      label: "Subtle Blur",
      description: "Light background blur",
      previewStyle: "bg-slate-800/80 backdrop-blur-[4px] border border-slate-700/80",
    },
    {
      id: "blur-medium",
      label: "Normal Blur",
      description: "Standard background blur",
      previewStyle: "bg-slate-800/60 backdrop-blur-[12px] border border-slate-700/80",
    },
    {
      id: "blur-high",
      label: "Deep Blur",
      description: "Strong background blur",
      previewStyle: "bg-slate-800/40 backdrop-blur-[24px] border border-slate-700/80",
    },
    {
      id: "modern_office",
      label: "Modern Office",
      description: "Minimal workspace look",
      previewStyle: "bg-[url('/backgrounds/modern_office.png')] bg-cover bg-center border border-slate-700/80",
    },
    {
      id: "cyberpunk_room",
      label: "Neon Cyberpunk",
      description: "High-tech abstract room",
      previewStyle: "bg-[url('/backgrounds/cyberpunk_room.png')] bg-cover bg-center border border-slate-700/80",
    },
    {
      id: "gradient_mesh",
      label: "Mesh Gradient",
      description: "Sleek colorful waves",
      previewStyle: "bg-[url('/backgrounds/gradient_mesh.png')] bg-cover bg-center border border-slate-700/80",
    },
  ];

  return (
    <div className="w-full h-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border-l border-slate-800 flex flex-col shadow-2xl p-4 text-white z-50">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-100">Virtual Backgrounds</h3>
          <p className="text-slate-400 text-xs mt-0.5">Choose a filter or preset</p>
        </div>
        <button
          onClick={onClose}
          className="rounded-full p-1.5 hover:bg-slate-800 transition text-slate-400 hover:text-white"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-5 h-5"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Grid of Background options */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {options.map((option) => (
          <button
            key={option.id}
            onClick={() => onChangeBackground(option.id)}
            className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition border ${
              activeBackground === option.id
                ? "bg-cyan-500/10 border-cyan-500 text-cyan-400 font-semibold"
                : "bg-slate-900/40 border-slate-800 hover:bg-slate-900/80 text-slate-300 hover:text-white"
            }`}
          >
            {/* Visual Thumbnail */}
            <div className={`w-14 h-10 rounded-lg flex-shrink-0 relative overflow-hidden ${option.previewStyle}`}>
              {option.id === "none" && (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-4 h-4"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
              )}
            </div>

            {/* Description */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{option.label}</p>
              <p className="text-slate-400 text-xs truncate mt-0.5">{option.description}</p>
            </div>

            {/* Checkmark indicator */}
            {activeBackground === option.id && (
              <div className="w-5 h-5 rounded-full bg-cyan-500 flex items-center justify-center text-slate-950">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
                  stroke="currentColor"
                  className="w-3 h-3"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
