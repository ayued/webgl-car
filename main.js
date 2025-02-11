import * as THREE from "three";
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const width = window.innerWidth-60;
const height = window.innerHeight-200;

// レンダラーを作成
const renderer = new THREE.WebGLRenderer({
    canvas: document.querySelector("#myCanvas")  //場所
});
renderer.setSize(width, height);  //描画サイズ
renderer.setPixelRatio(window.devicePixelRatio);  //デバイスピクセル比（スマホのぼやけ防止）

// シーンを作成
const scene = new THREE.Scene();

// カメラを作成
const camera = new THREE.PerspectiveCamera(45, width / height, 1, 10000);  //画角, アスペクト比, 描画開始/終了距離（オプション))
camera.position.set(0, 0, 30); // 初期座標(x,y,z)
camera.lookAt(0, 0, 0);

// 3Dモデルを読み込み
const loader = new GLTFLoader();
loader.load('models/car.glb', function (gltf) {
    const model = gltf.scene;
    scene.add(model);

    model.traverse((child) => {
      if (child.isMesh) {
          // windowという名前のメッシュに対して質感を適用s
          if (child.name === 'window') {
              child.material = new THREE.MeshStandardMaterial({
                  color: 0x000000,  // ガラスの色（薄いグレー）
                  roughness: 0.1,   // 少し反射する質感
                  metalness: 0.1,   // 金属的ではなく
                  transparent: true, // 透明
                  opacity: 0.7,     // 透明度
                  refractionRatio: 0.98, // 屈折率（ガラスのような質感を表現）
                  reflectivity: 0.7 // 反射感
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
});

// OrbitControlsを初期化
const controls = new OrbitControls(camera, renderer.domElement);

// ライトを作成
const light = new THREE.AmbientLight(0xffffff, 1);
scene.add(light);

// アニメーション
tick();

function tick() {
  controls.update();  //カメラコントローラーを更新

  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}

// ブラウザのリサイズに対応
window.addEventListener("resize", onWindowResize);

function onWindowResize() {
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
}
