"use client";

import { PerspectiveCamera } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { type FC, forwardRef, useMemo, useRef } from "react";
import * as THREE from "three";
import { degToRad } from "three/src/math/MathUtils.js";

const noise = `
float random(in vec2 st) { return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123); }
float noise(in vec2 st) {
  vec2 i = floor(st); vec2 f = fract(st);
  float a = random(i); float b = random(i + vec2(1.0,0.0));
  float c = random(i + vec2(0.0,1.0)); float d = random(i + vec2(1.0,1.0));
  vec2 u = f*f*(3.0-2.0*f);
  return mix(a,b,u.x) + (c-a)*u.y*(1.0-u.x) + (d-b)*u.x*u.y;
}
vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314*r;}
vec3 fade(vec3 t){return t*t*t*(t*(t*6.0-15.0)+10.0);}
float cnoise(vec3 P){
  vec3 Pi0=floor(P); vec3 Pi1=Pi0+vec3(1.0);
  Pi0=mod(Pi0,289.0); Pi1=mod(Pi1,289.0);
  vec3 Pf0=fract(P); vec3 Pf1=Pf0-vec3(1.0);
  vec4 ix=vec4(Pi0.x,Pi1.x,Pi0.x,Pi1.x); vec4 iy=vec4(Pi0.yy,Pi1.yy);
  vec4 iz0=Pi0.zzzz; vec4 iz1=Pi1.zzzz;
  vec4 ixy=permute(permute(ix)+iy); vec4 ixy0=permute(ixy+iz0); vec4 ixy1=permute(ixy+iz1);
  vec4 gx0=ixy0/7.0; vec4 gy0=fract(floor(gx0)/7.0)-0.5; gx0=fract(gx0);
  vec4 gz0=vec4(0.5)-abs(gx0)-abs(gy0); vec4 sz0=step(gz0,vec4(0.0));
  gx0-=sz0*(step(0.0,gx0)-0.5); gy0-=sz0*(step(0.0,gy0)-0.5);
  vec4 gx1=ixy1/7.0; vec4 gy1=fract(floor(gx1)/7.0)-0.5; gx1=fract(gx1);
  vec4 gz1=vec4(0.5)-abs(gx1)-abs(gy1); vec4 sz1=step(gz1,vec4(0.0));
  gx1-=sz1*(step(0.0,gx1)-0.5); gy1-=sz1*(step(0.0,gy1)-0.5);
  vec3 g000=vec3(gx0.x,gy0.x,gz0.x); vec3 g100=vec3(gx0.y,gy0.y,gz0.y);
  vec3 g010=vec3(gx0.z,gy0.z,gz0.z); vec3 g110=vec3(gx0.w,gy0.w,gz0.w);
  vec3 g001=vec3(gx1.x,gy1.x,gz1.x); vec3 g101=vec3(gx1.y,gy1.y,gz1.y);
  vec3 g011=vec3(gx1.z,gy1.z,gz1.z); vec3 g111=vec3(gx1.w,gy1.w,gz1.w);
  vec4 norm0=taylorInvSqrt(vec4(dot(g000,g000),dot(g010,g010),dot(g100,g100),dot(g110,g110)));
  g000*=norm0.x; g010*=norm0.y; g100*=norm0.z; g110*=norm0.w;
  vec4 norm1=taylorInvSqrt(vec4(dot(g001,g001),dot(g011,g011),dot(g101,g101),dot(g111,g111)));
  g001*=norm1.x; g011*=norm1.y; g101*=norm1.z; g111*=norm1.w;
  float n000=dot(g000,Pf0); float n100=dot(g100,vec3(Pf1.x,Pf0.yz));
  float n010=dot(g010,vec3(Pf0.x,Pf1.y,Pf0.z)); float n110=dot(g110,vec3(Pf1.xy,Pf0.z));
  float n001=dot(g001,vec3(Pf0.xy,Pf1.z)); float n101=dot(g101,vec3(Pf1.x,Pf0.y,Pf1.z));
  float n011=dot(g011,vec3(Pf0.x,Pf1.yz)); float n111=dot(g111,Pf1);
  vec3 fade_xyz=fade(Pf0);
  vec4 n_z=mix(vec4(n000,n100,n010,n110),vec4(n001,n101,n011,n111),fade_xyz.z);
  vec2 n_yz=mix(n_z.xy,n_z.zw,fade_xyz.y);
  return 2.2*mix(n_yz.x,n_yz.y,fade_xyz.x);
}
`;

function extendMaterial(cfg: any): THREE.ShaderMaterial {
  const physical = THREE.ShaderLib.physical as any;
  const uniforms: Record<string, THREE.IUniform> = THREE.UniformsUtils.clone(physical.uniforms);
  const defaults = new THREE.MeshStandardMaterial(cfg.material || {});
  if (defaults.color && uniforms["diffuse"]) uniforms["diffuse"].value = defaults.color;
  if (uniforms["roughness"]) uniforms["roughness"].value = cfg.material?.roughness ?? 0.3;

  Object.entries(cfg.uniforms ?? {}).forEach(([key, u]: [string, any]) => {
    uniforms[key] = u !== null && typeof u === "object" && "value" in u ? u : { value: u };
  });

  let vert = `${cfg.header}\n${physical.vertexShader}`;
  let frag = `${cfg.header}\n${physical.fragmentShader}`;
  for (const [inc, code] of Object.entries(cfg.vertex ?? {})) {
    vert = vert.replace(inc, `${inc}\n${code}`);
  }
  for (const [inc, code] of Object.entries(cfg.fragment ?? {})) {
    frag = frag.replace(inc, `${inc}\n${code}`);
  }

  return new THREE.ShaderMaterial({
    uniforms,
    vertexShader: vert,
    fragmentShader: frag,
    lights: true,
  });
}

const MergedPlanes = forwardRef<
  THREE.Mesh<THREE.BufferGeometry, THREE.ShaderMaterial>,
  { material: THREE.ShaderMaterial; width: number; count: number; height: number }
>(({ material, width, count, height }, _ref: any) => {
  const mesh = useRef<THREE.Mesh<THREE.BufferGeometry, THREE.ShaderMaterial>>(null!);
  const geometry = useMemo(() => {
    const n = count,
      hs = 100,
      spacing = 0;
    const numV = n * (hs + 1) * 2;
    const numF = n * hs * 2;
    const positions = new Float32Array(numV * 3);
    const indices = new Uint32Array(numF * 3);
    const uvs = new Float32Array(numV * 2);
    let vi = 0,
      ii = 0,
      ui = 0;
    const totalW = n * width + (n - 1) * spacing;
    const xBase = -totalW / 2;
    for (let i = 0; i < n; i++) {
      const x = xBase + i * (width + spacing);
      const uvX = Math.random() * 300,
        uvY = Math.random() * 300;
      for (let j = 0; j <= hs; j++) {
        const y = height * (j / hs - 0.5);
        positions.set([x, y, 0, x + width, y, 0], vi * 3);
        uvs.set([uvX, j / hs + uvY, uvX + 1, j / hs + uvY], ui);
        if (j < hs) {
          const a = vi,
            b = vi + 1,
            c = vi + 2,
            d = vi + 3;
          indices.set([a, b, c, c, b, d], ii);
          ii += 6;
        }
        vi += 2;
        ui += 4;
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
    geo.setIndex(new THREE.BufferAttribute(indices, 1));
    geo.computeVertexNormals();
    return geo;
  }, [count, width, height]);

  useFrame((_, delta) => {
    if (mesh.current.material.uniforms["time"])
      mesh.current.material.uniforms["time"].value += 0.1 * delta;
  });
  return <mesh ref={mesh} geometry={geometry} material={material} />;
});
MergedPlanes.displayName = "MergedPlanes";

const Beams: FC<{ lightColor: string }> = ({ lightColor }) => {
  const material = useMemo(
    () =>
      extendMaterial({
        header: `varying vec3 vEye; varying float vNoise; varying vec2 vUv; uniform float time; uniform float uSpeed; uniform float uNoiseIntensity; uniform float uScale; ${noise}`,
        vertex: {
          "#include <begin_vertex>": `float getPos(vec3 pos){vec3 np=vec3(pos.x*0.,pos.y-uv.y,pos.z+time*uSpeed*3.)*uScale;return cnoise(np);} transformed.z += getPos(transformed.xyz);`,
        },
        fragment: {
          "#include <dithering_fragment>": `gl_FragColor.rgb -= noise(gl_FragCoord.xy)/15.*uNoiseIntensity;`,
        },
        material: { roughness: 0.3, metalness: 0.3 },
        uniforms: {
          diffuse: new THREE.Color(0, 0, 0),
          time: { value: 0 },
          roughness: 0.3,
          metalness: 0.3,
          uSpeed: { value: 1.8 },
          envMapIntensity: 10,
          uNoiseIntensity: { value: 1.55 },
          uScale: { value: 0.18 },
        },
      }),
    []
  );

  const hexColor = useMemo(() => {
    const clean = lightColor.replace("#", "");
    const r = parseInt(clean.substring(0, 2), 16) / 255;
    const g = parseInt(clean.substring(2, 4), 16) / 255;
    const b = parseInt(clean.substring(4, 6), 16) / 255;
    return new THREE.Color(r, g, b);
  }, [lightColor]);

  return (
    <Canvas dpr={[1, 2]} frameloop="always" style={{ width: "100%", height: "100%" }}>
      <group rotation={[0, 0, degToRad(0)]}>
        <MergedPlanes material={material} count={14} width={2.2} height={20} />
        <directionalLight color={hexColor} intensity={1} position={[0, 3, 10]} />
      </group>
      <ambientLight intensity={1} />
      <color attach="background" args={["#000206"]} />
      <PerspectiveCamera makeDefault position={[0, 0, 20]} fov={30} />
    </Canvas>
  );
};

export default Beams;
