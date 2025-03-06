import * as THREE from "three";
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';

import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { FilmPass } from 'three/examples/jsm/postprocessing/FilmPass.js';
// import { DotScreenPass } from 'three/examples/jsm/postprocessing/DotScreenPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { RGBShiftShader } from 'three/examples/jsm/shaders/RGBShiftShader.js';
import { BokehPass } from 'three/examples/jsm/postprocessing/BokehPass.js';
import { GlitchPass } from 'three/examples/jsm/postprocessing/GlitchPass.js';

import { SMAAPass } from 'three/examples/jsm/postprocessing/SMAAPass.js';


// レンダラーを作成
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.toneMapping = THREE.ACESFilmicToneMapping; // トーンマッピングを設定
document.body.appendChild(renderer.domElement);

// シーンを作成
const scene = new THREE.Scene();

// カメラを作成
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 10000);  //画角, アスペクト比, 描画開始/終了距離（オプション))
camera.position.set(40, 30, -80); // 初期位置

// OrbitControlsを初期化（最初は無効化）
const controls = new OrbitControls(camera, renderer.domElement);
controls.enabled = false; // アニメーション中は操作できない

// ジオメトリ
const geometry = new THREE.TorusGeometry(6, 0.8, 10, 40);
const material = new THREE.MeshPhysicalMaterial({ color: 0x5C26FF, roughness: 0.5, metalness: 0 });
const torus = new THREE.Mesh(geometry, material);
scene.add(torus);

// 3Dモデルを読み込み
const loader = new GLTFLoader();
loader.load('models/car.glb', function (gltf) {
    const model = gltf.scene;
    scene.add(model);
    // model.scale.set(20, 20, 20); 

    model.traverse((child) => {
        if (child.isMesh) {
            // 'window' メッシュに対して別のマテリアル（MeshPhysicalMaterial）を設定
            if (child.name === 'window') {
                child.material = new THREE.MeshPhysicalMaterial({
                    color: 0x000000,        // 黒色
                    roughness: 0.1,         // 反射
                    metalness: 0.1,         // 金属感
                    transparent: true,      // 透過あり
                    opacity: 0.7,           // 透明度
                });
            }
        }
    });

    // マウスの動きに応じてモデルを回転
    document.addEventListener('mousemove', (event) => {
        const x = (event.clientX / window.innerWidth) * 2 - 1;
        const y = (event.clientY / window.innerHeight) * 2 - 1;
        model.rotation.y = x * Math.PI * 0.2;
        model.rotation.x = y * Math.PI * 0.2;
    });

    // カメラアニメーション開始
    animateCamera();
});


// ポストエフェクトを追加
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);


// const bloomPass = new UnrealBloomPass(
//     new THREE.Vector2(window.innerWidth, window.innerHeight), // 解像度
//     1.0,  // 発光の強さ（1.0～3.0くらいが目安）
//     0.5,  // 広がりの範囲（0.0〜1.0）
//     0.9  // しきい値（どの明るさから発光させるか、0.0〜1.0）
// );
// composer.addPass(bloomPass);

const filmPass = new FilmPass(0.3, 0.3, 648, false);
composer.addPass(filmPass);

const rgbShiftPass = new ShaderPass(RGBShiftShader);
rgbShiftPass.uniforms['amount'].value = 0.005;
composer.addPass(rgbShiftPass);

const glitchPass = new GlitchPass();
composer.addPass(glitchPass);

const smaaPass = new SMAAPass();
composer.addPass(smaaPass);


// アニメーション
tick();

function tick() {
    controls.update();
    // renderer.render(scene, camera);
    composer.render();
    requestAnimationFrame(tick);
}

// カメラを動かすアニメーション（gsapでスムーズに移動）
function animateCamera() {
    gsap.to(camera.position, {
        x: 0,   // 最終位置
        y: 0,
        z: 30,
        duration: 3,   // 時間
        ease: "power2.out",
        onUpdate: () => {
            camera.lookAt(0, 0, 0); // 常に車を見る
        },
        onComplete: () => {
            controls.enabled = true; // カメラ操作を解放
        }
    });
}

// ライトを作成
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xff00FF, 1.2);
directionalLight.position.set(0.5, 10, 10);
scene.add(directionalLight);

const pointLight = new THREE.DirectionalLight(0x00A6FF, 2);
pointLight.position.set(-3, 0, 2);
scene.add(pointLight);

// ブラウザのリサイズに対応
window.addEventListener("resize", onWindowResize);

function onWindowResize() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
}
