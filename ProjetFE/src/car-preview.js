import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export function initCarPreview(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setSize(canvas.clientWidth, canvas.clientHeight);
  

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(45, canvas.clientWidth / canvas.clientHeight, 0.1, 100);
  camera.position.set(4, 2, 1);

  // Lumières
  
  const dirLight = new THREE.DirectionalLight(0xffffff, 2);
  dirLight.position.set(5, 10, 5);
  scene.add(dirLight);

  // L'utilisateur peut controler la rotation de la voiture
  const controls = new OrbitControls(camera, canvas);
  controls.enableZoom = false;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 2;

  // Charger le modèle
  const loader = new GLTFLoader();
  loader.load('models/voiture.glb', (glb) => {
    const model = glb.scene;
    model.scale.setScalar(1);
    model.position.set(0,0,0);
    scene.add(model);
  });

  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  }

  animate();
}