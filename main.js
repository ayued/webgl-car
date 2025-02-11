import * as THREE from "three";
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import gsap from "gsap";

const width = window.innerWidth-60;
const height = window.innerHeight-200;

// レンダラーを作成
const renderer = new THREE.WebGLRenderer({
    canvas: document.querySelector("#myCanvas")
});
renderer.setSize(width, height);  //描画サイズ
renderer.setPixelRatio(window.devicePixelRatio);  //デバイスピクセル比（スマホのぼやけ防止）

// シーンを作成
const scene = new THREE.Scene();

// カメラを作成
const camera = new THREE.PerspectiveCamera(45, width / height, 1, 10000);  //画角, アスペクト比, 描画開始/終了距離（オプション))
camera.position.set(40, 30, -80); // 初期位置
camera.lookAt(0, 0, 0);

// OrbitControlsを初期化（最初は無効化）
const controls = new OrbitControls(camera, renderer.domElement);
controls.enabled = false; // アニメーション中は操作できない


// 3Dモデルを読み込み
const loader = new GLTFLoader();
loader.load('models/car.glb', function (gltf) {
    const model = gltf.scene;
    scene.add(model);

    model.traverse((child) => {
      if (child.isMesh) {
          // windowメッシュの質感を指定
          if (child.name === 'window') {
              child.material = new THREE.MeshPhysicalMaterial({
                  color: 0x000000,
                  roughness: 0.1,   // 反射
                  metalness: 0.1,   // 金属
                  transparent: true, // 透過あり
                  opacity: 0.7,     // 透明度
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

// ライトを作成
const light = new THREE.AmbientLight(0xffffff, 1);
scene.add(light);

// アニメーション
tick();

function tick() {
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}

// カメラを動かすアニメーション（gsapでスムーズに移動）
function animateCamera() {
  gsap.to(camera.position, {
      x: 0,   // 最終位置
      y: 0,
      z: 40,
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

// ブラウザのリサイズに対応
window.addEventListener("resize", onWindowResize);

function onWindowResize() {
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
}
