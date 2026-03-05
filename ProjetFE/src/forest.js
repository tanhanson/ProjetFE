import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

let treeTemplate = null;
const treeLoader = new GLTFLoader();

const TREE_ZONES = [
    { center: new THREE.Vector3(-25, 0, -100), width: 30, depth: 220 },
    { center: new THREE.Vector3(25, 0, -100),  width: 30, depth: 220 },
    { center: new THREE.Vector3(0, 0, -20),    width: 80, depth: 40  },
    { center: new THREE.Vector3(0, 0, -220),   width: 80, depth: 60  }
];

/**
 * Charge le modèle GLTF de l'arbre et le stocke comme template réutilisable.
 * Applique un matériau MeshStandardMaterial sur chaque mesh du modèle.
 *
 * @param {THREE.Scene} scene - La scène Three.js dans laquelle les arbres seront ajoutés.
 * @param {object} physics - Le moteur physique Rapier.
 * @param {Function} callback - Fonction appelée une fois le template chargé.
 * @returns {void}
 *
 * @example
 * loadTreeTemplate(scene, physics, () => {
 *   spawnForest(200, scene, physics);
 * });
 */
export function loadTreeTemplate(scene, physics, callback) {
    treeLoader.load('models/tree.glb', (glb) => {
        treeTemplate = glb.scene;
        treeTemplate.scale.setScalar(1);

        treeTemplate.traverse(child => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                if (child.material) {
                    const oldMat = child.material;
                    child.material = new THREE.MeshStandardMaterial({
                        map: oldMat.map,
                        color: oldMat.color,
                        roughness: 0.7,
                        metalness: 0.1,
                        emissive: new THREE.Color(0x111111),
                        emissiveIntensity: 0.1
                    });
                    if (child.material.color.r === 0) {
                        child.material.color.setHex(0x8B4513);
                    }
                }
            }
        });

        if (callback) callback();
    });
}

/**
 * Ajoute un collider cylindrique invisible au tronc d'un arbre pour les collisions physiques.
 *
 * @param {THREE.Object3D} tree - Le mesh de l'arbre auquel attacher le collider.
 * @param {object} physics - Le moteur physique Rapier.
 * @param {THREE.Scene} scene - La scène Three.js dans laquelle ajouter le collider.
 * @returns {void}
 *
 * @example
 * // Appelé automatiquement par spawnTree()
 * addTreeCollider(tree, physics, scene);
 */
function addTreeCollider(tree, physics, scene) {
    const colliderMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.5, 0.5, 3, 8),
        new THREE.MeshStandardMaterial({ visible: false })
    );
    colliderMesh.position.copy(tree.position);
    colliderMesh.position.y += 1.5;
    scene.add(colliderMesh);
    physics.addMesh(colliderMesh, 0);
}

/**
 * Clone le template d'arbre, le place à la position donnée avec une rotation
 * et une échelle aléatoires, puis lui ajoute un collider physique.
 *
 * @param {THREE.Vector3} position - La position mondiale où placer l'arbre.
 * @param {THREE.Scene} scene - La scène Three.js dans laquelle ajouter l'arbre.
 * @param {object} physics - Le moteur physique Rapier.
 * @returns {THREE.Object3D|null} Le mesh de l'arbre ajouté, ou null si le template n'est pas chargé.
 *
 * @example
 * const tree = spawnTree(new THREE.Vector3(10, 0, -50), scene, physics);
 */
export function spawnTree(position, scene, physics) {
    if (!treeTemplate) return null;

    const tree = treeTemplate.clone(true);
    tree.position.copy(position);
    tree.rotation.y = Math.random() * Math.PI * 2;
    const scale = 0.8 + Math.random() * 0.4;
    tree.scale.multiplyScalar(scale);

    scene.add(tree);
    addTreeCollider(tree, physics, scene);
    return tree;
}

/**
 * Génère un nombre aléatoire entre deux valeurs.
 *
 * @param {number} min - La valeur minimale.
 * @param {number} max - La valeur maximale.
 * @returns {number} Un nombre aléatoire entre min et max.
 *
 * @example
 * // Retourne un nombre entre -5 et 5
 * const val = randomInRange(-5, 5);
 */
function randomInRange(min, max) {
    return Math.random() * (max - min) + min;
}

/**
 * Crée une forêt dense en plaçant des arbres en rangées régulières
 * de chaque côté de la route, avec une variation aléatoire de position.
 *
 * @param {THREE.Scene} scene - La scène Three.js dans laquelle ajouter les arbres.
 * @param {object} physics - Le moteur physique Rapier.
 * @param {number} [density=200] - Le nombre d'arbres supplémentaires à placer aléatoirement.
 * @returns {void}
 *
 * @example
 * createDenseForest(scene, physics, 200);
 */
export function createDenseForest(scene, physics, density = 200) {
    if (!treeTemplate) return;

    const roadStartZ = -240;
    const roadEndZ = 20;
    const forestWidth = 110;
    const treesPerRow = 15;
    const rows = 30;

    for (let row = 0; row < rows; row++) {
        const t = row / (rows - 1);
        const z = roadStartZ + (roadEndZ - roadStartZ) * t;

        for (let i = 0; i < treesPerRow; i++) {
            const x = -forestWidth/2 + (i / (treesPerRow - 1)) * forestWidth;
            if (Math.abs(x) < 8) continue;

            const position = new THREE.Vector3(
                x + (Math.random() - 0.5) * 8,
                0,
                z + (Math.random() - 0.5) * 8
            );

            if (Math.random() > 0.3) {
                const tree = spawnTree(position, scene, physics);
                if (tree) {
                    tree.rotation.y = Math.random() * Math.PI * 2;
                    tree.scale.multiplyScalar(0.6 + Math.random() * 0.8);
                }
            }
        }
    }

    for (let i = 0; i < density; i++) {
        const x = (Math.random() - 0.5) * forestWidth;
        if (Math.abs(x) < 8) continue;

        const z = roadStartZ + Math.random() * (roadEndZ - roadStartZ);
        spawnTree(new THREE.Vector3(x, 0, z), scene, physics);
    }
}

/**
 * Crée une forêt naturelle en regroupant les arbres en clusters organiques
 * de chaque côté de la route, avec une distribution aléatoire supplémentaire.
 *
 * @param {THREE.Scene} scene - La scène Three.js dans laquelle ajouter les arbres.
 * @param {object} physics - Le moteur physique Rapier.
 * @param {number} [density=250] - Le nombre d'arbres supplémentaires distribués aléatoirement.
 * @returns {void}
 *
 * @example
 * createNaturalForest(scene, physics, 250);
 */
export function createNaturalForest(scene, physics, density = 250) {
    if (!treeTemplate) return;

    const roadStartZ = -250;
    const roadEndZ = 20;
    const forestLeft =  { min: -100, max: -12 };
    const forestRight = { min: 12,   max: 100 };
    const numClusters = 30;

    for (let cluster = 0; cluster < numClusters; cluster++) {
        const side = Math.random() > 0.5 ? forestLeft : forestRight;
        const centerX = side.min + Math.random() * (side.max - side.min);
        const centerZ = roadStartZ + Math.random() * (roadEndZ - roadStartZ);
        const clusterSize = 5 + Math.random() * 10;
        const treeCount = 5 + Math.floor(Math.random() * 15);

        for (let i = 0; i < treeCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * clusterSize;
            const x = centerX + Math.cos(angle) * radius;
            const z = centerZ + Math.sin(angle) * radius;

            if ((side === forestLeft && x > -8) || (side === forestRight && x < 8)) continue;

            const tree = spawnTree(new THREE.Vector3(x, 0, z), scene, physics);
            if (tree) {
                tree.rotation.y = Math.random() * Math.PI * 2;
                tree.scale.multiplyScalar(0.7 + Math.random() * 0.8);
            }
        }
    }

    for (let i = 0; i < density; i++) {
        const side = Math.random() > 0.5 ? -1 : 1;
        const x = side * (12 + Math.random() * 38);
        const z = roadStartZ + Math.random() * (roadEndZ - roadStartZ);
        spawnTree(new THREE.Vector3(x, 0, z), scene, physics);
    }
}

/**
 * Génère l'ensemble de la forêt en combinant une forêt dense et des arbres
 * supplémentaires dans les zones prédéfinies (TREE_ZONES).
 *
 * @param {number} [count=200] - Le nombre total d'arbres à générer.
 * @param {THREE.Scene} scene - La scène Three.js dans laquelle ajouter les arbres.
 * @param {object} physics - Le moteur physique Rapier.
 * @returns {void}
 *
 * @example
 * spawnForest(200, scene, physics);
 */
export function spawnForest(count = 200, scene, physics) {
    if (!treeTemplate) return;

    createDenseForest(scene, physics, count);

    const extraTrees = Math.floor(count * 0.2);
    TREE_ZONES.forEach(zone => {
        for (let i = 0; i < Math.ceil(extraTrees / TREE_ZONES.length); i++) {
            const position = new THREE.Vector3(
                zone.center.x + randomInRange(-zone.width / 2, zone.width / 2),
                0,
                zone.center.z + randomInRange(-zone.depth / 2, zone.depth / 2)
            );
            if (Math.abs(position.x) < 8) continue;
            spawnTree(position, scene, physics);
        }
    });
}