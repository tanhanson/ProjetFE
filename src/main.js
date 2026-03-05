import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { RapierPhysics } from 'three/examples/jsm/physics/RapierPhysics';
import Stats from 'three/examples/jsm/libs/stats.module';
import { Car, CarCamera } from './car.js';
import { initEnvironment, updateHoverCursor, setupClickHandlers, hideInstructionsPopup, hideTableauPopup, hideSignePopup } from './environment.js';

import { createBowlingGame, updateBowling,  } from './bowling.js';
import { loadTreeTemplate, spawnForest } from './forest.js';


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
        if (car && car.getPosition) {
            controls.target.copy(car.getPosition());
        }
        controls.update();
    } else {
        // Retourner en mode caméra voiture
        freeCameraMode = false;
        controls.enabled = false;
        
        // Alterner entre les sous-modes de caméra voiture
        if (carCamera && carCamera.toggleMode) {
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
    if (document && document.body) {
        document.body.appendChild(stats.dom);
    } else {
        console.warn('document.body not available, stats widget not added');
    }
    
    // Physique
    physics = await RapierPhysics();
    console.log('RapierPhysics initialized:', physics);
    console.log('Physics keys:', Object.keys(physics).slice(0, 20));
    
    physics.addScene(scene);
    console.log('Physics world after addScene:', physics.world ? 'EXISTS' : 'UNDEFINED');
    console.log('Physics object after addScene:', physics);
    
    // Initialisation de l'environnement
    initEnvironment(scene, physics, raycaster, mouse, camera);

    // Initialisation des gestionnaires de clics
    setupClickHandlers(camera, scene);
    
    // Chargement du template d'arbre et génération de la forêt
    loadTreeTemplate(scene, physics, () => {
        spawnForest(50, scene, physics);
    });
    
    // Création de la voiture - avec vérification que la physique est prête
    if (physics && physics.world && physics.addMesh) {
        car = new Car(scene, physics);
        car.create();
        
        if (car.chassis && car.vehicleController) {
            car.setupControls();
            // Caméra qui suit la voiture
            carCamera = new CarCamera(camera, car, controls);
        } else {
            console.error('Car creation failed - chassis or vehicleController not initialized');
        }
    } else {
        console.error('Physics world not properly initialized');
    }
    
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

    // Création du jeu de bowling - avec délai pour s'assurer que le monde physique est prêt
    setTimeout(() => {
        if (physics && physics.world) {
            console.log('Physics world ready, creating bowling game');
            createBowlingGame(scene, physics);
        } else {
            console.error('Bowling game not created - physics world still not initialized after delay');
            console.log('Physics state:', { physics: !!physics, world: physics ? !!physics.world : 'N/A' });
        }
    }, 1000);

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
    if (car && car.getPosition && car.updateControl) {
        try {
            updateBowling(car.getPosition());
            car.updateControl();
            if (car.vehicleController) {
                car.vehicleController.updateVehicle(1 / 60);
                car.updateWheels();
            }
        } catch (error) {
            console.error('Error in car update:', error);
        }
    }
    
    // Mise à jour de la caméra — uniquement en mode voiture
    if (!freeCameraMode && carCamera && carCamera.update) {
        try {
            carCamera.update();
        } catch (error) {
            console.error('Error in camera update:', error);
        }
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