// src/components/SilkBackground.jsx
import Silk from "./Silk";

export default function SilkBackground() {
  return (
    <div className="silk-bg">
      <Silk
        speed={1.6}
        scale={1}
        color="#7B7481"
        noiseIntensity={1.5}
        rotation={0}
      />
    </div>
  );
}
