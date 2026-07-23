import * as THREE from "three";
import { OrbitControls } from "../vendor/three/OrbitControls.js";
import { GLTFLoader } from "../vendor/three/GLTFLoader.js";

function frameObject(camera, controls, object, padding = 1.45) {
  const box = new THREE.Box3().setFromObject(object);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const radius = Math.max(size.x, size.y, size.z) * 0.5;
  const distance = Math.max(radius * padding / Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5)), 1.2);

  controls.target.copy(center);
  camera.position.copy(center).add(new THREE.Vector3(distance * 0.86, distance * 0.5, distance));
  camera.near = Math.max(distance / 100, 0.001);
  camera.far = distance * 20;
  camera.updateProjectionMatrix();
  controls.minDistance = distance * 0.35;
  controls.maxDistance = distance * 4;
  controls.update();
  controls.saveState();
}

export function createModelViewer({ container, modelUrl, onLoaded }) {
  const status = container.querySelector(".viewer-status");
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xdfe5e7);

  const camera = new THREE.PerspectiveCamera(42, 1, 0.01, 100);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.07;
  controls.enablePan = true;

  scene.add(new THREE.HemisphereLight(0xffffff, 0x879398, 2.2));
  const key = new THREE.DirectionalLight(0xffffff, 3.4);
  key.position.set(4, 6, 5);
  key.castShadow = true;
  scene.add(key);
  const fill = new THREE.DirectionalLight(0x8ac7cf, 1.1);
  fill.position.set(-4, 2, -4);
  scene.add(fill);

  const root = new THREE.Group();
  scene.add(root);

  const loader = new GLTFLoader();
  loader.load(
    modelUrl,
    (gltf) => {
      const model = gltf.scene;
      model.traverse((child) => {
        if (!child.isMesh) return;
        child.castShadow = true;
        child.receiveShadow = true;
      });
      root.add(model);
      if (onLoaded) onLoaded({ root, model, scene });
      frameObject(camera, controls, root);
      status.hidden = true;
    },
    (event) => {
      if (!event.total) return;
      status.textContent = `正在加载模型 ${Math.round((event.loaded / event.total) * 100)}%`;
    },
    (error) => {
      console.error(error);
      status.textContent = "模型加载失败，请通过本地服务器打开页面。";
      status.classList.add("is-error");
    },
  );

  const resize = () => {
    const width = Math.max(container.clientWidth, 1);
    const height = Math.max(container.clientHeight, 1);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };
  const observer = new ResizeObserver(resize);
  observer.observe(container);
  resize();

  renderer.setAnimationLoop(() => {
    controls.update();
    renderer.render(scene, camera);
  });

  return {
    reset() {
      controls.reset();
    },
    dispose() {
      observer.disconnect();
      renderer.setAnimationLoop(null);
      renderer.dispose();
    },
  };
}

