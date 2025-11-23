import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Memory } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

interface WorldMapProps {
  memories: Memory[];
  selectedMemoryId: string | null;
  onSelectMemory: (id: string) => void;
}

export const WorldMap: React.FC<WorldMapProps> = ({ memories, selectedMemoryId, onSelectMemory }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const earthRef = useRef<THREE.Mesh | null>(null);
  
  // State to track 2D positions of markers for HTML overlay
  const [markers, setMarkers] = useState<{ id: string; x: number; y: number; visible: boolean; zIndex: number }[]>([]);

  // Sort memories by date for flight paths
  const sortedMemories = useMemo(() => {
    return [...memories].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [memories]);

  // Initialize Three.js
  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(45, containerRef.current.clientWidth / containerRef.current.clientHeight, 0.1, 1000);
    // Adjusted initial position to face Asia/China roughly (Z is usually Greenwhich, -X is Americas, X is Asia)
    // China is roughly lat 35, long 105.
    // X = -R * sin(phi) * cos(theta) ... etc.
    // Simplified: Position camera to look at "East" side of globe.
    camera.position.set(-150, 80, -120); // Looking towards Asia
    
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const sunLight = new THREE.DirectionalLight(0xffffff, 1.5);
    sunLight.position.set(50, 30, 50);
    scene.add(sunLight);

    // Earth Group
    const earthGroup = new THREE.Group();
    scene.add(earthGroup);

    // Earth Sphere
    const textureLoader = new THREE.TextureLoader();
    const earthGeometry = new THREE.SphereGeometry(50, 64, 64);
    
    // Set a deep blue color as base to avoid black globe if texture fails
    const earthMaterial = new THREE.MeshPhongMaterial({
      color: 0x1e3a8a, // Fallback blue
      map: textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_atmos_2048.jpg'),
      specularMap: textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_specular_2048.jpg'),
      normalMap: textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_normal_2048.jpg'),
      shininess: 15,
    });
    const earth = new THREE.Mesh(earthGeometry, earthMaterial);
    earthGroup.add(earth);
    earthRef.current = earth;

    // Atmosphere Glow
    const atmosphereGeometry = new THREE.SphereGeometry(51.5, 64, 64);
    const atmosphereMaterial = new THREE.MeshPhongMaterial({
      color: 0x3b82f6,
      transparent: true,
      opacity: 0.1,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
    });
    const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    scene.add(atmosphere);

    // Stars
    const starsGeometry = new THREE.BufferGeometry();
    const starsCount = 2000;
    const posArray = new Float32Array(starsCount * 3);
    for(let i = 0; i < starsCount * 3; i++) {
      posArray[i] = (Math.random() - 0.5) * 1000;
    }
    starsGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const starsMaterial = new THREE.PointsMaterial({ size: 0.5, color: 0xffffff, transparent: true, opacity: 0.8 });
    const stars = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(stars);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 70;
    controls.maxDistance = 300;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.5;
    controlsRef.current = controls;

    // Animation Loop
    let frameId: number;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      controls.update();
      
      // Update Markers Projection
      updateMarkers();

      renderer.render(scene, camera);
    };
    animate();

    // Handle Resize
    const handleResize = () => {
      if (!containerRef.current || !camera || !renderer) return;
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(frameId);
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []); // Init once

  // Function to project 3D coordinates to 2D screen
  const updateMarkers = () => {
    if (!cameraRef.current || !containerRef.current) return;
    
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;
    const widthHalf = width / 2;
    const heightHalf = height / 2;
    const earthRadius = 50;

    const newMarkers = memories.map(memory => {
      // Convert Lat/Lng to 3D Position
      const phi = (90 - memory.coordinates.lat) * (Math.PI / 180);
      const theta = (memory.coordinates.lng + 180) * (Math.PI / 180);
      
      const x = -(earthRadius * Math.sin(phi) * Math.cos(theta));
      const z = (earthRadius * Math.sin(phi) * Math.sin(theta));
      const y = (earthRadius * Math.cos(phi));

      const pos = new THREE.Vector3(x, y, z);
      
      // Project to screen
      pos.project(cameraRef.current!);

      // Check visibility (dot product with camera direction)
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(pos.x, pos.y), cameraRef.current!);
      const intersects = raycaster.intersectObject(earthRef.current!);
      
      // Calculate z-index based on distance for overlap
      const zIndex = Math.floor((1 - pos.z) * 1000);

      return {
        id: memory.id,
        x: (pos.x * widthHalf) + widthHalf,
        y: -(pos.y * heightHalf) + heightHalf,
        visible: false, // will update below
        zIndex
      };
    });

    // Refine visibility
    const cameraPos = new THREE.Vector3();
    cameraRef.current.getWorldPosition(cameraPos);

    const refinedMarkers = newMarkers.map(m => {
      const memory = memories.find(mem => mem.id === m.id)!;
      const phi = (90 - memory.coordinates.lat) * (Math.PI / 180);
      const theta = (memory.coordinates.lng + 180) * (Math.PI / 180);
      const x = -(earthRadius * Math.sin(phi) * Math.cos(theta));
      const z = (earthRadius * Math.sin(phi) * Math.sin(theta));
      const y = (earthRadius * Math.cos(phi));
      const vec = new THREE.Vector3(x, y, z);
      
      const normal = vec.clone().normalize();
      const viewVector = cameraPos.clone().sub(vec).normalize();
      const dot = normal.dot(viewVector);
      
      return { ...m, visible: dot > 0.15 }; // Slightly stricter visibility check
    });

    setMarkers(refinedMarkers);
  };

  // Flight Paths Effect
  useEffect(() => {
    if (!sceneRef.current || sortedMemories.length < 2) return;

    const radius = 50;
    const material = new THREE.LineBasicMaterial({ color: 0xfcd34d, transparent: true, opacity: 0.6 });
    const lines: THREE.Line[] = [];

    for (let i = 0; i < sortedMemories.length - 1; i++) {
      const start = sortedMemories[i].coordinates;
      const end = sortedMemories[i + 1].coordinates;

      // Convert start/end to vectors
      const getVec = (lat: number, lng: number) => {
        const phi = (90 - lat) * (Math.PI / 180);
        const theta = (lng + 180) * (Math.PI / 180);
        return new THREE.Vector3(
          -(radius * Math.sin(phi) * Math.cos(theta)),
          (radius * Math.cos(phi)),
          (radius * Math.sin(phi) * Math.sin(theta))
        );
      };

      const v1 = getVec(start.lat, start.lng);
      const v2 = getVec(end.lat, end.lng);

      // Create curve
      const distance = v1.distanceTo(v2);
      const mid = v1.clone().add(v2).multiplyScalar(0.5).normalize().multiplyScalar(radius + (distance * 0.5));
      
      const curve = new THREE.QuadraticBezierCurve3(v1, mid, v2);
      const points = curve.getPoints(50);
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      
      const line = new THREE.Line(geometry, material);
      sceneRef.current.add(line);
      lines.push(line);
    }

    return () => {
      lines.forEach(line => {
        if (line.geometry) line.geometry.dispose();
        sceneRef.current?.remove(line);
      });
    };
  }, [sortedMemories]);

  // Handle Selection / Fly To
  useEffect(() => {
    if (selectedMemoryId && controlsRef.current && cameraRef.current) {
      const memory = memories.find(m => m.id === selectedMemoryId);
      if (memory) {
        controlsRef.current.autoRotate = false; // Stop spinning to focus
        
        const lat = memory.coordinates.lat;
        const lng = memory.coordinates.lng;
        const phi = (90 - lat) * (Math.PI / 180);
        const theta = (lng + 180) * (Math.PI / 180);
        
        // Calculate new camera position (offset from the point)
        const distance = 120; // Zoom in distance
        const x = -(distance * Math.sin(phi) * Math.cos(theta));
        const z = (distance * Math.sin(phi) * Math.sin(theta));
        const y = (distance * Math.cos(phi));

        // Smoothly animate camera
        const startPos = cameraRef.current.position.clone();
        const endPos = new THREE.Vector3(x, y, z);
        
        let t = 0;
        const animateFly = () => {
          t += 0.02;
          if (t > 1) {
            controlsRef.current!.autoRotate = true; // Resume gentle spin
            return;
          }
          cameraRef.current!.position.lerpVectors(startPos, endPos, t);
          controlsRef.current!.update();
          requestAnimationFrame(animateFly);
        };
        animateFly();
      }
    }
  }, [selectedMemoryId, memories]);

  return (
    <div className="h-full w-full relative bg-slate-900 rounded-none md:rounded-3xl overflow-hidden shadow-2xl border border-slate-700">
      <div ref={containerRef} className="h-full w-full cursor-move" />
      
      {/* HTML Overlay for Markers */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <AnimatePresence>
          {markers.map((marker) => {
            const memory = memories.find(m => m.id === marker.id);
            if (!memory || !marker.visible) return null;

            const isSelected = selectedMemoryId === marker.id;

            return (
              <motion.div
                key={marker.id}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                style={{
                  position: 'absolute',
                  left: marker.x,
                  top: marker.y,
                  zIndex: marker.zIndex,
                  transform: 'translate(-50%, -100%)', // Anchor to bottom center
                }}
                className="pointer-events-auto cursor-pointer group"
                onClick={() => onSelectMemory(marker.id)}
              >
                {/* The Pin Stick */}
                <div className={`w-0.5 h-8 mx-auto bg-white/50 transition-all duration-300 ${isSelected ? 'h-12 bg-yellow-400' : 'group-hover:h-10 group-hover:bg-white'}`}></div>
                
                {/* The Photo Bubble */}
                <div className={`
                  relative -mt-1 p-1 rounded-full transition-all duration-300 shadow-xl marker-float
                  ${isSelected ? 'bg-yellow-400 scale-125 z-50' : 'bg-white group-hover:scale-110 group-hover:z-50'}
                `}>
                  <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white">
                    <img src={memory.photos[0]} alt={memory.locationName} className="w-full h-full object-cover" />
                  </div>
                  
                  {/* Tooltip on Hover */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                     <div className="bg-slate-900 text-white text-xs px-2 py-1 rounded shadow-lg font-bold">
                       {memory.locationName}
                     </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Overlay UI Controls */}
      <div className="absolute bottom-6 right-6 flex flex-col gap-2 pointer-events-none">
         <div className="bg-slate-900/50 backdrop-blur text-white/50 text-[10px] px-2 py-1 rounded">
            滚动缩放 • 拖拽旋转
         </div>
      </div>
    </div>
  );
};