import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

let treeTemplate = null;
let ecoleTemplate = null;
const treeLoader = new GLTFLoader();
const platformeLoader = new GLTFLoader();
const bienvenueLoader = new GLTFLoader();
const gateLoader = new GLTFLoader();
const ecoleLoader = new GLTFLoader();
const tableauLoader = new GLTFLoader();

let welcomeSign = null;
let gate = null;
let tableaux = [];
let reseauxSociaux = [];
let boutonSol = null;
let signeAccueil = null;

let currentTableauIndex = 0;
const tableauData = [
    {
        title: "21 TOURS",
        description: "21 Tours est un jeu inspiré du jeu de cartes BlackJack. Nous avons repris le concept du BlackJack pour créer un jeu amusant que tu peux jouer avec tes amis, en lui donnant un design inspiré de UNO afin que le jeu ait un aspect plus convivial et amical",
        link: "https://www.behance.net/gallery/239349531/21-tours"
    },
    {
        title: "AIR PUCK",
        description: "Air Puck est un jeu 2D multijoueur local qui est inspiré du air hockey classique, où les joueurs s'affrontent dans des parties rapides et dynamique. La particularité d'Air Puck réside dans ses boosts spéciaux qui apparaissent pendant la partie.  ",
        link: "https://www.behance.net/gallery/235625175/Jeu-2D-Multijoueur-Local-en-quipe-AirPuck"
    },
    {
        title: "Conception et modélisation d'un véhicule 3D",
        description: "Dans le cadre du cours d'imagerie 3D, on a eu le mandat de créer un véhicule d'un peuple imaginaire.",
        link: "https://www.behance.net/gallery/221099111/Projet-Vhicule-3D"
    },
    {
        title: "Intemporel",
        description: "Intemporel est un jeu d'horreur narratif en solo où le joueur incarne un personnage drogué dans un bar et qui se réveille enfermé dans un lieu inconnu. Pris au piège, il est forcé de subir une série de tests mystérieux. ",
        link: "https://www.behance.net/gallery/221103843/Intemporel-Cration-De-Jeu-En-Equipe"
    }
];

/**
 * Affiche le popup d'instructions de bienvenue.
 *
 * @returns {void}
 *
 * @example
 * // Appelé quand le joueur clique sur le panneau de bienvenue
 * showInstructionsPopup();
 */
function showInstructionsPopup() {
    const popup = document.getElementById('instructions-popup');
    if (popup) {
        popup.classList.remove('hidden');
    }
}

/**
 * Cache le popup d'instructions de bienvenue.
 *
 * @returns {void}
 *
 * @example
 * // Appelé quand le joueur clique sur le bouton "Fermer"
 * hideInstructionsPopup();
 */
export function hideInstructionsPopup() {
    const popup = document.getElementById('instructions-popup');
    if (popup) {
        popup.classList.add('hidden');
    }
}

/**
 * Affiche le popup du signe d'accueil près de l'école.
 *
 * @returns {void}
 *
 * @example
 * showSignePopup();
 */
function showSignePopup() {
    const popup = document.getElementById('signe-popup');
    if (popup) popup.classList.remove('hidden');
}

/**
 * Cache le popup du signe d'accueil.
 *
 * @returns {void}
 *
 * @example
 * hideSignePopup();
 */
export function hideSignePopup() {
    const popup = document.getElementById('signe-popup');
    if (popup) popup.classList.add('hidden');
}

/**
 * Affiche le popup d'un tableau interactif avec son titre, sa description et son lien.
 *
 * @param {number} index - L'index du tableau dans le tableau tableauData (0 à 3).
 * @returns {void}
 *
 * @example
 * // Affiche les informations du premier projet
 * showTableauPopup(0);
 */
function showTableauPopup(index) {
    const popup = document.getElementById('tableau-popup');
    const title = document.getElementById('tableau-title');
    const description = document.getElementById('tableau-description');
    const link = document.getElementById('tableau-link');
    
    if (popup && title && description && link && tableauData[index]) {
        const data = tableauData[index];
        title.textContent = data.title;
        description.innerHTML = `<p>${data.description}</p>`;
        link.href = data.link;
        
        popup.querySelector('.tableau-content').setAttribute('data-tableau', index + 1);
        popup.classList.remove('hidden');
        console.log(`Showing tableau ${index + 1} popup`);
    }
}

/**
 * Cache le popup d'un tableau interactif.
 *
 * @returns {void}
 *
 * @example
 * hideTableauPopup();
 */
export function hideTableauPopup() {
    const popup = document.getElementById('tableau-popup');
    if (popup) {
        popup.classList.add('hidden');
    }
}

/**
 * Initialise l'environnement complet : plateforme, route, école, signalisation,
 * éclairage et tous les objets interactifs de la scène.
 *
 * @param {THREE.Scene} scene - La scène Three.js dans laquelle ajouter les objets.
 * @param {object} physics - Le moteur physique Rapier.
 * @param {THREE.Raycaster} raycaster - Le raycaster pour la détection de clics.
 * @param {THREE.Vector2} mouse - Les coordonnées normalisées de la souris.
 * @param {THREE.Camera} camera - La caméra principale de la scène.
 * @returns {void}
 *
 * @example
 * initEnvironment(scene, physics, raycaster, mouse, camera);
 */
export function initEnvironment(scene, physics, raycaster, mouse, camera) {
    if (!physics) return;

    platformeLoader.load('models/platforme.glb', (glb) => {
        const model = glb.scene;
        
        model.scale.setScalar(5);
        model.position.set(0, -1, -20);
        model.name = 'platforme';
        
        model.traverse(child => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                if (child.material) {
                    child.material.roughness = 0.8;
                    child.material.metalness = 0.1;
                    if (child.material.isMeshBasicMaterial) {
                        child.material = new THREE.MeshStandardMaterial({
                            color: child.material.color,
                            map: child.material.map,
                            emissive: new THREE.Color(0x222222),
                            emissiveIntensity: 0.1
                        });
                    }
                }
            }
        });
        scene.add(model);

        const originHelper = new THREE.AxesHelper(5);
        originHelper.position.copy(model.position);
        scene.add(originHelper);
        
        const pivotSphere = new THREE.Mesh(
            new THREE.SphereGeometry(0.5, 16, 16),
            new THREE.MeshBasicMaterial({ color: 0xff00ff, wireframe: true })
        );
        pivotSphere.position.copy(model.position);
        scene.add(pivotSphere);

        const box = new THREE.Box3().setFromObject(model);
        const size = new THREE.Vector3();
        box.getSize(size);
        const center = new THREE.Vector3();
        box.getCenter(center);

        const colliderGeometry = new THREE.BoxGeometry(size.x, size.y, size.z);
        const colliderMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xff0000, 
            wireframe: true, 
            visible: false
        });
        const colliderMesh = new THREE.Mesh(colliderGeometry, colliderMaterial);
        colliderMesh.position.copy(center);
        colliderMesh.userData.physics = { 
            mass: 0, 
            shape: 'box',
            size: { x: size.x, y: size.y, z: size.z }
        };
        scene.add(colliderMesh);
        
        if (physics.addMesh) {
            physics.addMesh(colliderMesh, 0, 0.8);
        }

    }, undefined, (error) => {
        console.error('GLB Load Failed:', error);
    });

    createRoad(scene, physics);
    createIntersection(scene, physics);

    bienvenueLoader.load('models/bienvenue.glb', (glb) => {
        const sign = glb.scene;
        sign.scale.setScalar(35);
        sign.position.set(0, 5, 20);
        sign.name = 'bienvenue';
        sign.rotation.y = Math.PI;
        
        welcomeSign = sign;
        sign.userData.isClickable = true;
        sign.position.y = -5;
        const targetY = -1;
        let startTime = performance.now();
        const riseDuration = 2000;

        function animateSign() {
            const elapsed = performance.now() - startTime;
            if (elapsed < riseDuration) {
                const t = 1 - Math.pow(1 - (elapsed / riseDuration), 3);
                sign.position.y = -5 + (targetY + 5) * t;
                requestAnimationFrame(animateSign);
            }
        }
        requestAnimationFrame(animateSign);

        sign.traverse(child => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                if (child.material) {
                    child.material.roughness = 0.8;
                    child.material.metalness = 0.1;
                    if (child.material.isMeshBasicMaterial) {
                        child.material = new THREE.MeshStandardMaterial({
                            color: child.material.color,
                            map: child.material.map,
                            emissive: new THREE.Color(0x222222),
                            emissiveIntensity: 0.1
                        });
                    }
                }
            }
        });
        scene.add(sign);
    }, undefined, (error) => {
        console.error('Welcome sign GLB Load Failed:', error);
    });

    gateLoader.load('models/frontgate.glb', (glb) => {
        const gateModel = glb.scene;
        gateModel.scale.setScalar(2);
        gateModel.position.set(8, 3, 55);
        gateModel.name = 'gate';
        
        gate = gateModel;
        gateModel.userData.isClickable = false;
        gateModel.position.y = -5;
        const targetY = -0.5;
        let startTime = performance.now();
        const riseDuration = 2000;

        function animateGate() {
            const elapsed = performance.now() - startTime;
            if (elapsed < riseDuration) {
                const t = 1 - Math.pow(1 - (elapsed / riseDuration), 3);
                gateModel.position.y = -5 + (targetY + 5) * t;
                requestAnimationFrame(animateGate);
            }
        }
        requestAnimationFrame(animateGate);

        gateModel.traverse(child => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                if (child.material) {
                    child.material.roughness = 0.8;
                    child.material.metalness = 0.1;
                    if (child.material.isMeshBasicMaterial) {
                        child.material = new THREE.MeshStandardMaterial({
                            color: child.material.color,
                            map: child.material.map,
                            emissive: new THREE.Color(0x222222),
                            emissiveIntensity: 0.1
                        });
                    }
                }
            }
        });
        scene.add(gateModel);
    }, undefined, (error) => {
        console.error('Gate GLB Load Failed:', error);
    });

    loadEcoleTemplate(scene, physics, () => {
        console.log('École Maisonneuve chargée et placée');
        createBoutonSol(scene, physics);
        createReseauxSociaux(scene, physics);
    });

    scene.background = new THREE.Color(0xe0f0ff);
    scene.fog = new THREE.FogExp2(0xe0f0ff, 0.01);

    const ambientLight = new THREE.AmbientLight(0x404060, 1.2);
    scene.add(ambientLight);
    
    const hemiLight = new THREE.HemisphereLight(0x88ccff, 0xcc9966, 1.5);
    hemiLight.position.set(0, 20, 0);
    scene.add(hemiLight);

    const sun = new THREE.DirectionalLight(0xffeedd, 2.2);
    sun.position.set(80, 150, 60);
    sun.castShadow = true;
    sun.shadow.camera.left = -100;
    sun.shadow.camera.right = 100;
    sun.shadow.camera.top = 100;
    sun.shadow.camera.bottom = -100;
    sun.shadow.camera.near = 50;
    sun.shadow.camera.far = 300;
    sun.shadow.mapSize.width = 4096;
    sun.shadow.mapSize.height = 4096;
    sun.shadow.bias = -0.0005;
    scene.add(sun);

    const fillLight = new THREE.DirectionalLight(0xaaccff, 1.0);
    fillLight.position.set(-50, 80, -50);
    scene.add(fillLight);

    const ecoleSpotLight = new THREE.SpotLight(0xffeedd, 1.5);
    ecoleSpotLight.position.set(0, 50, -150);
    ecoleSpotLight.target.position.set(0, 0, -210);
    ecoleSpotLight.angle = 0.5;
    ecoleSpotLight.penumbra = 0.2;
    ecoleSpotLight.decay = 1;
    ecoleSpotLight.distance = 200;
    scene.add(ecoleSpotLight);
    scene.add(ecoleSpotLight.target);

    const signeLoader = new GLTFLoader();
    signeLoader.load('models/signe.glb', (glb) => {
        const signe = glb.scene;
        signe.scale.setScalar(7);
        signe.position.set(10, 0, -265);
        signe.rotation.y = -Math.PI / 4;
        signe.name = 'signe-accueil';

        signeAccueil = signe;
        signe.userData.isClickable = true;

        const targetY = 0;
        let startTime = performance.now();
        const riseDuration = 2000;

        function animateSigne() {
            const elapsed = performance.now() - startTime;
            if (elapsed < riseDuration) {
                const t = 1 - Math.pow(1 - (elapsed / riseDuration), 3);
                signe.position.y = -5 + (targetY + 5) * t;
                requestAnimationFrame(animateSigne);
            } else {
                signe.position.y = targetY;
            }
        }
        requestAnimationFrame(animateSigne);

        signe.traverse(child => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                if (child.material) {
                    child.material.roughness = 0.8;
                    child.material.metalness = 0.1;
                }
            }
        });

        scene.add(signe);
    }, undefined, (error) => {
        console.error('Signe GLB Load Failed:', error);
    });
}

/**
 * Met à jour le curseur de la souris selon si elle survole un objet interactif.
 * Affiche un curseur "pointer" si un objet cliquable est détecté par le raycaster.
 *
 * @param {THREE.Raycaster} raycaster - Le raycaster utilisé pour détecter les intersections.
 * @param {THREE.Camera} camera - La caméra principale de la scène.
 * @param {THREE.Vector2} mouse - Les coordonnées normalisées de la souris.
 * @returns {void}
 *
 * @example
 * // Appelé à chaque frame dans la boucle d'animation
 * updateHoverCursor(raycaster, camera, mouse);
 */
export function updateHoverCursor(raycaster, camera, mouse) {
    let hovering = false;
    
    if (welcomeSign) {
        const signIntersects = raycaster.intersectObject(welcomeSign, true);
        if (signIntersects.length > 0) hovering = true;
    }
    
    if (gate && !hovering) {
        const gateIntersects = raycaster.intersectObject(gate, true);
        if (gateIntersects.length > 0) hovering = true;
    }
    
    if (signeAccueil && !hovering) {
        const signeIntersects = raycaster.intersectObject(signeAccueil, true);
        if (signeIntersects.length > 0) hovering = true;
    }

    if (!hovering) {
        for (let i = 0; i < tableaux.length; i++) {
            const tableau = tableaux[i];
            if (tableau.userData.isVisible) {
                const intersects = raycaster.intersectObject(tableau, true);
                if (intersects.length > 0) {
                    hovering = true;
                    break;
                }
            }

            for (let i = 0; i < reseauxSociaux.length; i++) {
                const intersects = raycaster.intersectObject(reseauxSociaux[i], true);
                if (intersects.length > 0) {
                    hovering = true;
                    break;
                }
            }
        }
    }
    
    if (boutonSol && !hovering) {
        const boutonIntersects = raycaster.intersectObject(boutonSol, true);
        if (boutonIntersects.length > 0) hovering = true;
    }
    
    if (document && document.body && document.body.style) {
        document.body.style.cursor = hovering ? 'pointer' : 'default';
    }
}

/**
 * Initialise les écouteurs de clics pour tous les objets interactifs de la scène :
 * panneau de bienvenue, signe d'accueil, tableaux de projets, bouton au sol et réseaux sociaux.
 *
 * @param {THREE.Camera} camera - La caméra principale utilisée pour le raycasting.
 * @param {THREE.Scene} scene - La scène Three.js contenant les objets interactifs.
 * @returns {void}
 *
 * @example
 * setupClickHandlers(camera, scene);
 */
export function setupClickHandlers(camera, scene) {
    window.addEventListener('click', (event) => {
        const mouse = new THREE.Vector2();
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, camera);

        if (welcomeSign) {
            const intersects = raycaster.intersectObject(welcomeSign, true);
            if (intersects.length > 0) {
                showInstructionsPopup();
                return;
            }
        }

        if (signeAccueil) {
            const intersects = raycaster.intersectObject(signeAccueil, true);
            if (intersects.length > 0) {
                showSignePopup();
                return;
            }
        }
        
        if (gate) {
            const intersects = raycaster.intersectObject(gate, true);
            if (intersects.length > 0) {
                console.log('Gate clicked!');
                return;
            }
        }
        
        if (tableaux.length > 0) {
            for (let i = 0; i < tableaux.length; i++) {
                const tableau = tableaux[i];
                if (tableau.userData.isVisible) {
                    const intersects = raycaster.intersectObject(tableau, true);
                    if (intersects.length > 0) {
                        showTableauPopup(tableau.userData.tableauIndex);
                        return;
                    }
                }
            }
        }
        
        if (boutonSol) {
            const intersects = raycaster.intersectObject(boutonSol, true);
            if (intersects.length > 0) {
                leverTousLesTableaux();
                return;
            }
        }

        const allObjects = scene.children;
        for (let i = 0; i < allObjects.length; i++) {
            const obj = allObjects[i];
            if (obj.userData.url) {
                const intersects = raycaster.intersectObject(obj, true);
                if (intersects.length > 0) {
                    window.open(obj.userData.url, '_blank');
                    return;
                }
            }
        }
    });

    document.addEventListener('click', (event) => {
        if (event.target.id === 'close-popup') hideInstructionsPopup();
        if (event.target.id === 'close-tableau-popup') hideTableauPopup();
        if (event.target.id === 'close-signe-popup') hideSignePopup();
    });
}

/**
 * Crée la route principale de la scène avec son mesh visuel, sa ligne centrale
 * et son collider physique.
 *
 * @param {THREE.Scene} scene - La scène Three.js dans laquelle ajouter la route.
 * @param {object} physics - Le moteur physique Rapier.
 * @returns {THREE.Mesh} Le mesh de la route créée.
 *
 * @example
 * const road = createRoad(scene, physics);
 */
function createRoad(scene, physics) {
    const roadLength = 350;
    const roadWidth = 10;
    const roadHeight = 0.3;
    
    const roadGeometry = new THREE.BoxGeometry(roadWidth, roadHeight, roadLength);
    const roadMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x2a2a2a,
        roughness: 0.7,
        metalness: 0.2,
        emissive: new THREE.Color(0x111111),
        emissiveIntensity: 0.1
    });
    
    const road = new THREE.Mesh(roadGeometry, roadMaterial);
    road.position.set(0, -0.4, -100);
    road.receiveShadow = true;
    road.castShadow = true;
    road.name = 'road';
    scene.add(road);
    
    const lineGeometry = new THREE.BoxGeometry(0.5, 0.2, roadLength);
    const lineMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xffdd44,
        emissive: 0xffaa00,
        emissiveIntensity: 0.8
    });
    
    const centerLine = new THREE.Mesh(lineGeometry, lineMaterial);
    centerLine.position.set(0, -0.3, -100);
    centerLine.receiveShadow = true;
    centerLine.castShadow = true;
    scene.add(centerLine);
    
    const roadCollider = new THREE.Mesh(
        new THREE.BoxGeometry(roadWidth, roadHeight, roadLength),
        new THREE.MeshStandardMaterial({ color: 0xff0000, wireframe: true, visible: false })
    );
    roadCollider.position.copy(road.position);
    roadCollider.name = 'road-collider';
    roadCollider.userData.physics = { 
        mass: 0, 
        shape: 'box',
        size: { x: roadWidth, y: roadHeight, z: roadLength }
    };
    scene.add(roadCollider);
    
    if (physics && physics.addMesh) {
        try {
            physics.addMesh(roadCollider, 0, 0.8);
        } catch (error) {
            console.error('Failed to add road collider:', error);
        }
    }
    
    return road;
}

/**
 * Crée l'intersection en T au bout de la route principale avec une place centrale
 * et deux routes perpendiculaires gauche et droite.
 *
 * @param {THREE.Scene} scene - La scène Three.js dans laquelle ajouter l'intersection.
 * @param {object} physics - Le moteur physique Rapier.
 * @returns {void}
 *
 * @example
 * createIntersection(scene, physics);
 */
function createIntersection(scene, physics) {
    const intersectionZ = -280;
    const roadWidth = 10;
    const roadHeight = 0.3;
    const placeSize = 15;
    
    const placeGeometry = new THREE.BoxGeometry(placeSize, roadHeight, placeSize);
    const placeMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x3a3a3a,
        roughness: 0.7,
        metalness: 0.2,
        emissive: new THREE.Color(0x111111),
        emissiveIntensity: 0.1
    });
    
    const place = new THREE.Mesh(placeGeometry, placeMaterial);
    place.position.set(0, -0.3, intersectionZ + placeSize/2);
    place.receiveShadow = true;
    place.castShadow = true;
    place.name = 'place';
    scene.add(place);
    
    const placeCollider = new THREE.Mesh(
        new THREE.BoxGeometry(placeSize, roadHeight, placeSize),
        new THREE.MeshStandardMaterial({ color: 0xff0000, wireframe: true, visible: false })
    );
    placeCollider.position.copy(place.position);
    placeCollider.name = 'place-collider';
    placeCollider.userData.physics = { mass: 0, shape: 'box' };
    scene.add(placeCollider);
    
    if (physics && physics.addMesh) {
        physics.addMesh(placeCollider, 0, 0.8);
    }
    
    createPerpendicularRoad(scene, physics, -placeSize/2 - roadWidth/2, intersectionZ + placeSize/2, 100, -Math.PI/2, 'left-road');
    createPerpendicularRoad(scene, physics,  placeSize/2 + roadWidth/2, intersectionZ + placeSize/2, 100,  Math.PI/2, 'right-road');
}

/**
 * Crée une route perpendiculaire à la route principale avec son mesh visuel,
 * sa ligne centrale et son collider physique.
 *
 * @param {THREE.Scene} scene - La scène Three.js dans laquelle ajouter la route.
 * @param {object} physics - Le moteur physique Rapier.
 * @param {number} centerX - La position X du centre de la route.
 * @param {number} centerZ - La position Z du centre de la route.
 * @param {number} length - La longueur de la route en unités.
 * @param {number} rotationY - L'angle de rotation Y de la route en radians.
 * @param {string} name - Le nom donné au mesh de la route.
 * @returns {THREE.Mesh} Le mesh de la route créée.
 *
 * @example
 * createPerpendicularRoad(scene, physics, -20, -280, 100, -Math.PI/2, 'left-road');
 */
function createPerpendicularRoad(scene, physics, centerX, centerZ, length, rotationY, name) {
    const roadWidth = 10;
    const roadHeight = 0.3;
    
    const roadGeometry = new THREE.BoxGeometry(roadWidth, roadHeight, length);
    const roadMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x2a2a2a,
        roughness: 0.7,
        metalness: 0.2
    });
    
    const road = new THREE.Mesh(roadGeometry, roadMaterial);
    road.position.set(centerX, -0.4, centerZ);
    road.rotation.y = rotationY;
    road.receiveShadow = true;
    road.castShadow = true;
    road.name = name;
    scene.add(road);
    
    const lineGeometry = new THREE.BoxGeometry(0.5, 0.2, length - 2);
    const lineMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xffdd44,
        emissive: 0xffaa00,
        emissiveIntensity: 0.8
    });
    
    const centerLine = new THREE.Mesh(lineGeometry, lineMaterial);
    centerLine.position.set(centerX, -0.3, centerZ);
    centerLine.rotation.y = rotationY;
    centerLine.receiveShadow = true;
    centerLine.castShadow = true;
    scene.add(centerLine);
    
    const roadCollider = new THREE.Mesh(
        new THREE.BoxGeometry(roadWidth, roadHeight, length),
        new THREE.MeshStandardMaterial({ color: 0xff0000, wireframe: true, visible: false })
    );
    roadCollider.position.copy(road.position);
    roadCollider.rotation.copy(road.rotation);
    roadCollider.name = `${name}-collider`;
    roadCollider.userData.physics = { mass: 0, shape: 'box' };
    scene.add(roadCollider);
    
    if (physics && physics.addMesh) {
        physics.addMesh(roadCollider, 0, 0.8);
    }
    
    return road;
}

/**
 * Crée le bouton rouge au sol à l'intérieur de l'école.
 * Quand le joueur clique dessus, les tableaux et réseaux sociaux montent du sol.
 *
 * @param {THREE.Scene} scene - La scène Three.js dans laquelle ajouter le bouton.
 * @param {object} physics - Le moteur physique Rapier.
 * @returns {void}
 *
 * @example
 * // Appelé automatiquement après le chargement de l'école
 * createBoutonSol(scene, physics);
 */
function createBoutonSol(scene, physics) {
    const boutonGeometry = new THREE.CylinderGeometry(2, 2, 0.5, 32);
    const boutonMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xff3333,
        emissive: 0x440000,
        emissiveIntensity: 0.5
    });
    
    boutonSol = new THREE.Mesh(boutonGeometry, boutonMaterial);
    boutonSol.position.set(-10, 0.2, -380);
    boutonSol.rotation.x = 0;
    boutonSol.name = 'bouton-sol';
    boutonSol.userData.isClickable = true;
    scene.add(boutonSol);
    
    const boutonCollider = new THREE.Mesh(
        new THREE.CylinderGeometry(2, 2, 0.5, 32),
        new THREE.MeshStandardMaterial({ color: 0xff0000, wireframe: true, visible: false })
    );
    boutonCollider.position.copy(boutonSol.position);
    boutonCollider.userData.physics = { mass: 0, shape: 'cylinder' };
    scene.add(boutonCollider);
    
    if (physics && physics.addMesh) {
        physics.addMesh(boutonCollider, 0, 0.8);
    }
}

/**
 * Crée un tableau interactif à la position donnée, caché sous terre au départ.
 * Le tableau monte quand le bouton au sol est activé.
 *
 * @param {THREE.Scene} scene - La scène Three.js dans laquelle ajouter le tableau.
 * @param {object} physics - Le moteur physique Rapier.
 * @param {THREE.Vector3} position - La position finale visible du tableau.
 * @param {number} [rotationY=0] - L'angle de rotation Y du tableau en radians.
 * @param {string|null} [imageUrl=null] - L'URL de l'image à afficher sur le tableau.
 * @param {number} [index=0] - L'index du tableau dans tableauData pour le popup.
 * @returns {void}
 *
 * @example
 * createTableauInteractif(scene, physics, new THREE.Vector3(-20, 0.2, -395), Math.PI/2, '/images/tableau1.jpg', 0);
 */
function createTableauInteractif(scene, physics, position, rotationY = 0, imageUrl = null, index = 0) {
    tableauLoader.load('models/tableau.glb', (glb) => {
        const tableau = glb.scene;
        tableau.scale.setScalar(4);

        const undergroundY = -20;
        const visibleY = position.y;

        tableau.position.set(position.x, undergroundY, position.z);
        tableau.rotation.y = rotationY;
        tableau.name = 'tableau';
        tableau.userData.visibleY = visibleY;
        tableau.userData.isVisible = false;
        tableau.userData.isClickable = true;
        tableau.userData.tableauIndex = index;

        if (imageUrl) {
            addImageToTableau(tableau, imageUrl);
        }

        tableau.traverse(child => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                if (child.material) {
                    child.material.roughness = 0.6;
                    child.material.metalness = 0.2;
                    if (child.material.isMeshBasicMaterial) {
                        child.material = new THREE.MeshStandardMaterial({
                            color: child.material.color,
                            map: child.material.map,
                            emissive: new THREE.Color(0x222222),
                            emissiveIntensity: 0.1
                        });
                    }
                }
            }
        });

        scene.add(tableau);
        tableaux.push(tableau);
    }, undefined, (error) => {
        console.error('Erreur chargement tableau:', error);
    });
}

/**
 * Ajoute une image sur la surface d'un tableau interactif via une texture canvas.
 *
 * @param {THREE.Object3D} tableau - Le mesh du tableau auquel ajouter l'image.
 * @param {string} imageUrl - L'URL de l'image à afficher sur le tableau.
 * @returns {void}
 *
 * @example
 * addImageToTableau(tableau, '/images/tableau1.jpg');
 */
function addImageToTableau(tableau, imageUrl) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 520;
    canvas.height = 500;

    let texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;

    const imageMaterial = new THREE.MeshStandardMaterial({
        map: texture,
        side: THREE.DoubleSide,
    });

    const pivot = new THREE.Group();
    pivot.position.set(0, 1.5, 0);
    pivot.rotation.y = Math.PI / 2;

    const imagePlane = new THREE.Mesh(
        new THREE.PlaneGeometry(3, 2),
        imageMaterial
    );
    imagePlane.position.set(0, 1, -0.1);
    pivot.add(imagePlane);
    tableau.add(pivot);

    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = imageUrl;
    img.onload = function() {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.save();
        ctx.scale(-1, 1);
        ctx.drawImage(img, -canvas.width, 0);
        ctx.restore();
        texture.needsUpdate = true;
    };
}

/**
 * Anime la montée de tous les tableaux et réseaux sociaux depuis sous terre
 * jusqu'à leur position visible. Fait également clignoter le bouton rouge.
 *
 * @returns {void}
 *
 * @example
 * // Appelé quand le joueur clique sur le bouton rouge au sol
 * leverTousLesTableaux();
 */
function leverTousLesTableaux() {
    tableaux.forEach(tableau => {
        if (!tableau.userData.isVisible) {
            const targetY = tableau.userData.visibleY;
            const startY = tableau.position.y;
            tableau.userData.isVisible = true;

            let startTime = performance.now();
            const duration = 2000;

            function animateTableau() {
                const elapsed = performance.now() - startTime;
                if (elapsed < duration) {
                    const t = 1 - Math.pow(1 - (elapsed / duration), 3);
                    tableau.position.y = startY + (targetY - startY) * t;
                    requestAnimationFrame(animateTableau);
                } else {
                    tableau.position.y = targetY;
                }
            }
            requestAnimationFrame(animateTableau);
        }
    });

    reseauxSociaux.forEach(reseau => {
        const targetY = reseau.userData.visibleY;
        const startY = reseau.position.y;

        let startTime = performance.now();
        const duration = 2000;

        function animateReseau() {
            const elapsed = performance.now() - startTime;
            if (elapsed < duration) {
                const t = 1 - Math.pow(1 - (elapsed / duration), 3);
                reseau.position.y = startY + (targetY - startY) * t;
                requestAnimationFrame(animateReseau);
            } else {
                reseau.position.y = targetY;
            }
        }
        requestAnimationFrame(animateReseau);
    });

    if (boutonSol) {
        const originalEmissive = boutonSol.material.emissive.clone();
        boutonSol.material.emissive.setHex(0xff0000);
        boutonSol.material.emissiveIntensity = 2;
        setTimeout(() => {
            boutonSol.material.emissive.copy(originalEmissive);
            boutonSol.material.emissiveIntensity = 0.5;
        }, 500);
    }
}

/**
 * Charge le modèle GLTF de l'école Maisonneuve, l'ajoute à la scène avec ses colliders
 * et crée les tableaux interactifs à l'intérieur.
 *
 * @param {THREE.Scene} scene - La scène Three.js dans laquelle ajouter l'école.
 * @param {object} physics - Le moteur physique Rapier.
 * @param {Function} callback - Fonction appelée une fois l'école chargée et placée.
 * @returns {void}
 *
 * @example
 * loadEcoleTemplate(scene, physics, () => {
 *   createBoutonSol(scene, physics);
 * });
 */
export function loadEcoleTemplate(scene, physics, callback) {
    ecoleLoader.load('models/maisonneuve6.glb', (glb) => {
        ecoleTemplate = glb.scene;
        ecoleTemplate.scale.setScalar(2);

        ecoleTemplate.traverse(child => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                if (child.material) {
                    const oldMat = child.material;
                    child.material = new THREE.MeshStandardMaterial({
                        map: oldMat.map,
                        color: oldMat.color,
                        roughness: 0.4,
                        metalness: 0.3,
                        emissive: new THREE.Color(0x333333),
                        emissiveIntensity: 0.2,
                        wireframe: false
                    });
                }
            }
        });

        const ecole = glb.scene;
        ecole.position.set(0, 0, -330);
        ecole.rotation.y = 0;
        ecole.name = 'maisonneuve';
        scene.add(ecole);

        const boundingBox = new THREE.Box3().setFromObject(ecole);
        const size = new THREE.Vector3();
        const center = new THREE.Vector3();
        boundingBox.getSize(size);
        boundingBox.getCenter(center);

        const pavementGeometry = new THREE.PlaneGeometry(size.x * 4, size.z * 1.5);
        const pavementMaterial = new THREE.MeshStandardMaterial({
            color: 0x4a4a4a,
            roughness: 0.8,
            metalness: 0.1,
            emissive: new THREE.Color(0x111111),
            emissiveIntensity: 0.1
        });
        const pavement = new THREE.Mesh(pavementGeometry, pavementMaterial);
        pavement.rotation.x = -Math.PI / 2;
        pavement.position.set(center.x, -0.3, center.z);
        pavement.receiveShadow = true;
        pavement.name = 'pavement-ecole';
        scene.add(pavement);

        createTableauInteractif(scene, physics, new THREE.Vector3(-20, 0.2, -395), Math.PI/2, 'images/tableau1.jpg', 0);
        createTableauInteractif(scene, physics, new THREE.Vector3(-42, 0.2, -395), Math.PI - Math.PI/4, 'images/tableau2.jpg', 1);
        createTableauInteractif(scene, physics, new THREE.Vector3(20, 0.2, -395), Math.PI/4, 'images/tableau3.jpg', 2);
        createTableauInteractif(scene, physics, new THREE.Vector3(0, 0.2, -395), Math.PI/2, 'images/tableau4.jpg', 3);

        const leftWall = new THREE.Mesh(
            new THREE.BoxGeometry(2, size.y, size.z * 0.6),
            new THREE.MeshStandardMaterial({ color: 0xff0000, wireframe: true, visible: false })
        );
        leftWall.position.set(center.x - size.x/2 + 1, center.y, center.z);
        leftWall.userData.physics = { mass: 0, shape: 'box' };
        scene.add(leftWall);

        const rightWall = new THREE.Mesh(
            new THREE.BoxGeometry(2, size.y, size.z * 0.6),
            new THREE.MeshStandardMaterial({ color: 0xff0000, wireframe: true, visible: false })
        );
        rightWall.position.set(center.x + size.x/2 - 1, center.y, center.z);
        rightWall.userData.physics = { mass: 0, shape: 'box' };
        scene.add(rightWall);

        const backWall = new THREE.Mesh(
            new THREE.BoxGeometry(size.x * 0.9, size.y, 2),
            new THREE.MeshStandardMaterial({ color: 0xff0000, wireframe: true, visible: false })
        );
        backWall.position.set(center.x, center.y, center.z - size.z/2 + 1);
        backWall.userData.physics = { mass: 0, shape: 'box' };
        scene.add(backWall);

        const floor = new THREE.Mesh(
            new THREE.BoxGeometry(size.x * 0.9, 1, size.z * 0.9),
            new THREE.MeshStandardMaterial({ color: 0x00ff00, wireframe: true, visible: false })
        );
        floor.position.set(center.x, center.y - size.y/2 - 0.1, center.z);
        floor.userData.physics = { mass: 0, shape: 'box' };
        scene.add(floor);

        if (physics && physics.addMesh) {
            try {
                physics.addMesh(leftWall, 0, 0.8);
                physics.addMesh(rightWall, 0, 0.8);
                physics.addMesh(backWall, 0, 0.8);
                physics.addMesh(floor, 0, 0.8);
            } catch (error) {
                console.error('Erreur colliders:', error);
            }
        }

        if (callback) callback();

    }, (progress) => {
        console.log('Chargement en cours:', (progress.loaded / progress.total * 100) + '%');
    }, (error) => {
        console.error('École Maisonneuve GLB Load Failed:', error);
    });
}

/**
 * Charge et place les icônes 3D des réseaux sociaux (LinkedIn, GitHub, Behance)
 * à l'intérieur de l'école, cachés sous terre jusqu'à l'activation du bouton.
 *
 * @param {THREE.Scene} scene - La scène Three.js dans laquelle ajouter les icônes.
 * @param {object} physics - Le moteur physique Rapier.
 * @returns {void}
 *
 * @example
 * // Appelé automatiquement après le chargement de l'école
 * createReseauxSociaux(scene, physics);
 */
function createReseauxSociaux(scene, physics) {
    const loader = new GLTFLoader();

    const reseaux = [
        { file: 'models/linkedin.glb', position: new THREE.Vector3(-40, 0, -405), rotation: Math.PI / 4,  url: 'https://www.linkedin.com/in/tanhanson/' },
        { file: 'models/github.glb',   position: new THREE.Vector3(-10, 0, -405), rotation: 0,            url: 'https://github.com/tanhanson' },
        { file: 'models/behance.glb',  position: new THREE.Vector3( 20, 0, -405), rotation: -Math.PI / 4, url: 'https://www.behance.net/hansontan4' }
    ];

    reseaux.forEach(({ file, position, rotation, url }) => {
        loader.load(file, (glb) => {
            const group = new THREE.Group();
            group.position.set(position.x, -10, position.z);
            group.rotation.y = rotation;
            group.userData.isClickable = true;
            group.userData.url = url;
            group.userData.visibleY = position.y;

            const model = glb.scene;
            model.scale.setScalar(2);
            model.castShadow = true;

            model.traverse(child => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });

            group.add(model);
            scene.add(group);
            reseauxSociaux.push(group);

            const collider = new THREE.Mesh(
                new THREE.BoxGeometry(2, 4, 2),
                new THREE.MeshStandardMaterial({ visible: false })
            );
            collider.position.set(position.x, position.y + 2, position.z);
            collider.userData.physics = { mass: 0, shape: 'box' };
            scene.add(collider);
            if (physics && physics.addMesh) physics.addMesh(collider, 0, 0.8);

        }, undefined, (error) => {
            console.error(`Erreur chargement ${file}:`, error);
        });
    });
}