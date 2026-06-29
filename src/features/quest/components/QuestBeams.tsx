"use client";

import { useEffect, useRef } from "react";

const BEAM_WIDTH = 2;
const BEAM_HEIGHT = 30;
const BEAM_NUMBER = 14;
const LIGHT_COLOR = "#67e8f9";
const SPEED = 2;
const NOISE_INTENSITY = 2.25;
const SCALE = 0.15;
const ROTATION_DEG = 55;

const NOISE_GLSL = [
  "float random(in vec2 st){return fract(sin(dot(st.xy,vec2(12.9898,78.233)))*43758.5453123);}",
  "float noise(in vec2 st){",
  "  vec2 i=floor(st),f=fract(st);",
  "  float a=random(i),b=random(i+vec2(1.,0.)),c=random(i+vec2(0.,1.)),d=random(i+vec2(1.,1.));",
  "  vec2 u=f*f*(3.-2.*f);",
  "  return mix(a,b,u.x)+(c-a)*u.y*(1.-u.x)+(d-b)*u.x*u.y;",
  "}",
  "vec4 permute(vec4 x){return mod(((x*34.)+1.)*x,289.);}",
  "vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}",
  "vec3 fade3(vec3 t){return t*t*t*(t*(t*6.-15.)+10.);}",
  "float cnoise(vec3 P){",
  "  vec3 Pi0=floor(P),Pi1=Pi0+vec3(1.);",
  "  Pi0=mod(Pi0,289.);Pi1=mod(Pi1,289.);",
  "  vec3 Pf0=fract(P),Pf1=Pf0-vec3(1.);",
  "  vec4 ix=vec4(Pi0.x,Pi1.x,Pi0.x,Pi1.x),iy=vec4(Pi0.yy,Pi1.yy);",
  "  vec4 iz0=Pi0.zzzz,iz1=Pi1.zzzz;",
  "  vec4 ixy=permute(permute(ix)+iy);",
  "  vec4 ixy0=permute(ixy+iz0),ixy1=permute(ixy+iz1);",
  "  vec4 gx0=ixy0/7.,gy0=fract(floor(gx0)/7.)-.5;gx0=fract(gx0);",
  "  vec4 gz0=vec4(.5)-abs(gx0)-abs(gy0),sz0=step(gz0,vec4(0.));",
  "  gx0-=sz0*(step(0.,gx0)-.5);gy0-=sz0*(step(0.,gy0)-.5);",
  "  vec4 gx1=ixy1/7.,gy1=fract(floor(gx1)/7.)-.5;gx1=fract(gx1);",
  "  vec4 gz1=vec4(.5)-abs(gx1)-abs(gy1),sz1=step(gz1,vec4(0.));",
  "  gx1-=sz1*(step(0.,gx1)-.5);gy1-=sz1*(step(0.,gy1)-.5);",
  "  vec3 g000=vec3(gx0.x,gy0.x,gz0.x),g100=vec3(gx0.y,gy0.y,gz0.y);",
  "  vec3 g010=vec3(gx0.z,gy0.z,gz0.z),g110=vec3(gx0.w,gy0.w,gz0.w);",
  "  vec3 g001=vec3(gx1.x,gy1.x,gz1.x),g101=vec3(gx1.y,gy1.y,gz1.y);",
  "  vec3 g011=vec3(gx1.z,gy1.z,gz1.z),g111=vec3(gx1.w,gy1.w,gz1.w);",
  "  vec4 norm0=taylorInvSqrt(vec4(dot(g000,g000),dot(g010,g010),dot(g100,g100),dot(g110,g110)));",
  "  g000*=norm0.x;g010*=norm0.y;g100*=norm0.z;g110*=norm0.w;",
  "  vec4 norm1=taylorInvSqrt(vec4(dot(g001,g001),dot(g011,g011),dot(g101,g101),dot(g111,g111)));",
  "  g001*=norm1.x;g011*=norm1.y;g101*=norm1.z;g111*=norm1.w;",
  "  float n000=dot(g000,Pf0),n100=dot(g100,vec3(Pf1.x,Pf0.yz));",
  "  float n010=dot(g010,vec3(Pf0.x,Pf1.y,Pf0.z)),n110=dot(g110,vec3(Pf1.xy,Pf0.z));",
  "  float n001=dot(g001,vec3(Pf0.xy,Pf1.z)),n101=dot(g101,vec3(Pf1.x,Pf0.y,Pf1.z));",
  "  float n011=dot(g011,vec3(Pf0.x,Pf1.yz)),n111=dot(g111,Pf1);",
  "  vec3 fxyz=fade3(Pf0);",
  "  vec4 nz=mix(vec4(n000,n100,n010,n110),vec4(n001,n101,n011,n111),fxyz.z);",
  "  vec2 nyz=mix(nz.xy,nz.zw,fxyz.y);",
  "  return 2.2*mix(nyz.x,nyz.y,fxyz.x);",
  "}",
].join("\n");

export function QuestBeams() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    let rafId: number;
    let renderer: import("three").WebGLRenderer | null = null;

    import("three")
      .then((THREE) => {
        if (!canvas) return;

        function hexToColor(hex: string): import("three").Color {
          const c = hex.replace("#", "");
          return new THREE.Color(
            parseInt(c.slice(0, 2), 16) / 255,
            parseInt(c.slice(2, 4), 16) / 255,
            parseInt(c.slice(4, 6), 16) / 255
          );
        }

        function extendMaterial(cfg: {
          header?: string;
          vertexHeader?: string;
          vertex?: Record<string, string>;
          fragment?: Record<string, string>;
          material?: Record<string, unknown>;
          uniforms?: Record<string, unknown>;
        }): import("three").ShaderMaterial {
          const physical = THREE.ShaderLib.physical;
          const uniforms = THREE.UniformsUtils.clone(physical.uniforms);
          const defaults = new THREE.MeshStandardMaterial(
            (cfg.material as ConstructorParameters<typeof THREE.MeshStandardMaterial>[0]) ?? {}
          );

          if (defaults.color && uniforms["diffuse"])
            uniforms["diffuse"].value = defaults.color.clone();
          if (defaults.roughness !== undefined && uniforms["roughness"])
            uniforms["roughness"].value = defaults.roughness;
          if (defaults.metalness !== undefined && uniforms["metalness"])
            uniforms["metalness"].value = defaults.metalness;

          for (const key of Object.keys(cfg.uniforms ?? {})) {
            const u = (cfg.uniforms ?? {})[key];
            uniforms[key] =
              u !== null && typeof u === "object" && "value" in (u as object)
                ? (u as { value: unknown })
                : { value: u };
          }

          let vert =
            (cfg.header ?? "") + "\n" + (cfg.vertexHeader ?? "") + "\n" + physical.vertexShader;
          let frag = (cfg.header ?? "") + "\n" + physical.fragmentShader;

          for (const tok of Object.keys(cfg.vertex ?? {})) {
            vert = vert.replace(tok, tok + "\n" + (cfg.vertex ?? {})[tok]);
          }
          for (const tok of Object.keys(cfg.fragment ?? {})) {
            frag = frag.replace(tok, tok + "\n" + (cfg.fragment ?? {})[tok]);
          }

          return new THREE.ShaderMaterial({
            defines: Object.assign(
              {},
              (physical as { defines?: Record<string, unknown> }).defines ?? {}
            ),
            uniforms,
            vertexShader: vert,
            fragmentShader: frag,
            lights: true,
            fog: !!(cfg.material && cfg.material["fog"]),
            side: THREE.DoubleSide,
          });
        }

        function createGeometry(
          n: number,
          width: number,
          height: number,
          spacing: number,
          heightSegments: number
        ): import("three").BufferGeometry {
          const geo = new THREE.BufferGeometry();
          const numVerts = n * (heightSegments + 1) * 2;
          const numFaces = n * heightSegments * 2;
          const positions = new Float32Array(numVerts * 3);
          const indices = new Uint32Array(numFaces * 3);
          const uvs = new Float32Array(numVerts * 2);

          let vOff = 0;
          let iOff = 0;
          let uvOff = 0;
          const totalW = n * width + (n - 1) * spacing;
          const xBase = -totalW / 2;

          for (let i = 0; i < n; i++) {
            const xOffset = xBase + i * (width + spacing);
            const uvRandX = Math.random() * 300;
            const uvRandY = Math.random() * 300;
            for (let j = 0; j <= heightSegments; j++) {
              const y = height * (j / heightSegments - 0.5);
              const base3 = vOff * 3;
              positions[base3] = xOffset;
              positions[base3 + 1] = y;
              positions[base3 + 2] = 0;
              positions[base3 + 3] = xOffset + width;
              positions[base3 + 4] = y;
              positions[base3 + 5] = 0;
              const uvy = j / heightSegments;
              uvs[uvOff] = uvRandX;
              uvs[uvOff + 1] = uvy + uvRandY;
              uvs[uvOff + 2] = uvRandX + 1;
              uvs[uvOff + 3] = uvy + uvRandY;
              if (j < heightSegments) {
                const a = vOff;
                const b = vOff + 1;
                const c = vOff + 2;
                const d = vOff + 3;
                indices[iOff] = a;
                indices[iOff + 1] = b;
                indices[iOff + 2] = c;
                indices[iOff + 3] = c;
                indices[iOff + 4] = b;
                indices[iOff + 5] = d;
                iOff += 6;
              }
              vOff += 2;
              uvOff += 4;
            }
          }

          geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
          geo.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
          geo.setIndex(new THREE.BufferAttribute(indices, 1));
          geo.computeVertexNormals();
          return geo;
        }

        renderer = new THREE.WebGLRenderer({
          canvas,
          antialias: false,
          powerPreference: "high-performance",
        });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x000000);

        const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
        camera.position.set(0, 0, 20);

        scene.add(new THREE.AmbientLight(0xffffff, 1));
        const dirLight = new THREE.DirectionalLight(hexToColor(LIGHT_COLOR), 1);
        dirLight.position.set(0, 3, 10);
        scene.add(dirLight);

        const mat = extendMaterial({
          header: [
            "varying vec3 vEye;",
            "varying float vNoise;",
            "varying vec2 vUv;",
            "varying vec3 vPosition;",
            "uniform float time;",
            "uniform float uSpeed;",
            "uniform float uNoiseIntensity;",
            "uniform float uScale;",
            NOISE_GLSL,
          ].join("\n"),
          vertexHeader: [
            "float getPos(vec3 pos){",
            "  vec3 np=vec3(pos.x*0.,pos.y-uv.y,pos.z+time*uSpeed*3.)*uScale;",
            "  return cnoise(np);",
            "}",
            "vec3 getCurrentPos(vec3 pos){vec3 np=pos;np.z+=getPos(pos);return np;}",
            "vec3 getNormal(vec3 pos){",
            "  vec3 cp=getCurrentPos(pos);",
            "  vec3 nx=getCurrentPos(pos+vec3(0.01,0.,0.));",
            "  vec3 nz=getCurrentPos(pos+vec3(0.,-0.01,0.));",
            "  return normalize(cross(normalize(nz-cp),normalize(nx-cp)));",
            "}",
          ].join("\n"),
          vertex: {
            "#include <begin_vertex>": "transformed.z+=getPos(transformed.xyz);",
            "#include <beginnormal_vertex>": "objectNormal=getNormal(position.xyz);",
          },
          fragment: {
            "#include <dithering_fragment>":
              "float rn=noise(gl_FragCoord.xy);\ngl_FragColor.rgb-=rn/15.*uNoiseIntensity;",
          },
          material: { fog: true },
          uniforms: {
            diffuse: hexToColor("#000000"),
            time: { value: 0 },
            roughness: 0.3,
            metalness: 0.3,
            uSpeed: { value: SPEED },
            envMapIntensity: 10,
            uNoiseIntensity: NOISE_INTENSITY,
            uScale: SCALE,
          },
        });

        const geo = createGeometry(BEAM_NUMBER, BEAM_WIDTH, BEAM_HEIGHT, 0, 100);
        const group = new THREE.Group();
        group.rotation.z = THREE.MathUtils.degToRad(ROTATION_DEG);
        group.add(new THREE.Mesh(geo, mat));
        scene.add(group);

        function resize() {
          const w = (canvas as HTMLCanvasElement).offsetWidth || window.innerWidth;
          const h = (canvas as HTMLCanvasElement).offsetHeight || window.innerHeight;
          renderer?.setSize(w, h, false);
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
        }
        resize();
        window.addEventListener("resize", resize, { passive: true });

        let prev = performance.now();
        function animate() {
          rafId = requestAnimationFrame(animate);
          const now = performance.now();
          const timeUniform = mat.uniforms["time"];
          if (timeUniform) timeUniform.value += (0.1 * (now - prev)) / 1000;
          prev = now;
          renderer?.render(scene, camera);
        }
        animate();

        return () => {
          cancelAnimationFrame(rafId);
          window.removeEventListener("resize", resize);
          geo.dispose();
          mat.dispose();
          renderer?.dispose();
          renderer = null;
        };
      })
      .catch((err: unknown) => {
        console.error("[QuestBeams] Failed to load THREE.js:", err);
      });

    return () => {
      cancelAnimationFrame(rafId);
      renderer?.dispose();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      id="beams-canvas"
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 h-full w-full"
    />
  );
}
