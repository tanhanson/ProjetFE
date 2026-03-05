import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export function initIntroScene(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setSize(canvas.clientWidth, canvas.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.shadowMap.enabled = true;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xe0f0ff);
  scene.fog = new THREE.FogExp2(0xe0f0ff, 0.008);

  const camera = new THREE.PerspectiveCamera(60, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
  camera.position.set(0, 15, 60);
  camera.lookAt(0, 5, -50);

  // Lumières
  const ambient = new THREE.AmbientLight(0x404060, 1.2);
  scene.add(ambient);

  const hemi = new THREE.HemisphereLight(0x88ccff, 0xcc9966, 1.5);
  scene.add(hemi);

  const sun = new THREE.DirectionalLight(0xffeedd, 2.2);
  sun.position.set(80, 150, 60);
  sun.castShadow = true;
  scene.add(sun);

  // Sol
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(300, 600),
    new THREE.MeshStandardMaterial({ color: 0x4a7a3a, roughness: 0.9 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(0, -0.5, -150);
  ground.receiveShadow = true;
  scene.add(ground);

  // Route
  const road = new THREE.Mesh(
    new THREE.BoxGeometry(10, 0.3, 350),
    new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.7 })
  );
  road.position.set(0, -0.4, -100);
  scene.add(road);

  const loader = new GLTFLoader();

  // Charger l'école
  loader.load('models/maisonneuve6.glb', (glb) => {
    const ecole = glb.scene;
    ecole.scale.setScalar(2);
    ecole.position.set(10, 0, -70);
    ecole.traverse(child => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        if (child.material) {
          child.material = new THREE.MeshStandardMaterial({
            map: child.material.map,
            color: child.material.color,
            roughness: 0.4,
            metalness: 0.3,
          });
        }
      }
    });
    scene.add(ecole);
  });

  // Charger quelques arbres
  loader.load('models/tree.glb', (glb) => {
    const treeTemplate = glb.scene;
    const positions = [
      [-15, 0, -20], [15, 0, -20], [-20, 0, -60], [20, 0, -60],
      [-18, 0, -100], [18, 0, -100], [-15, 0, -140], [15, 0, -140],
      [-20, 0, -180], [20, 0, -180], [-18, 0, -220], [18, 0, -220],
    ];
    positions.forEach(([x, y, z]) => {
      const tree = treeTemplate.clone(true);
      tree.position.set(x, y, z);
      tree.rotation.y = Math.random() * Math.PI * 2;
      tree.scale.setScalar(0.8 + Math.random() * 0.4);
      scene.add(tree);
    });
  });

  // Animation lente de la caméra
  let time = 0;
  function animate() {
    requestAnimationFrame(animate);
    time += 0.004;
    camera.position.x = Math.sin(time * 0.3) * 5;
    camera.lookAt(0, 5, -150);
    renderer.render(scene, camera);
  }
  animate();
}