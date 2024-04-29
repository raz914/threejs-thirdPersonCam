import * as THREE from "three";
import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls.js";
import Stats from "three/examples/jsm/libs/stats.module.js";
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';

import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader'
const scene = new THREE.Scene();
let mixer;
scene.add(new THREE.GridHelper());

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 0.5, 3);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const geometry = new THREE.CapsuleGeometry();
const material = new THREE.MeshBasicMaterial({
  color: 0x00ff00,
  wireframe: true
});
const ambientLight = new THREE.AmbientLight(0xffffff,1); // Soft white light
ambientLight.position.set(5,20,10)
scene.add(ambientLight);
const light = new THREE.PointLight(0xffffff,300);
light.position.set(1,5,5);
scene.add(light);
// const assetLoader = new GLTFLoader();

const capsule = new THREE.Mesh(geometry, material);
capsule.position.y = 1.5;
scene.add(capsule);

// const fbxLoader = new FBXLoader()
// fbxLoader.load(
//     'assets/remy.fbx',
//     (model) => {
//     model.scale.set(0.01,0.01,0.01)
//     scene.add(model);

//         mixer = new THREE.AnimationMixer(model);
//         const clips = model.animations;

//         console.log("animations", clips)
        
//         //     // Play a certain animation
//             const clip = THREE.AnimationClip.findByName(clips, "mixamo.com");
//             const action = mixer.clipAction(clip);
//             action.play();
        
//             // Play all animations at the same time
//             // clips.forEach(function(clip) {
//             //     const action = mixer.clipAction(clip);
//             //     action.play();
//             // });

        
        
//         // object.traverse(function (child) {
//         //     if ((child as THREE.Mesh).isMesh) {
//         //         // (child as THREE.Mesh).material = material
//         //         if ((child as THREE.Mesh).material) {
//         //             ((child as THREE.Mesh).material as THREE.MeshBasicMaterial).transparent = false
//         //         }
//         //     }
//         // })
//         // object.scale.set(.01, .01, .01)
//     },
//     (xhr) => {
//         console.log((xhr.loaded / xhr.total) * 100 + '% loaded')
//     },
//     (error) => {
//         console.log(error)
//     }
// )


const pivot = new THREE.Object3D();
pivot.position.set(0, 1, 10);

const yaw = new THREE.Object3D();
const pitch = new THREE.Object3D();

scene.add(pivot);
pivot.add(yaw);
yaw.add(pitch);
pitch.add(camera);

window.addEventListener("resize", onWindowResize, false);
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  render();
}

function onDocumentMouseMove(e) {
  yaw.rotation.y -= e.movementX * 0.002;
  const v = pitch.rotation.x - e.movementY * 0.002;
  if (v > -1 && v < 0.1) {
    pitch.rotation.x = v;
  }
  return false;
}

function onDocumentMouseWheel(e) {
  const v = camera.position.z + e.deltaY * 0.005;
  if (v >= 2 && v <= 10) {
    camera.position.z = v;
  }
  return false;
}

let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
const keyMap = {};
const onDocumentKey = (e) => {
  keyMap[e.code] = e.type === "keydown";

  if (pointerLocked) {
    moveForward = keyMap["KeyW"];
    moveBackward = keyMap["KeyS"];
    moveLeft = keyMap["KeyA"];
    moveRight = keyMap["KeyD"];
  }
};

const menuPanel = document.getElementById("menuPanel");
const startButton = document.getElementById("startButton");
startButton.addEventListener(
  "click",
  () => {
    renderer.domElement.requestPointerLock();
  },
  false
);

let pointerLocked = false;
document.addEventListener("pointerlockchange", () => {
  if (document.pointerLockElement === renderer.domElement) {
    pointerLocked = true;

    startButton.style.display = "none";
    menuPanel.style.display = "none";

    document.addEventListener("keydown", onDocumentKey, false);
    document.addEventListener("keyup", onDocumentKey, false);

    renderer.domElement.addEventListener(
      "mousemove",
      onDocumentMouseMove,
      false
    );
    renderer.domElement.addEventListener("wheel", onDocumentMouseWheel, false);
  } else {
    pointerLocked = false;

    menuPanel.style.display = "block";

    document.removeEventListener("keydown", onDocumentKey, false);
    document.removeEventListener("keyup", onDocumentKey, false);

    renderer.domElement.removeEventListener(
      "mousemove",
      onDocumentMouseMove,
      false
    );
    renderer.domElement.removeEventListener(
      "wheel",
      onDocumentMouseWheel,
      false
    );

    setTimeout(() => {
      startButton.style.display = "block";
    }, 1000);
  }
});

const stats = new Stats();
document.body.appendChild(stats.dom);

const v = new THREE.Vector3();
const inputVelocity = new THREE.Vector3();
const euler = new THREE.Euler();
const quaternion = new THREE.Quaternion();

const clock = new THREE.Clock();
let delta = 0;

function animate() {
  requestAnimationFrame(animate);
  if(mixer){
      mixer.update(clock.getDelta());}
  delta = clock.getDelta();

  inputVelocity.set(0, 0, 0);

  if (moveForward) {
    inputVelocity.z = -10 * delta;
  }
  if (moveBackward) {
    inputVelocity.z = 10 * delta;
  }

  if (moveLeft) {
    inputVelocity.x = -10 * delta;
  }
  if (moveRight) {
    inputVelocity.x = 10 * delta;
  }

  // apply camera rotation to inputVelocity
  euler.y = yaw.rotation.y;
  quaternion.setFromEuler(euler);
  inputVelocity.applyQuaternion(quaternion);
  capsule.position.add(inputVelocity);

  capsule.getWorldPosition(v);
  pivot.position.lerp(v, 0.1);

  render();

  stats.update();
}

function render() {
  renderer.render(scene, camera);
}

animate();