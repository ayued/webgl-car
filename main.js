import * as THREE from "three";
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { FilmPass } from 'three/examples/jsm/postprocessing/FilmPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { RGBShiftShader } from 'three/examples/jsm/shaders/RGBShiftShader.js';
import { SMAAPass } from 'three/examples/jsm/postprocessing/SMAAPass.js';
import gsap from 'gsap';

class SceneApp {
    constructor() {
        this.autoRotateSpeed = 0.002;
        this.isDragging = false;
        this.previousMouseX = 0;
        this.previousMouseY = 0;
        this.velocityY = 0;
        this.velocityX = 0;

        this.renderer = this.createRenderer();
        this.scene = new THREE.Scene();
        this.camera = this.createCamera();
        this.controls = this.createControls();

        this.group = new THREE.Group();
        this.scene.add(this.group);

        this.torus = this.createTorus();
        this.group.add(this.torus);

        this.model = new THREE.Group();
        this.group.add(this.model);

        this.loader = new GLTFLoader();
        this.loadModel();

        this.composer = this.createComposer();
        this.addPostEffects();

        this.addEventListeners();
        this.animateCamera();
        this.addLights();

        this.tick();
    }

    createRenderer() {
        const renderer = new THREE.WebGLRenderer();
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        document.body.appendChild(renderer.domElement);
        return renderer;
    }

    createCamera() {
        const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 10000);
        camera.position.set(40, 30, -80);
        return camera;
    }

    createControls() {
        const controls = new OrbitControls(this.camera, this.renderer.domElement);
        controls.enabled = false;
        return controls;
    }

    createTorus() {
        const geometry = new THREE.TorusGeometry(6, 0.8, 10, 40);
        const material = new THREE.MeshPhysicalMaterial({ color: 0x5C26FF, roughness: 0.5, metalness: 0 });
        const torus = new THREE.Mesh(geometry, material);
        return torus;
    }

    loadModel() {
        this.loader.load('models/car.glb', (gltf) => {
            const loadedModel = gltf.scene;
            this.model.add(loadedModel);

            loadedModel.traverse((child) => {
                if (child.isMesh && child.name === 'window') {
                    child.material = new THREE.MeshPhysicalMaterial({
                        color: 0x000000,
                        roughness: 0.1,
                        metalness: 0.1,
                        transparent: true,
                        opacity: 0.7,
                    });
                }
            });

            this.addModelMouseControl();
        });
    }

    addModelMouseControl() {
        document.addEventListener('mousemove', (event) => {
            const x = (event.clientX / window.innerWidth) * 2 - 1;
            const y = (event.clientY / window.innerHeight) * 2 - 1;
            this.model.rotation.y = x * Math.PI * 0.2;
            this.model.rotation.x = y * Math.PI * 0.2;
        });
    }

    createComposer() {
        const composer = new EffectComposer(this.renderer);
        const renderPass = new RenderPass(this.scene, this.camera);
        composer.addPass(renderPass);
        return composer;
    }

    addPostEffects() {
        const filmPass = new FilmPass(0.3, 0.3, 648, false);
        this.composer.addPass(filmPass);

        const rgbShiftPass = new ShaderPass(RGBShiftShader);
        rgbShiftPass.uniforms['amount'].value = 0.005;
        this.composer.addPass(rgbShiftPass);

        const smaaPass = new SMAAPass();
        this.composer.addPass(smaaPass);
    }

    addEventListeners() {
        document.addEventListener("mousedown", this.onMouseDown.bind(this));
        document.addEventListener("mousemove", this.onMouseMove.bind(this));
        document.addEventListener("mouseup", this.onMouseUp.bind(this));
        window.addEventListener("resize", this.onWindowResize.bind(this));

        this.renderer.domElement.addEventListener('click', this.onCarClick.bind(this));
    }

    onMouseDown(event) {
        this.isDragging = true;
        this.previousMouseX = event.clientX;
        this.previousMouseY = event.clientY;
    }

    onMouseMove(event) {
        if (this.isDragging) {
            const deltaX = event.clientX - this.previousMouseX;
            const deltaY = event.clientY - this.previousMouseY;

            this.velocityY = deltaX * 0.01;
            this.velocityX = deltaY * 0.01;

            this.group.rotation.y += this.velocityY;
            this.group.rotation.z += this.velocityX;

            this.previousMouseX = event.clientX;
            this.previousMouseY = event.clientY;
        }
    }

    onMouseUp() {
        this.isDragging = false;
    }

    onCarClick(event) {
        const mouse = new THREE.Vector2();
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, this.camera);

        const intersects = raycaster.intersectObject(this.model, true);

        if (intersects.length > 0) {
            gsap.to(this.model.scale, {
                x: 1.4, y: 1.4, z: 1.4,
                duration: 0.2,
                ease: "power2.out",
                onComplete: () => {
                    gsap.to(this.model.scale, {
                        x: 1, y: 1, z: 1,
                        duration: 0.2,
                        ease: "power2.in"
                    });
                }
            });

            gsap.to(this.group.rotation, { y: 0, z: 0, duration: 1, ease: "power2.out", overwrite: "auto" });
            gsap.to(this.model.rotation, { y: 0, z: 0, duration: 1, ease: "power2.out", overwrite: "auto" });
        }
    }

    addLights() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xff00FF, 1.2);
        directionalLight.position.set(0.5, 10, 10);
        this.scene.add(directionalLight);

        const pointLight = new THREE.DirectionalLight(0x00A6FF, 2);
        pointLight.position.set(-3, 0, 2);
        this.scene.add(pointLight);
    }

    animateCamera() {
        gsap.to(this.camera.position, {
            x: 0, y: 0, z: 30,
            duration: 3,
            ease: "power2.out",
            onUpdate: () => {
                this.camera.lookAt(0, 0, 0);
            },
            onComplete: () => {
                this.controls.enabled = true;
            }
        });
    }

    onWindowResize() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
    }

    tick() {
        this.controls.update();
        this.model.rotation.y += this.autoRotateSpeed;

        if (!this.isDragging) {
            this.group.rotation.y += this.velocityY;
            this.group.rotation.z += this.velocityX;

            this.velocityY *= 0.95;
            this.velocityX *= 0.95;

            if (Math.abs(this.velocityY) < 0.0001) this.velocityY = 0;
            if (Math.abs(this.velocityX) < 0.0001) this.velocityX = 0;
        }

        this.composer.render();
        requestAnimationFrame(this.tick.bind(this));
    }
}

new SceneApp();
