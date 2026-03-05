import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

let bowlingObjects = [];
let bowlingBall = null;
let scene, physics;

const BOWLING_CENTER = new THREE.Vector3(60, -0.5, -330);
const SCALE = 3;

/**
 * Initialise le jeu de bowling en créant la piste, les quilles et la balle.
 *
 * @param {THREE.Scene} sceneRef - La scène Three.js dans laquelle ajouter les objets.
 * @param {object} physicsRef - Le moteur physique Rapier utilisé pour les collisions.
 * @returns {void}
 *
 * @example
 * createBowlingGame(scene, physics);
 */
export function createBowlingGame(sceneRef, physicsRef) {
    scene = sceneRef;
    physics = physicsRef;
    
    if (!physics || !physics.world) {
        console.error('Cannot create bowling game - physics world not initialized');
        return;
    }
    
    createBowlingLane();
    loadQuilles();
    loadBall();
}

/**
 * Met à jour la position visuelle de la balle et des quilles à chaque frame
 * en synchronisant les meshes Three.js avec les corps physiques Rapier.
 * Détecte également la collision entre la voiture et la balle pour lui appliquer une force.
 *
 * @param {THREE.Vector3} carPosition - La position actuelle de la voiture dans la scène.
 * @returns {void}
 *
 * @example
 * // Appelé à chaque frame dans la boucle d'animation
 * updateBowling(car.getPosition());
 */
export function updateBowling(carPosition) {
    // Sync visuel balle
    if (bowlingBall && bowlingBall.model && bowlingBall.rigidBody) {
        const t = bowlingBall.rigidBody.translation();
        const r = bowlingBall.rigidBody.rotation();
        bowlingBall.model.position.set(t.x, t.y, t.z);
        bowlingBall.model.quaternion.set(r.x, r.y, r.z, r.w);

        // Détecter collision voiture → balle
        if (carPosition && bowlingBall.rigidBody) {
            const ballPos = bowlingBall.rigidBody.translation();
            const dist = carPosition.distanceTo(new THREE.Vector3(ballPos.x, ballPos.y, ballPos.z));

            if (dist < 3) {
                const direction = new THREE.Vector3(
                    ballPos.x - carPosition.x,
                    0,
                    ballPos.z - carPosition.z
                ).normalize();

                const force = 50;
                bowlingBall.rigidBody.setLinvel({
                    x: direction.x * force,
                    y: 1,
                    z: direction.z * force
                }, true);
            }
        }
    }

    // Sync visuel quilles
    bowlingObjects.forEach(obj => {
        if (obj.model && obj.rigidBody) {
            const t = obj.rigidBody.translation();
            const r = obj.rigidBody.rotation();
            obj.model.position.set(t.x, t.y, t.z);
            obj.model.quaternion.set(r.x, r.y, r.z, r.w);
        }
    });
}

/**
 * Crée la piste de bowling avec son plancher et ses deux murs latéraux.
 * Chaque élément a un mesh visuel et un collider physique invisible.
 *
 * @returns {void}
 *
 * @example
 * // Appelé automatiquement par createBowlingGame()
 * createBowlingLane();
 */
function createBowlingLane() {
    const laneWidth = 6 * SCALE;
    const laneLength = 25 * SCALE;
    const laneHeight = 0.2 * SCALE;
    const wallHeight = 1 * SCALE;
    const wallThickness = 0.3 * SCALE;

    // Plancher
    const lane = new THREE.Mesh(
        new THREE.BoxGeometry(laneWidth, laneHeight, laneLength),
        new THREE.MeshStandardMaterial({ color: 0xc8a96e, roughness: 0.5 })
    );
    lane.position.copy(BOWLING_CENTER);
    lane.receiveShadow = true;
    scene.add(lane);

    const laneCollider = new THREE.Mesh(
        new THREE.BoxGeometry(laneWidth, laneHeight, laneLength),
        new THREE.MeshStandardMaterial({ visible: false })
    );
    laneCollider.position.copy(lane.position);
    laneCollider.userData.physics = { mass: 0, shape: 'box' };
    scene.add(laneCollider);
    if (physics && physics.addMesh) physics.addMesh(laneCollider, 0, 0.3);

    // Mur gauche
    const leftWall = new THREE.Mesh(
        new THREE.BoxGeometry(wallThickness, wallHeight, laneLength),
        new THREE.MeshStandardMaterial({ color: 0xa0785a, roughness: 0.6 })
    );
    leftWall.position.set(
        BOWLING_CENTER.x - laneWidth / 2,
        BOWLING_CENTER.y + wallHeight / 2,
        BOWLING_CENTER.z
    );
    scene.add(leftWall);

    const leftWallCollider = new THREE.Mesh(
        new THREE.BoxGeometry(wallThickness, wallHeight, laneLength),
        new THREE.MeshStandardMaterial({ visible: false })
    );
    leftWallCollider.position.copy(leftWall.position);
    leftWallCollider.userData.physics = { mass: 0, shape: 'box' };
    scene.add(leftWallCollider);
    if (physics && physics.addMesh) physics.addMesh(leftWallCollider, 0, 0.3);

    // Mur droit
    const rightWall = new THREE.Mesh(
        new THREE.BoxGeometry(wallThickness, wallHeight, laneLength),
        new THREE.MeshStandardMaterial({ color: 0xa0785a, roughness: 0.6 })
    );
    rightWall.position.set(
        BOWLING_CENTER.x + laneWidth / 2,
        BOWLING_CENTER.y + wallHeight / 2,
        BOWLING_CENTER.z
    );
    scene.add(rightWall);

    const rightWallCollider = new THREE.Mesh(
        new THREE.BoxGeometry(wallThickness, wallHeight, laneLength),
        new THREE.MeshStandardMaterial({ visible: false })
    );
    rightWallCollider.position.copy(rightWall.position);
    rightWallCollider.userData.physics = { mass: 0, shape: 'box' };
    scene.add(rightWallCollider);
    if (physics && physics.addMesh) physics.addMesh(rightWallCollider, 0, 0.3);
}

/**
 * Charge le modèle GLTF de la balle de bowling, crée son collider sphérique
 * et l'associe à son corps physique Rapier après un délai d'initialisation.
 *
 * @returns {void}
 *
 * @example
 * // Appelé automatiquement par createBowlingGame()
 * loadBall();
 */
function loadBall() {
    const loader = new GLTFLoader();
    loader.load('models/ball.glb', (glb) => {
        const model = glb.scene;
        model.scale.setScalar(SCALE);
        model.position.set(BOWLING_CENTER.x, BOWLING_CENTER.y + 0.3 * SCALE, BOWLING_CENTER.z + 8 * SCALE);
        model.castShadow = true;
        scene.add(model);

        const collider = new THREE.Mesh(
            new THREE.SphereGeometry(0.2 * SCALE, 16, 16),
            new THREE.MeshStandardMaterial({ visible: false })
        );
        collider.position.copy(model.position);
        collider.userData.physics = { mass: 2, shape: 'sphere' };
        scene.add(collider);
        if (physics && physics.addMesh) physics.addMesh(collider, 2, 0.2);

        setTimeout(() => {
            console.log('Tous les bodies dans Rapier:');
            if (physics && physics.world && physics.world.bodies) {
                physics.world.bodies.forEach(body => {
                    const t = body.translation();
                    console.log(`Body - pos: ${t.x.toFixed(1)}, ${t.y.toFixed(1)}, ${t.z.toFixed(1)} - type: ${body.bodyType()}`);
                    const dist = Math.abs(t.x - collider.position.x) + Math.abs(t.z - collider.position.z);
                    if (dist < 1) bowlingBall = { model, collider, rigidBody: body };
                });
            } else {
                console.warn('Physics world not yet initialized for bowling ball');
            }
        }, 500);
    });
}

/**
 * Charge les 10 quilles de bowling en formation triangulaire, crée leurs colliders
 * cylindriques et les associe à leurs corps physiques Rapier après un délai d'initialisation.
 *
 * @returns {void}
 *
 * @example
 * // Appelé automatiquement par createBowlingGame()
 * loadQuilles();
 */
function loadQuilles() {
    const loader = new GLTFLoader();
    const positions = [
        { x: -1.5 * SCALE, z: -6 * SCALE }, { x: -0.5 * SCALE, z: -6 * SCALE },
        { x:  0.5 * SCALE, z: -6 * SCALE }, { x:  1.5 * SCALE, z: -6 * SCALE },
        { x: -1 * SCALE,   z: -4.5 * SCALE }, { x: 0, z: -4.5 * SCALE },
        { x:  1 * SCALE,   z: -4.5 * SCALE },
        { x: -0.5 * SCALE, z: -3 * SCALE }, { x: 0.5 * SCALE, z: -3 * SCALE },
        { x: 0,            z: -1.5 * SCALE }
    ];

    positions.forEach((pos, index) => {
        loader.load('models/quille.glb', (glb) => {
            const model = glb.scene;
            model.scale.setScalar(SCALE);
            model.position.set(
                BOWLING_CENTER.x + pos.x,
                BOWLING_CENTER.y + 0.4 * SCALE,
                BOWLING_CENTER.z + pos.z
            );
            model.castShadow = true;
            scene.add(model);

            const collider = new THREE.Mesh(
                new THREE.CylinderGeometry(0.1 * SCALE, 0.1 * SCALE, 0.8 * SCALE, 8),
                new THREE.MeshStandardMaterial({ visible: false })
            );
            collider.position.copy(model.position);
            collider.userData.physics = { mass: 1, shape: 'cylinder' };
            scene.add(collider);
            if (physics && physics.addMesh) physics.addMesh(collider, 1, 0.4);

            setTimeout(() => {
                if (physics && physics.world && physics.world.bodies) {
                    physics.world.bodies.forEach(body => {
                        const t = body.translation();
                        const dist = Math.abs(t.x - collider.position.x) + Math.abs(t.z - collider.position.z);
                        if (dist < 1) bowlingObjects.push({ model, collider, rigidBody: body });
                    });
                } else {
                    console.warn('Physics world not yet initialized for bowling pins');
                }
            }, 500);
        });
    });
}