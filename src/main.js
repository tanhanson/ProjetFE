import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { RapierPhysics } from 'three/examples/jsm/physics/RapierPhysics';
import Stats from 'three/examples/jsm/libs/stats.module';
import { Car, CarCamera } from './car.js';
import { initEnvironment, updateHoverCursor, setupClickHandlers, hideInstructionsPopup, hideTableauPopup, hideSignePopup } from './environment.js';

import { createBowlingGame, updateBowling,  } from './bowling.js';
import { loadTreeTemplate, spawnForest } from './forest.js';
import RAPIER from '@dimforge/rapier3d-compat';

// Variables globales
let camera, scene, renderer, stats, controls, physics;
let car, carCamera;
let freeCameraMode = false; // Bascule pour le mode OrbitControls
let cameraSubMode = 0; // 0 = suivre, 1 = première personne (utilisé uniquement en mode non-orbit)
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

/**
 * Alterne le mode de caméra entre le mode libre (OrbitControls)
 * et le mode voiture (follow ou première personne).
 *
 * @returns {void}
 *
 * @example
 * // Touche C enfoncée → change le mode de caméra
 * toggleCameraMode();
 */
function toggleCameraMode() {
    if (!freeCameraMode) {
        // Passer en mode caméra libre
        freeCameraMode = true;
        controls.enabled = true;
        if (car) {
            controls.target.copy(car.getPosition());
        }
        controls.update();
    } else {
        // Retourner en mode caméra voiture
        freeCameraMode = false;
        controls.enabled = false;
        
        // Alterner entre les sous-modes de caméra voiture
        if (carCamera) {
            cameraSubMode = carCamera.toggleMode();
        }
    }
}

/**
 * Alterne entre le mode follow et le mode première personne
 * sans passer par les OrbitControls.
 *
 * @returns {void}
 *
 * @example
 * // Touche V enfoncée → change entre follow et première personne
 * toggleCarCameraMode();
 */
function toggleCarCameraMode() {
    if (!freeCameraMode && carCamera) {
        cameraSubMode = carCamera.toggleMode();
    }
}

/**
 * Initialise toute l'application : scène, caméra, rendu, physique,
 * environnement, voiture, forêt, bowling et les écouteurs d'événements.
 *
 * @returns {void}
 *
 * @example
 * // Appelé au chargement de la page
 * await init();
 */
async function init() {
    // Initialisation de la scène
    scene = new THREE.Scene();
    
    // Caméra
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 4, 10);
    
    // Rendu
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    document.getElementById('root').appendChild(renderer.domElement);

    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    
    // Contrôles — désactivés au départ pour la caméra follow
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enabled = false;
    controls.target.set(0, 2, 0);
    controls.update();
    
    // Statistiques de performance
    stats = new Stats();
    document.body.appendChild(stats.dom);
    
    // Physique
    physics = await RapierPhysics();
    physics.addScene(scene);
    
    // Initialisation de l'environnement
    initEnvironment(scene, physics, raycaster, mouse, camera);

    // Initialisation des gestionnaires de clics
    setupClickHandlers(camera, scene);
    
    // Chargement du template d'arbre et génération de la forêt
    loadTreeTemplate(scene, physics, () => {
        spawnForest(50, scene, physics);
    });
    
    // Création de la voiture
    car = new Car(scene, physics);
    car.create();
    car.setupControls();
    
    // Caméra qui suit la voiture
    carCamera = new CarCamera(camera, car, controls);
    
    // Écouteur de redimensionnement de fenêtre
    window.addEventListener('resize', onWindowResize);
    
    // Mise à jour de la position de la souris pour le raycasting
    window.addEventListener('mousemove', (event) => {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    });
    
    // Touches clavier pour changer de mode de caméra
    window.addEventListener('keydown', (event) => {
        if (event.key === 'c' || event.key === 'C') {
            toggleCameraMode();
        }
        // Touche V pour alterner entre follow et première personne
        if (event.key === 'v' || event.key === 'V') {
            toggleCarCameraMode();
        }
    });

    // Création du jeu de bowling
    createBowlingGame(scene, physics);

    // Lancement de la boucle d'animation
    animate();
}

/**
 * Boucle d'animation principale. Met à jour la physique de la voiture,
 * la caméra, le bowling, le raycaster et lance le rendu à chaque frame.
 *
 * @returns {void}
 *
 * @example
 * // Appelée automatiquement par init()
 * animate();
 */
function animate() {
    requestAnimationFrame(animate);
    
    // Mise à jour de la voiture
    if (car) {
        updateBowling(car.getPosition());
        car.updateControl();
        if (car.vehicleController) {
            car.vehicleController.updateVehicle(1 / 60);
            car.updateWheels();
        }
    }
    
    // Mise à jour de la caméra — uniquement en mode voiture
    if (!freeCameraMode && carCamera) {
        carCamera.update();
    }
    
    // Mise à jour du curseur au survol des objets interactifs
    raycaster.setFromCamera(mouse, camera);
    updateHoverCursor(raycaster, camera, mouse);
    
    // Rendu de la scène
    renderer.render(scene, camera);
    stats.update();
}

/**
 * Redimensionne la caméra et le rendu quand la fenêtre change de taille.
 *
 * @returns {void}
 *
 * @example
 * // Appelée automatiquement par l'écouteur resize
 * onWindowResize();
 */
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Fermer les popups avec la touche Escape
window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        hideInstructionsPopup();
        hideTableauPopup();
        hideSignePopup();
    }
});

export { init };