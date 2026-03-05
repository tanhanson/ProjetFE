// car.js - Version modifiée
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class Car {
    constructor(scene, physics) {
        this.scene = scene;
        this.physics = physics;
        this.car = null;
        this.chassis = null;
        this.wheels = [];
        this.vehicleController = null;
        
        this.movement = {
            forward: 0,
            right: 0,
            brake: 0,
            reset: false,
            engineForce: 700,
            maxSpeed: 30,
            dampingForce: 80,
            brakeForce: { value: 0, min: 0, max: 20, step: 0.5 }
        };
    }

    /**
     * Crée le chassis physique, le contrôleur de véhicule, les roues et charge le modèle 3D.
     *
     * @returns {Car} L'instance courante de la voiture.
     *
     * @example
     * const car = new Car(scene, physics);
     * car.create();
     */
    create() {
        const chassisMesh = new THREE.Mesh(
            new THREE.BoxGeometry(2, 1, 4),
            new THREE.MeshStandardMaterial({ visible: true })
        );
        chassisMesh.position.set(0, 1, 60);
        this.scene.add(chassisMesh);

        if (!this.physics || !this.physics.addMesh) {
            console.error('Physics engine not initialized properly');
            return this;
        }

        this.physics.addMesh(chassisMesh, 600, 0.8); // La valeur 600 est le poid de la voiture
        
        if (!chassisMesh.userData?.physics?.body) {
            console.error('Failed to create physics body for chassis');
            return this;
        }
        
        this.chassis = chassisMesh.userData.physics.body;
        this.car = chassisMesh;

        if (!this.physics.world || !this.physics.world.createVehicleController) {
            console.error('Physics world not initialized properly');
            return this;
        }

        this.vehicleController = this.physics.world.createVehicleController(this.chassis);

        this.addWheel(0, { x: -1.8, y: 0.4, z: -3.1 });
        this.addWheel(1, { x: 1.8, y: 0.4, z: -3.1 });
        this.addWheel(2, { x: -1.6, y: 0.4, z: 2.3 });
        this.addWheel(3, { x: 1.6, y: 0.4, z: 2.3 });

        this.vehicleController.setWheelSteering(0, Math.PI / 4);
        this.vehicleController.setWheelSteering(1, Math.PI / 4);

        this.loadModel();

        return this;
    }

    /**
     * Ajoute une roue au véhicule avec ses paramètres physiques et son mesh Three.js.
     *
     * @param {number} index - L'index de la roue (0 = avant-gauche, 1 = avant-droit, 2 = arrière-gauche, 3 = arrière-droit).
     * @param {{x: number, y: number, z: number}} pos - La position locale de la roue par rapport au chassis.
     * @returns {void}
     *
     * @example
     * // Ajoute la roue avant-gauche
     * this.addWheel(0, { x: -1.8, y: 0.4, z: -3.1 });
     */
    addWheel(index, pos) {
        const wheelRadius = 0.7;
        const wheelWidth = 0.4;
        const suspensionRestLength = 0.8;
        const wheelDirection = { x: 0.0, y: -1.0, z: 0.0 };
        const wheelAxle = { x: -1.0, y: 0.0, z: 0.0 };

        this.vehicleController.addWheel(pos, wheelDirection, wheelAxle, suspensionRestLength, wheelRadius);
        this.vehicleController.setWheelSuspensionStiffness(index, 100.0);
        this.vehicleController.setWheelFrictionSlip(index, 10.0);

        const geometry = new THREE.CylinderGeometry(wheelRadius, wheelRadius, wheelWidth, 16);
        geometry.rotateZ(Math.PI * 0.5);
        const material = new THREE.MeshStandardMaterial({ color: 0x000000 });
        const wheel = new THREE.Mesh(geometry, material);
        wheel.castShadow = true;
        wheel.position.copy(pos);

        this.wheels.push(wheel);
        this.car.add(wheel);
    }

    /**
     * Charge le modèle GLTF de la voiture et l'attache au chassis.
     *
     * @returns {void}
     *
     * @example
     * // Appelé automatiquement par create()
     * this.loadModel();
     */
    loadModel() {
        const loader = new GLTFLoader();
        loader.load('models/voiture.glb', (glb) => {
            const model = glb.scene;
            model.scale.setScalar(3);
            model.position.set(0, -0.3, 0);
            model.rotation.y = Math.PI;

            model.traverse(child => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;

                    if (child.material) {
                        child.material.emissive = new THREE.Color(0x000000);
                        child.material.emissiveIntensity = 0;
                    }
                }
            });

            this.car.add(model);
        });
    }

    /**
     * Met à jour la position et la rotation visuelle de chaque roue à partir des données physiques Rapier.
     * Combine deux quaternions : un pour le pilotage, un pour la rotation de roulement.
     *
     * @returns {void}
     *
     * @example
     * // Appelé à chaque frame dans la boucle d'animation
     * car.updateWheels();
     */
    updateWheels() {
        if (!this.vehicleController || !this.chassis) return;

        try {
            const wheelSteeringQuat = new THREE.Quaternion();
            const wheelRotationQuat = new THREE.Quaternion();
            const up = new THREE.Vector3(0, 1, 0);

            this.wheels.forEach((wheel, index) => {
                const wheelAxleCs = this.vehicleController.wheelAxleCs(index);
                const connection = this.vehicleController.wheelChassisConnectionPointCs(index).y || 0;
                const suspension = this.vehicleController.wheelSuspensionLength(index) || 0;
                const steering = this.vehicleController.wheelSteering(index) || 0;
                const rotationRad = this.vehicleController.wheelRotation(index) || 0;

                wheel.position.y = connection - suspension;
                wheelSteeringQuat.setFromAxisAngle(up, steering);
                wheelRotationQuat.setFromAxisAngle(wheelAxleCs, rotationRad);
                wheel.quaternion.multiplyQuaternions(wheelSteeringQuat, wheelRotationQuat);
            });
        } catch (error) {
            console.error('Error updating wheels:', error);
        }
    }

    /**
     * Met à jour les contrôles de la voiture à chaque frame.
     * Gère l'accélération, le freinage, la direction et la réinitialisation de position.
     *
     * @returns {void}
     *
     * @example
     * // Appelé à chaque frame dans la boucle d'animation
     * car.updateControl();
     */
    updateControl() {
        if (!this.vehicleController || this.movement.reset) {
            if (this.chassis && this.movement.reset) {
                this.resetPosition();
            }
            return;
        }

        this.updateAcceleration();
        this.updateBraking();
        this.updateSteering();
    }

    /**
     * Applique une force motrice constante aux roues avant selon la vitesse actuelle.
     * Quand la touche est relâchée, applique une impulsion de friction opposée au mouvement de la voiture
     * pour simuler un ralentissement naturel.
     *
     * @returns {void}
     *
     * @example
     * // W enfoncé → force constante jusqu'à maxSpeed
     * // W relâché → friction progressive jusqu'à l'arrêt
     * this.updateAcceleration();
     */
    updateAcceleration() {
        const linvel = this.chassis.linvel();
        const speed = Math.sqrt(linvel.x ** 2 + linvel.z ** 2);

        let force = 0;

        if (this.movement.forward < 0) {
            // W enfoncé = force constante
            if (speed < this.movement.maxSpeed) {
                force = this.movement.engineForce;
            } else {
                force = 0;
            }
        } else if (this.movement.forward > 0) {
            // S enfoncé → marche arrière
            if (speed < this.movement.maxSpeed * 0.5) {
                force = -this.movement.engineForce * 0.6;
            } else {
                force = 0;
            }
        } else {
            // W relâché = friction naturelle
            if (speed > 0.5) {
                const velX = linvel.x;
                const velZ = linvel.z;
                const dampX = -velX * this.movement.dampingForce;
                const dampZ = -velZ * this.movement.dampingForce;
                this.chassis.applyImpulse(
                    new this.physics.RAPIER.Vector3(dampX * 0.016, 0, dampZ * 0.016),
                    true
                );
            }
            force = 0;
            if (this.chassis.isSleeping()) this.chassis.wakeUp();
        }

        this.vehicleController.setWheelEngineForce(0, force);
        this.vehicleController.setWheelEngineForce(1, force);
    }

    /**
     * Gère le freinage progressif de la voiture sur les 4 roues.
     * La force de freinage augmente graduellement quand la barre d'espace est enfoncée
     * et diminue progressivement quand elle est relâchée.
     *
     * @returns {void}
     *
     * @example
     * // Espace enfoncé → frein augmente jusqu'à brakeForce.max
     * // Espace relâché → frein diminue progressivement
     * this.updateBraking();
     */
    updateBraking() {
        let brakeForce = 0;
        if (this.movement.brake > 0) {
            brakeForce = this.movement.brakeForce.value + this.movement.brakeForce.step * 2;
            if (brakeForce > this.movement.brakeForce.max) brakeForce = this.movement.brakeForce.max;
        } else {
            brakeForce = Math.max(0, this.movement.brakeForce.value - this.movement.brakeForce.step * 2);
        }
        this.movement.brakeForce.value = brakeForce;

        const wheelBrake = this.movement.brake * brakeForce;
        this.vehicleController.setWheelBrake(0, wheelBrake);
        this.vehicleController.setWheelBrake(1, wheelBrake);
        this.vehicleController.setWheelBrake(2, wheelBrake);
        this.vehicleController.setWheelBrake(3, wheelBrake);
    }

    /**
     * Met à jour l'angle de direction des roues avant avec un interpolation linéaire (lerp)
     * pour un retour au centre naturel et progressif.
     *
     * @returns {void}
     *
     * @example
     * // A/D enfoncé → roues tournent vers l'angle cible
     * // Relâché → roues reviennent doucement au centre
     * this.updateSteering();
     */
    updateSteering() {
        const currentSteering = this.vehicleController.wheelSteering(0);
        const steerDirection = this.movement.right;
        const steerAngle = Math.PI / 5;

        const targetAngle = steerAngle * steerDirection;
        const steering = THREE.MathUtils.lerp(currentSteering, targetAngle, 0.15);

        this.vehicleController.setWheelSteering(0, steering);
        this.vehicleController.setWheelSteering(1, steering);
    }

    /**
     * Remet la voiture à l'endroit à sa position actuelle en réinitialisant
     * sa rotation, ses vélocités et ses forces.
     *
     * @returns {void}
     *
     * @example
     * // Touche R enfoncée → voiture se redresse sur place
     * this.resetPosition();
     */
    resetPosition() {
        if (!this.chassis) return;

        const currentPos = this.chassis.translation();

        this.chassis.setRotation(new this.physics.RAPIER.Quaternion(0, 0, 0, 1), true);
        this.chassis.setTranslation(new this.physics.RAPIER.Vector3(
            currentPos.x,
            Math.max(currentPos.y, 1.0),
            currentPos.z
        ), true);

        this.chassis.setLinvel(new this.physics.RAPIER.Vector3(0, 0, 0), true);
        this.chassis.setAngvel(new this.physics.RAPIER.Vector3(0, 0, 0), true);

        this.movement.brakeForce.value = 0;
    }

    /**
     * Retourne la position mondiale actuelle du mesh de la voiture.
     *
     * @returns {THREE.Vector3} La position de la voiture dans la scène.
     *
     * @example
     * const pos = car.getPosition();
     * console.log(pos.x, pos.y, pos.z);
     */
    getPosition() {
        return this.car ? this.car.position : new THREE.Vector3(0, 0, 0);
    }

    /**
     * Retourne le vecteur de direction dans lequel la voiture pointe,
     * calculé à partir de sa rotation actuelle.
     *
     * @returns {THREE.Vector3} Le vecteur de direction normalisé de la voiture.
     *
     * @example
     * const dir = car.getDirection();
     * // dir est un vecteur unitaire dans la direction de la voiture
     */
    getDirection() {
        if (!this.car) return new THREE.Vector3(0, 0, 1);

        const quaternion = this.car.quaternion.clone();
        const direction = new THREE.Vector3(0, 0, 1);
        direction.applyQuaternion(quaternion);
        return direction;
    }

    /**
     * Initialise les écouteurs d'événements clavier pour contrôler la voiture.
     * WASD et les flèches directionnelles pour conduire, Espace pour freiner, R pour reset.
     *
     * @returns {void}
     *
     * @example
     * // Appelé une seule fois après la création de la voiture
     * car.setupControls();
     */
    setupControls() {
        window.addEventListener('keydown', (event) => {
            if (event.key === 'w' || event.key === 'W' || event.key === 'ArrowUp') this.movement.forward = 1;
            if (event.key === 'a' || event.key === 'A' || event.key === 'ArrowLeft') this.movement.right = 1;
            if (event.key === 's' || event.key === 'S' || event.key === 'ArrowDown') this.movement.forward = -1;
            if (event.key === 'd' || event.key === 'D' || event.key === 'ArrowRight') this.movement.right = -1;
            if (event.key === 'r' || event.key === 'R') this.movement.reset = true;
            if (event.key === ' ') this.movement.brake = 1;
        });

        window.addEventListener('keyup', (event) => {
            if (event.key === 'w' || event.key === 'W' || event.key === 'S' || event.key === 's' || event.key === 'ArrowUp' || event.key === 'ArrowDown') this.movement.forward = 0;
            if (event.key === 'a' || event.key === 'A' || event.key === 'D' || event.key === 'd' || event.key === 'ArrowLeft' || event.key === 'ArrowRight') this.movement.right = 0;
            if (event.key === 'r') this.movement.reset = false;
            if (event.key === ' ') this.movement.brake = 0;
        });
    }
}

export class CarCamera {
    /**
     * Crée un contrôleur de caméra qui suit la voiture en mode follow ou première personne.
     *
     * @param {THREE.Camera} camera - La caméra Three.js à contrôler.
     * @param {Car} car - L'instance de la voiture à suivre.
     
     *
     * @example
     * const carCamera = new CarCamera(camera, car, orbitControls);
     */
    constructor(camera, car, controls = null) {
        this.camera = camera;
        this.car = car;
        this.controls = controls;

        this.mode = 0; // 0 = follow, 1 = first person

        this.followSmoothing = 0.05;
        this.followDistance = 20;
        this.followHeight = 10;

        this.firstPersonSmoothing = 0.1;
        this.firstPersonOffset = new THREE.Vector3(0, 2, 1);

        if (this.controls) {
            this.controls.enabled = false;
        }
    }

    /**
     * Alterne le mode de caméra entre follow (0) et première personne (1).
     *
     * @returns {number} Le nouveau mode actif (0 ou 1).
     *
     * @example
     * // Touche C → change de mode
     * const newMode = carCamera.toggleMode();
     * console.log(newMode); // 0 ou 1
     */
    toggleMode() {
        this.mode = (this.mode + 1) % 2;

        if (this.mode === 0) {
            console.log('Camera mode: FOLLOW');
        } else {
            console.log('Camera mode: FIRST PERSON');
        }

        return this.mode;
    }

    /**
     * Met à jour la position et l'orientation de la caméra à chaque frame
     * selon le mode actif (Suivre ou première personne).
     *
     * @returns {void}
     *
     * @example
     * // Appelé à chaque frame dans la boucle d'animation
     * carCamera.update();
     */
    update() {
        if (!this.car || !this.car.car) return;

        const carPosition = this.car.getPosition();
        const carDirection = this.car.getDirection();

        if (this.mode === 0) {
            // MODE SUIVRE LA VOITURE
            const targetPosition = new THREE.Vector3(
                carPosition.x,
                carPosition.y + this.followHeight,
                carPosition.z + this.followDistance
            );

            this.camera.position.lerp(targetPosition, this.followSmoothing);

            const lookAtTarget = new THREE.Vector3(carPosition.x, carPosition.y + 1, carPosition.z);
            this.camera.lookAt(lookAtTarget);

        } else {
            // MODE PREMIERE PERSONNE
            const cameraOffset = this.firstPersonOffset.clone();
            cameraOffset.applyQuaternion(this.car.car.quaternion);

            const targetPosition = carPosition.clone().add(cameraOffset);
            this.camera.position.lerp(targetPosition, this.firstPersonSmoothing);

            const lookTarget = carPosition.clone();
            lookTarget.y += 1.5;
            this.camera.lookAt(lookTarget);
        }
    }
}