import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import {
  ArrowLeft,
  Maximize2,
  Minimize2,
  X,
  Compass,
  AlertTriangle,
  Camera,
  Upload,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Navigation,
  CheckCircle2,
  Info
} from 'lucide-react';
import type { CampusViewpoint } from './data/viewpoints';
import { CAMPUS_VIEWPOINTS } from './data/viewpoints';
import type { HazardFeatureCollection, HazardFeature } from '../../api/hazards';

interface Campus360ViewerProps {
  initialViewpointId?: string;
  hazards: HazardFeatureCollection | null;
  onClose: () => void;
  onSelectViewpointOnMap?: (viewpoint: CampusViewpoint) => void;
}

export const Campus360Viewer: React.FC<Campus360ViewerProps> = ({
  initialViewpointId = 'school-ground',
  hazards,
  onClose,
  onSelectViewpointOnMap,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [currentViewpoint, setCurrentViewpoint] = useState<CampusViewpoint>(() => {
    return CAMPUS_VIEWPOINTS.find((v) => v.id === initialViewpointId) || CAMPUS_VIEWPOINTS[0];
  });

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [autoRotate, setAutoRotate] = useState(false);
  const [heading, setHeading] = useState(0);
  const [customImageMap, setCustomImageMap] = useState<Record<string, string>>({});
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [hasRealPhoto, setHasRealPhoto] = useState(false);

  // Three.js References
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sphereMeshRef = useRef<THREE.Mesh | null>(null);
  const textureLoaderRef = useRef<THREE.TextureLoader>(new THREE.TextureLoader());
  const animationFrameRef = useRef<number | null>(null);

  // Spherical Coordinates for Camera Look
  const isUserInteractingRef = useRef(false);
  const onMouseDownMouseXRef = useRef(0);
  const onMouseDownMouseYRef = useRef(0);
  const lonRef = useRef(0);
  const onMouseDownLonRef = useRef(0);
  const latRef = useRef(0);
  const onMouseDownLatRef = useRef(0);
  const phiRef = useRef(0);
  const thetaRef = useRef(0);
  const fovRef = useRef(75);
  const touchStartDistRef = useRef(0);

  // ── Calculate Nearby Hazards (Within 45 meters) ──
  const nearbyHazards = React.useMemo(() => {
    if (!hazards || !hazards.features) return [];
    const vpLat = currentViewpoint.lat;
    const vpLng = currentViewpoint.lng;

    return hazards.features.filter((h: HazardFeature) => {
      const [hLng, hLat] = h.geometry.coordinates;
      // Rough distance approximation in meters (1 deg ~ 111,000m)
      const dLat = (hLat - vpLat) * 110570;
      const dLng = (hLng - vpLng) * 110650;
      const dist = Math.sqrt(dLat * dLat + dLng * dLng);
      return dist <= 45;
    });
  }, [hazards, currentViewpoint]);

  // ── Generate Procedural Cyber/Architectural Grid for Placeholder ──
  const createPlaceholderTexture = useCallback((viewpoint: CampusViewpoint): THREE.CanvasTexture => {
    const canvas = document.createElement('canvas');
    canvas.width = 4096;
    canvas.height = 2048;
    const ctx = canvas.getContext('2d')!;

    // Gradient Sky / Ground
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, '#0f172a');
    grad.addColorStop(0.48, '#1e293b');
    grad.addColorStop(0.5, '#090d16');
    grad.addColorStop(0.52, '#1e293b');
    grad.addColorStop(1, '#020617');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Perspective Grid Lines
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.25;

    // Horizontal latitude rings
    for (let y = 100; y < canvas.height; y += 100) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
    // Vertical longitude lines
    for (let x = 0; x < canvas.width; x += 128) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }

    // Horizon line
    ctx.globalAlpha = 0.8;
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, canvas.height / 2);
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();

    // 4 Compass Direction Watermarks
    ctx.globalAlpha = 0.9;
    ctx.font = 'bold 72px sans-serif';
    ctx.fillStyle = '#f8fafc';
    ctx.textAlign = 'center';

    const directions = ['[ NORTH (0°) ]', '[ EAST (90°) ]', '[ SOUTH (180°) ]', '[ WEST (270°) ]'];
    directions.forEach((dir, i) => {
      const x = (canvas.width / 4) * i + canvas.width / 8;
      ctx.fillText(dir, x, canvas.height / 2 - 80);
      ctx.font = 'bold 44px sans-serif';
      ctx.fillStyle = '#38bdf8';
      ctx.fillText(`Polonuling NHS — ${viewpoint.name}`, x, canvas.height / 2 - 10);
      ctx.font = 'italic 34px sans-serif';
      ctx.fillStyle = '#f59e0b';
      ctx.fillText('⚠️ 360° IMAGERY NOT YET AVAILABLE', x, canvas.height / 2 + 50);
      ctx.font = '28px sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('Upload campus 360° equirectangular photo to activate this viewpoint', x, canvas.height / 2 + 95);
      ctx.font = 'bold 72px sans-serif';
      ctx.fillStyle = '#f8fafc';
    });

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }, []);

  // ── Load Texture (Real Image or Placeholder) ──
  const loadViewpointTexture = useCallback(
    (viewpoint: CampusViewpoint) => {
      setLoading(true);

      const customImg = customImageMap[viewpoint.id];
      const imageUrl = customImg || viewpoint.image;

      const sphereMesh = sphereMeshRef.current;
      if (!sphereMesh) return;

      if (customImg) {
        // Load custom uploaded image
        textureLoaderRef.current.load(
          imageUrl,
          (texture) => {
            texture.colorSpace = THREE.SRGBColorSpace;
            (sphereMesh.material as THREE.MeshBasicMaterial).map = texture;
            (sphereMesh.material as THREE.MeshBasicMaterial).needsUpdate = true;
            setHasRealPhoto(true);
            setLoading(false);
          },
          undefined,
          () => {
            const placeholder = createPlaceholderTexture(viewpoint);
            (sphereMesh.material as THREE.MeshBasicMaterial).map = placeholder;
            (sphereMesh.material as THREE.MeshBasicMaterial).needsUpdate = true;
            setHasRealPhoto(false);
            setLoading(false);
          }
        );
      } else if (viewpoint.hasRealPhoto) {
        // Attempt loading real photo
        textureLoaderRef.current.load(
          imageUrl,
          (texture) => {
            texture.colorSpace = THREE.SRGBColorSpace;
            (sphereMesh.material as THREE.MeshBasicMaterial).map = texture;
            (sphereMesh.material as THREE.MeshBasicMaterial).needsUpdate = true;
            setHasRealPhoto(true);
            setLoading(false);
          },
          undefined,
          () => {
            // Fallback cleanly if file doesn't exist
            const placeholder = createPlaceholderTexture(viewpoint);
            (sphereMesh.material as THREE.MeshBasicMaterial).map = placeholder;
            (sphereMesh.material as THREE.MeshBasicMaterial).needsUpdate = true;
            setHasRealPhoto(false);
            setLoading(false);
          }
        );
      } else {
        // Use clean clearly-marked placeholder
        const placeholder = createPlaceholderTexture(viewpoint);
        (sphereMesh.material as THREE.MeshBasicMaterial).map = placeholder;
        (sphereMesh.material as THREE.MeshBasicMaterial).needsUpdate = true;
        setHasRealPhoto(false);
        setLoading(false);
      }
    },
    [customImageMap, createPlaceholderTexture]
  );

  // ── Initialize Three.js Scene ──
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(fovRef.current, width / height, 1, 1100);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    rendererRef.current = renderer;

    // 360 Inverted Sphere Geometry
    const geometry = new THREE.SphereGeometry(500, 60, 40);
    geometry.scale(-1, 1, 1); // Invert so inside is visible

    const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const sphereMesh = new THREE.Mesh(geometry, material);
    scene.add(sphereMesh);
    sphereMeshRef.current = sphereMesh;

    // Initial Texture Load
    loadViewpointTexture(currentViewpoint);

    // Render Animation Loop
    let lastTime = performance.now();
    const animate = (currentTime: number) => {
      animationFrameRef.current = requestAnimationFrame(animate);

      const delta = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      if (autoRotate && !isUserInteractingRef.current) {
        lonRef.current += 15 * delta;
      }

      // Clamp vertical pitch to avoid flipping
      latRef.current = Math.max(-85, Math.min(85, latRef.current));
      phiRef.current = THREE.MathUtils.degToRad(90 - latRef.current);
      thetaRef.current = THREE.MathUtils.degToRad(lonRef.current);

      const targetX = 500 * Math.sin(phiRef.current) * Math.cos(thetaRef.current);
      const targetY = 500 * Math.cos(phiRef.current);
      const targetZ = 500 * Math.sin(phiRef.current) * Math.sin(thetaRef.current);

      camera.lookAt(targetX, targetY, targetZ);
      renderer.render(scene, camera);

      // Normalize heading for compass
      const deg = ((lonRef.current % 360) + 360) % 360;
      setHeading(Math.round(deg));
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    // Handle Resize
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, [loadViewpointTexture, autoRotate]);

  // ── Switch Viewpoint ──
  const handleSelectViewpoint = (vp: CampusViewpoint) => {
    setCurrentViewpoint(vp);
    loadViewpointTexture(vp);
    if (onSelectViewpointOnMap) {
      onSelectViewpointOnMap(vp);
    }
  };

  // ── Pointer Drag Event Handlers ──
  const handlePointerDown = (e: React.PointerEvent) => {
    isUserInteractingRef.current = true;
    onMouseDownMouseXRef.current = e.clientX;
    onMouseDownMouseYRef.current = e.clientY;
    onMouseDownLonRef.current = lonRef.current;
    onMouseDownLatRef.current = latRef.current;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isUserInteractingRef.current) return;
    lonRef.current = (onMouseDownMouseXRef.current - e.clientX) * 0.15 + onMouseDownLonRef.current;
    latRef.current = (e.clientY - onMouseDownMouseYRef.current) * 0.15 + onMouseDownLatRef.current;
  };

  const handlePointerUp = () => {
    isUserInteractingRef.current = false;
  };

  // ── Wheel Zoom ──
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (!cameraRef.current) return;
    fovRef.current += e.deltaY * 0.05;
    fovRef.current = Math.max(30, Math.min(100, fovRef.current));
    cameraRef.current.fov = fovRef.current;
    cameraRef.current.updateProjectionMatrix();
  };

  // ── Touch Gestures for Mobile Pinch-to-Zoom ──
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      touchStartDistRef.current = Math.sqrt(dx * dx + dy * dy);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && cameraRef.current) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const factor = (touchStartDistRef.current - dist) * 0.1;
      fovRef.current = Math.max(30, Math.min(100, fovRef.current + factor));
      touchStartDistRef.current = dist;
      cameraRef.current.fov = fovRef.current;
      cameraRef.current.updateProjectionMatrix();
    }
  };

  // ── Fullscreen Toggle ──
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // ── Zoom In / Zoom Out Buttons ──
  const handleZoom = (delta: number) => {
    if (!cameraRef.current) return;
    fovRef.current = Math.max(30, Math.min(100, fovRef.current + delta));
    cameraRef.current.fov = fovRef.current;
    cameraRef.current.updateProjectionMatrix();
  };

  const handleResetOrientation = () => {
    lonRef.current = 0;
    latRef.current = 0;
    fovRef.current = 75;
    if (cameraRef.current) {
      cameraRef.current.fov = 75;
      cameraRef.current.updateProjectionMatrix();
    }
  };

  // ── Keyboard Navigation (Escape to close) ──
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isUploadOpen) {
          setIsUploadOpen(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, isUploadOpen]);

  // ── Local 360 Photo File Upload Handler ──
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setCustomImageMap((prev) => ({
        ...prev,
        [currentViewpoint.id]: dataUrl,
      }));
      setIsUploadOpen(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[1000] bg-black flex flex-col select-none overflow-hidden font-sans text-slate-100 animate-fadeIn"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
    >
      {/* ── WebGL Canvas ── */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing" />

      {/* ── Loading Overlay ── */}
      {loading && (
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center z-50">
          <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin shadow-[0_0_25px_#06b6d4]" />
          <p className="mt-4 text-cyan-300 font-bold text-sm tracking-wider uppercase animate-pulse">
            Loading 360° Panoramic Environment...
          </p>
        </div>
      )}

      {/* ── TOP HEADER BAR ── */}
      <div className="relative z-10 flex items-center justify-between p-4 bg-gradient-to-b from-slate-950/90 via-slate-950/60 to-transparent pointer-events-none">
        {/* Left: Back to Map */}
        <div className="flex items-center space-x-3 pointer-events-auto">
          <button
            onClick={onClose}
            className="flex items-center space-x-2 bg-slate-900/90 hover:bg-cyan-600 text-white font-bold px-4 py-2.5 rounded-2xl border border-slate-700/80 shadow-2xl transition-all hover:scale-105 active:scale-95 group"
            title="Return to GIS Campus Map (Escape)"
          >
            <ArrowLeft className="w-5 h-5 text-cyan-400 group-hover:text-white transition-colors" />
            <span className="text-sm">Back to Campus Map</span>
          </button>

          {/* Compass & Heading */}
          <div className="hidden sm:flex items-center space-x-1.5 bg-slate-900/80 backdrop-blur-md border border-slate-700/80 px-3 py-2 rounded-2xl text-xs font-mono text-cyan-300 shadow-xl">
            <Compass className="w-4 h-4 text-cyan-400" />
            <span>{heading}° {heading >= 315 || heading < 45 ? 'N' : heading < 135 ? 'E' : heading < 225 ? 'S' : 'W'}</span>
          </div>
        </div>

        {/* Center: Title */}
        <div className="text-center pointer-events-auto">
          <div className="inline-flex items-center space-x-2 bg-slate-900/80 backdrop-blur-md border border-slate-700/80 px-4 py-1.5 rounded-full shadow-2xl">
            <Camera className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span className="text-xs font-black tracking-widest text-slate-100 uppercase">
              360° Campus View
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1 font-medium drop-shadow">
            Polonuling National High School (DepEd ID: 304561)
          </p>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center space-x-2 pointer-events-auto">
          <button
            onClick={() => setIsUploadOpen(true)}
            className="flex items-center space-x-1.5 bg-slate-900/80 hover:bg-slate-800 text-cyan-300 hover:text-cyan-200 text-xs font-bold px-3 py-2 rounded-2xl border border-cyan-500/30 shadow-xl transition-all"
            title="Upload real 360° equirectangular photo"
          >
            <Upload className="w-4 h-4" />
            <span className="hidden md:inline">Upload 360° Photo</span>
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-2.5 bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white rounded-2xl border border-slate-700/80 shadow-xl transition-all"
            title="Toggle Fullscreen Mode"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          <button
            onClick={onClose}
            className="p-2.5 bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white rounded-2xl border border-red-500/40 shadow-xl transition-all"
            title="Exit 360° Viewer (Escape)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── EMERGENCY NEARBY HAZARD ALERT OVERLAY ── */}
      {nearbyHazards.length > 0 && (
        <div className="relative z-20 mx-4 md:mx-auto md:max-w-2xl mt-2 animate-bounce">
          <div className="bg-red-950/95 border-2 border-red-500 p-3.5 rounded-2xl shadow-[0_0_30px_rgba(239,68,68,0.6)] flex items-start space-x-3 text-red-100">
            <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0 animate-pulse mt-0.5" />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-red-300">
                  ⚠️ ACTIVE HAZARD NEARBY THIS VIEWPOINT
                </span>
                <span className="text-[10px] bg-red-800 text-red-100 px-2 py-0.5 rounded-full font-bold uppercase">
                  Danger Warning
                </span>
              </div>
              <p className="text-xs text-red-200 mt-1">
                {nearbyHazards[0].properties.description || 'Active hazard reported near this location.'}{' '}
                Avoid this corridor and follow the designated escape route to the Central School Ground.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── PLACEHOLDER STATUS NOTICE ── */}
      {!hasRealPhoto && (
        <div className="absolute top-20 left-4 z-10 pointer-events-auto max-w-sm hidden sm:block">
          <div className="bg-slate-900/90 backdrop-blur-md border border-amber-500/40 p-3 rounded-2xl shadow-2xl">
            <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold">
              <Info className="w-4 h-4" />
              <span>360° Imagery Status</span>
            </div>
            <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
              Real 360° photography for <strong className="text-white">{currentViewpoint.name}</strong> is not yet loaded in project files.
            </p>
            <p className="text-[10px] text-amber-300/90 mt-1.5 italic">
              Drop an equirectangular <code className="bg-slate-950 px-1 py-0.5 rounded text-cyan-300">.jpg</code> into <code className="bg-slate-950 px-1 py-0.5 rounded text-cyan-300">/public/360/</code> or click &ldquo;Upload 360° Photo&rdquo; to preview live.
            </p>
          </div>
        </div>
      )}

      {/* ── FLOATING VIEW CONTROLS (RIGHT) ── */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 z-10 flex flex-col space-y-2 pointer-events-auto">
        <button
          onClick={() => handleZoom(-10)}
          className="p-3 bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-cyan-400 rounded-2xl border border-slate-700/80 shadow-2xl transition-all"
          title="Zoom In"
        >
          <ZoomIn className="w-5 h-5" />
        </button>
        <button
          onClick={() => handleZoom(10)}
          className="p-3 bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-cyan-400 rounded-2xl border border-slate-700/80 shadow-2xl transition-all"
          title="Zoom Out"
        >
          <ZoomOut className="w-5 h-5" />
        </button>
        <button
          onClick={handleResetOrientation}
          className="p-3 bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-cyan-400 rounded-2xl border border-slate-700/80 shadow-2xl transition-all"
          title="Reset Camera View"
        >
          <RotateCcw className="w-5 h-5" />
        </button>
        <button
          onClick={() => setAutoRotate((v) => !v)}
          className={`p-3 rounded-2xl border shadow-2xl transition-all ${
            autoRotate
              ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-cyan-500/40'
              : 'bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-cyan-400 border-slate-700/80'
          }`}
          title="Toggle Auto-Rotation"
        >
          <Navigation className={`w-5 h-5 ${autoRotate ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* ── BOTTOM FOOTER & VIEWPOINT NAVIGATION BAR ── */}
      <div className="mt-auto relative z-10 p-4 bg-gradient-to-t from-slate-950/95 via-slate-950/70 to-transparent flex flex-col items-center pointer-events-none">
        {/* Current Viewpoint Banner */}
        <div className="pointer-events-auto flex flex-col items-center text-center mb-3">
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-xs font-black rounded-full uppercase tracking-wider shadow-lg">
              {currentViewpoint.category}
            </span>
            <span className="text-sm md:text-base font-bold text-white drop-shadow-md">
              {currentViewpoint.name} — 360° View
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-xl line-clamp-1 drop-shadow">
            {currentViewpoint.description}
          </p>
        </div>

        {/* Viewpoint Navigation Carousel / Quick Switcher */}
        <div className="pointer-events-auto flex items-center space-x-2 overflow-x-auto max-w-full p-2 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-2xl shadow-2xl">
          <span className="text-[10px] uppercase font-black tracking-widest text-slate-400 px-2 flex items-center space-x-1">
            <Camera className="w-3 h-3 text-cyan-400" />
            <span>Viewpoints:</span>
          </span>

          {CAMPUS_VIEWPOINTS.map((vp) => {
            const isActive = vp.id === currentViewpoint.id;
            const isConnected = currentViewpoint.connectedViewpoints.includes(vp.id);

            return (
              <button
                key={vp.id}
                onClick={() => handleSelectViewpoint(vp)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center space-x-1.5 ${
                  isActive
                    ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/30 scale-105 border border-cyan-400'
                    : isConnected
                    ? 'bg-slate-800 text-cyan-300 hover:bg-slate-700 border border-cyan-500/30'
                    : 'bg-slate-800/60 text-slate-400 hover:bg-slate-700 border border-transparent'
                }`}
              >
                <span>📷</span>
                <span>{vp.shortName}</span>
                {isConnected && !isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── UPLOAD MODAL FOR REAL 360 PHOTOS ── */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-md w-full shadow-2xl animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2 text-cyan-400 font-bold">
                <Upload className="w-5 h-5" />
                <span>Upload 360° Photo</span>
              </div>
              <button
                onClick={() => setIsUploadOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4">
              <p className="text-xs text-slate-300">
                Upload an equirectangular 360° panorama image (<code className="text-cyan-400">.jpg</code> or{' '}
                <code className="text-cyan-400">.png</code>, 2:1 aspect ratio) for:
              </p>
              <div className="mt-2 p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-xs font-bold text-white flex items-center space-x-2">
                <Camera className="w-4 h-4 text-cyan-400" />
                <span>{currentViewpoint.name}</span>
              </div>

              <label className="mt-4 flex flex-col items-center justify-center border-2 border-dashed border-cyan-500/40 hover:border-cyan-400 bg-slate-950/60 hover:bg-cyan-950/20 p-6 rounded-2xl cursor-pointer transition-all group">
                <Upload className="w-8 h-8 text-cyan-400 group-hover:scale-110 transition-transform mb-2" />
                <span className="text-xs font-bold text-slate-200">
                  Select 360° Panoramic Image File
                </span>
                <span className="text-[10px] text-slate-400 mt-1">
                  Supports JPG, PNG (Recommended 4096×2048)
                </span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </label>

              <div className="mt-4 flex items-center space-x-2 text-[11px] text-slate-400 bg-slate-950/50 p-2.5 rounded-xl border border-slate-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>Uploaded images preview immediately in real-time WebGL 360°.</span>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setIsUploadOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
