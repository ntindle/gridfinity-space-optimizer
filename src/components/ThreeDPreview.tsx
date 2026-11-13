/* eslint-disable react/no-unknown-property -- react-three-fiber JSX uses three.js props, not DOM props */
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Canvas, useThree, type ThreeEvent } from "@react-three/fiber";
import { OrbitControls } from "three-stdlib";
import * as THREE from "three";
import { RotateCcw } from "lucide-react";
import { unitMath } from "@/services/unitMath";
import {
  boxForPointerClick,
  buildThreeDBoxes,
  type ThreeDBox,
  type ThreeDBoxKind,
} from "@/utils/threeDLayout";
import {
  darkColorSchemeQuery,
  prefersDarkColorScheme,
  readPreviewColors,
  sceneColorsForTheme,
  type PreviewColors,
} from "@/utils/threeDColors";
import { Button } from "@/components/ui/button";
import type { Bin, DrawerSize, LayoutItem } from "@/types";

export interface ThreeDPreviewProps {
  layout: LayoutItem[];
  bins: Bin[];
  drawerMm: DrawerSize;
  binGroupKey: Map<string, string>;
  selectedBinId: string | null;
  selectedKey: string | null;
  aspectRatio: string;
  onSelectBin: (id: string) => void;
  onSelectPiece: (key: string) => void;
}

const KIND_COLOR: Record<ThreeDBoxKind, keyof PreviewColors> = {
  baseplate: "baseplate",
  "half-size": "halfSize",
  spacer: "spacer",
  bin: "bin",
};

const KIND_ORDER: ThreeDBoxKind[] = ["baseplate", "half-size", "spacer", "bin"];

interface ViewControlsProps {
  home: [number, number, number];
  maxSide: number;
  resetSignal: number;
}

const ViewControls: React.FC<ViewControlsProps> = ({ home, maxSide, resetSignal }) => {
  const camera = useThree((state) => state.camera);
  const gl = useThree((state) => state.gl);
  const invalidate = useThree((state) => state.invalidate);
  const controls = useMemo(() => {
    const next = new OrbitControls(camera, gl.domElement);
    next.enableDamping = false;
    next.target.set(0, 0, 0);
    next.minDistance = unitMath.multiply(maxSide, 0.35);
    next.maxDistance = unitMath.multiply(maxSide, 5);
    next.minPolarAngle = 0.05;
    next.maxPolarAngle = unitMath.multiply(Math.PI, 0.49);
    next.update();
    return next;
  }, [camera, gl, maxSide]);
  useEffect(() => () => controls.dispose(), [controls]);
  useEffect(() => {
    const onChange = () => invalidate();
    controls.addEventListener("change", onChange);
    return () => controls.removeEventListener("change", onChange);
  }, [controls, invalidate]);
  useEffect(() => {
    camera.position.set(home[0], home[1], home[2]);
    controls.target.set(0, 0, 0);
    controls.update();
  }, [camera, controls, home, resetSignal]);
  return <primitive object={controls} />;
};

interface KindMeshProps {
  boxes: ThreeDBox[];
  color: string;
  selectedColor: string;
  isSelected: (box: ThreeDBox) => boolean;
  onSelect: (box: ThreeDBox) => void;
}

const KindMesh: React.FC<KindMeshProps> = ({
  boxes,
  color,
  selectedColor,
  isSelected,
  onSelect,
}) => {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!(mesh instanceof THREE.InstancedMesh)) return;
    const dummy = new THREE.Object3D();
    boxes.forEach((box, index) => {
      dummy.position.set(
        box.centerX,
        unitMath.add(box.baseY, unitMath.divide(box.height, 2)),
        box.centerZ
      );
      dummy.scale.set(box.width, box.height, box.depth);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      mesh.setMatrixAt(index, dummy.matrix);
      mesh.setColorAt(index, new THREE.Color(isSelected(box) ? selectedColor : color));
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [boxes, color, selectedColor, isSelected]);
  if (boxes.length === 0) return null;
  return (
    <instancedMesh
      args={[undefined, undefined, boxes.length]}
      ref={ref}
      frustumCulled={false}
      castShadow
      receiveShadow
      onClick={(event: ThreeEvent<MouseEvent>) => {
        event.stopPropagation();
        const box = boxForPointerClick(boxes, event.instanceId, event.delta);
        if (box) onSelect(box);
      }}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshLambertMaterial />
    </instancedMesh>
  );
};

const ThreeDPreview: React.FC<ThreeDPreviewProps> = ({
  layout,
  bins,
  drawerMm,
  binGroupKey,
  selectedBinId,
  selectedKey,
  aspectRatio,
  onSelectBin,
  onSelectPiece,
}) => {
  const [resetSignal, setResetSignal] = useState(0);
  const [isDark, setIsDark] = useState(() => prefersDarkColorScheme());
  useEffect(() => {
    const query = darkColorSchemeQuery();
    if (!query) return;
    const onChange = (event: MediaQueryListEvent) => setIsDark(event.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);
  const colors = useMemo(
    () => sceneColorsForTheme(readPreviewColors(), isDark),
    [isDark]
  );
  const boxes = useMemo(
    () => buildThreeDBoxes(layout, bins, drawerMm, binGroupKey),
    [layout, bins, drawerMm, binGroupKey]
  );
  const home = useMemo(() => {
    const maxSide = unitMath.max(drawerMm.width, drawerMm.height);
    const distance = unitMath.multiply(maxSide, 1.5);
    return {
      position: [
        unitMath.multiply(drawerMm.width, 0.55),
        unitMath.multiply(distance, 0.8),
        unitMath.multiply(drawerMm.height, 0.85),
      ] as [number, number, number],
      maxSide,
    };
  }, [drawerMm]);
  const lightPosition = useMemo(
    () =>
      [
        unitMath.multiply(home.maxSide, 0.8),
        unitMath.multiply(home.maxSide, 1.4),
        unitMath.multiply(home.maxSide, 0.6),
      ] as [number, number, number],
    [home]
  );
  const fillPosition = useMemo(
    () =>
      [
        unitMath.multiply(home.maxSide, -0.8),
        unitMath.multiply(home.maxSide, 0.6),
        unitMath.multiply(home.maxSide, -0.6),
      ] as [number, number, number],
    [home]
  );
  const isSelected = (box: ThreeDBox): boolean =>
    (box.binId !== null && box.binId === selectedBinId) || box.key === selectedKey;
  const handleSelect = (box: ThreeDBox) => {
    if (box.binId !== null) onSelectBin(box.binId);
    else onSelectPiece(box.key);
  };
  return (
    <div
      className="drawer-floor relative min-w-0 flex-1 touch-manipulation select-none overflow-hidden rounded-[3px]"
      style={{ aspectRatio }}
    >
      <p className="sr-only">
        3D view of the drawer layout. Bins sit on the baseplates at their printed heights.
        Select and edit bins in the 2D view or the parts list below.
      </p>
      <div aria-hidden="true" className="absolute inset-0">
        <Canvas
          shadows
          dpr={[1, 2]}
          frameloop="demand"
          camera={{ position: home.position, fov: 40, near: 1, far: 10000 }}
          gl={{ antialias: true }}
        >
          <ambientLight intensity={isDark ? 1 : 0.85} />
          <directionalLight
            castShadow
            position={lightPosition}
            intensity={isDark ? 1 : 0.9}
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
            shadow-camera-left={unitMath.multiply(home.maxSide, -0.9)}
            shadow-camera-right={unitMath.multiply(home.maxSide, 0.9)}
            shadow-camera-top={unitMath.multiply(home.maxSide, 0.9)}
            shadow-camera-bottom={unitMath.multiply(home.maxSide, -0.9)}
          />
          {isDark && <hemisphereLight args={["#ffffff", "#44403c", 0.55]} />}
          {isDark && <directionalLight position={fillPosition} intensity={0.45} />}
          <mesh
            rotation={[-Math.PI / 2, 0, 0]}
            position={[0, -0.5, 0]}
            receiveShadow
          >
            <planeGeometry
              args={[unitMath.add(drawerMm.width, 42), unitMath.add(drawerMm.height, 42)]}
            />
            <meshLambertMaterial color={colors.floor} />
          </mesh>
          {KIND_ORDER.map((kind) => (
            <KindMesh
              key={kind}
              boxes={boxes.filter((box) => box.kind === kind)}
              color={colors[KIND_COLOR[kind]]}
              selectedColor={colors.selected}
              isSelected={isSelected}
              onSelect={handleSelect}
            />
          ))}
          <ViewControls home={home.position} maxSide={home.maxSide} resetSignal={resetSignal} />
        </Canvas>
      </div>
      <div className="pointer-events-none absolute bottom-2 left-2 rounded bg-background/80 px-1.5 py-0.5 text-[11px] text-muted-foreground">
        <span className="pointer-coarse:hidden">Drag to orbit · Scroll to zoom · Right-drag to pan</span>
        <span className="hidden pointer-coarse:inline">One finger orbits · Two fingers zoom</span>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="absolute right-2 top-2 bg-background/80"
        onClick={() => setResetSignal((signal) => signal + 1)}
      >
        <RotateCcw />
        Reset view
      </Button>
    </div>
  );
};

export default ThreeDPreview;
