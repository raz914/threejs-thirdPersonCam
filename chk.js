import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import Stats from 'three/examples/jsm/libs/stats.module.js';

class ThreeJSScene {
  constructor() {

    const fov = 60;
    const aspect = 1920 / 1080;
    const near = 1.0;
    const far = 1000.0;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(80, window.innerWidth / window.innerHeight, 1.0, 1000.0);
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.mixer = null;
    this.clock = new THREE.Clock();
    // this.stats = new Stats();
    this.moveForward = false;
    this.moveBackward = false;
    this.moveLeft = false;
    this.moveRight = false;
    this.pointerLocked = false;
    this.v = new THREE.Vector3();
    this.inputVelocity = new THREE.Vector3();
    this.euler = new THREE.Euler();
    this.quaternion = new THREE.Quaternion();

    this.clock = new THREE.Clock();
    this.delta = 0;
    this.startButton = document.getElementById("startButton");

    this.moveForward = false;
    this.moveBackward = false;
    this.moveLeft = false;
    this.moveRight = false;

    this.pivot = new THREE.Object3D();
    this.pivot.position.set(0, 1, 10);
    this.yaw = new THREE.Object3D();
    this.pitch = new THREE.Object3D();
    this.personModel = null;
    this.loaderScreen = document.getElementById("loader");






    this.scene.add(this.pivot);
    this.pivot.add(this.yaw);
    this.yaw.add(this.pitch);
    this.pitch.add(this.camera);



    this.animate = this.animate.bind(this);
    this.render = this.render.bind(this);
    this.onWindowResize = this.onWindowResize.bind(this);
    this.onPointerLockChange = this.onPointerLockChange.bind(this);
    this.onDocumentMouseMove = this.onDocumentMouseMove.bind(this);
    this.onDocumentMouseWheel = this.onDocumentMouseWheel.bind(this);
    this.onDocumentKey = this.onDocumentKey.bind(this);
    this.loadFBXModel(this.init.bind(this));




  }

  init() {
    this.keyMap = {};
    this.camera.position.set(0, 2, 5);
    // this.scene.add(new THREE.GridHelper());
    this.renderer.setPixelRatio(window.devicePixelRatio);

    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.renderer.domElement);
    // document.body.appendChild(this.stats.dom);
    this.setupTextures();
    this.setupLighting();
    this.setupGeometry();
    // this._animations = {};

    // this._stateMachine = new CharacterFSM(
    //   new BasicCharacterControllerProxy(this._animations));
    this.setupCameraControls();
    this.addEventListeners();
    console.log("why");

    this.animate();
  }

  setupTextures() {

    const loader = new THREE.CubeTextureLoader();
    const texture = loader.load([
      './resources/posx.jpg',
      './resources/negx.jpg',
      './resources/posy.jpg',
      './resources/negy.jpg',
      './resources/posz.jpg',
      './resources/negz.jpg',
    ]);
    texture.encoding = THREE.sRGBEncoding;
    this.scene.background = texture;



    const gloader = new THREE.TextureLoader();

    // load a resource
    gloader.load(
      // resource URL
      'assets/moss.jpg',

      // onLoad callback
      (texture) => {
        // in this example we create the material when the texture is loaded
        // const material = new THREE.MeshBasicMaterial( {
        // 	map: texture
        //  } );
        //    const plane = new THREE.Mesh(
        //     new THREE.PlaneGeometry(1000, 1000, 10, 10),
        //     material);
        // plane.castShadow = false;
        // plane.receiveShadow = true;
        // plane.rotation.x = -Math.PI / 2;
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;

        // how many times to repeat in each direction; the default is (1,1),
        //   which is probably why your example wasn't working
        texture.repeat.set(256, 256);

        const material = new THREE.MeshLambertMaterial({ map: texture });
        const plane = new THREE.Mesh(new THREE.PlaneGeometry(500, 500, 10, 10), material);
        plane.material.side = THREE.DoubleSide;
        // plane.position.x = 100;

        // rotation.z is rotation around the z-axis, measured in radians (rather than degrees)
        // Math.PI = 180 degrees, Math.PI / 2 = 90 degrees, etc
        plane.castShadow = true;
        plane.receiveShadow = true;
        plane.rotation.x = -Math.PI / 2;
        console.log("this.scene", this.scene)
        this.scene.fog = new THREE.Fog(0xcccccc, 1, 75)
        this.scene.add(plane);



      },

      // onProgress callback currently not supported
      undefined,

      // onError callback
      function (err) {
        console.error('An error happened.');
      }
    );




  }


  animate() {
    requestAnimationFrame(this.animate);

    this.delta = this.clock.getDelta();
    this.inputVelocity.set(0, 0, 0);

    // Check movement inputs
    if (this.moveForward) {
      this.inputVelocity.z = 3 * this.delta;
    }
    if (this.moveBackward) {
      this.inputVelocity.z = -3 * this.delta;

    }
    if (this.moveLeft) {
      this.inputVelocity.x = 3 * this.delta;
    }
    if (this.moveRight) {
      this.inputVelocity.x = -3 * this.delta;
    }

    // Update mixer and apply movement
    if (this.mixer && this.personModel) {
      // Update mixer
      this.mixer.update(this.delta);
      
      // Apply camera rotation to inputVelocity
      this.euler.y = this.yaw.rotation.y;
      this.quaternion.setFromEuler(this.euler);
      this.inputVelocity.applyQuaternion(this.quaternion);
      this.personModel.position.add(this.inputVelocity);
      this.personModel.rotation.y = this.yaw.rotation.y;

      // Update pivot position
      this.personModel.getWorldPosition(this.v);
      this.pivot.position.lerp(this.v, 0.1);

      // Play appropriate animation
      const walkClip = THREE.AnimationClip.findByName(this.anims, "walk");
      const walkAction = this.mixer.clipAction(walkClip);
      const idleClip = THREE.AnimationClip.findByName(this.anims, "idle");
      const idleAction = this.mixer.clipAction(idleClip);
      const leftClip = THREE.AnimationClip.findByName(this.anims, "left");
      const leftAction = this.mixer.clipAction(leftClip);
      const rightClip = THREE.AnimationClip.findByName(this.anims, "right");
      const rightAction = this.mixer.clipAction(rightClip);
      let isWalking = walkAction.isRunning();

      if (this.moveForward && !isWalking) {
        // Start playing the walking animation if not already playing
        walkAction.setLoop(THREE.LoopRepeat); // Set the loop mode to repeat
        walkAction.play();
        isWalking = true; // Set the flag to indicate that walking animation is now playing
    }

    if (!this.moveForward && isWalking) {
        // Stop the walking animation if the "W" key is released
        walkAction.stop();
        leftAction.stop();

        isWalking = false; // Reset the flag
    }

    // Check for left and right movement and play corresponding animations
    if (this.moveLeft) {
        // Play left animation
        if(rightAction.isRunning){
          rightAction.stop()
        }
        walkAction.stop();
        leftAction.setLoop(THREE.LoopRepeat); // Set the loop mode to repeat
        leftAction.play();
        // Add your left animation logic here
    } else if (this.moveRight) {
        // Play right animation
        if(leftAction.isRunning){
          leftAction.stop()
        }
        walkAction.stop()
        rightAction.play();
        // Add your right animation logic here
    } else {
        // Play the idle animation when not moving left or right
        idleAction.play();
        if(rightAction.isRunning){
          rightAction.stop()
        }
        if(leftAction.isRunning){
          leftAction.stop()
        }
    }

}

    // Render scene
    this.render();
  }


  helloWorld() {
    console.log("helllo world")
  }
  onDocumentMouseMove(event) {
    this.yaw.rotation.y -= event.movementX * 0.002;
    // Invert the rotation calculation for pitch to fix the inverted mouse movement
    const v = this.pitch.rotation.x + event.movementY * 0.002; // Change '-' to '+'
    // Ensure that the pitch rotation remains within the desired range
    if (v > -0.1 && v < 1.2) {
        this.pitch.rotation.x = v;
    }
    return false;
  }

  onDocumentMouseWheel(event) {
    const v = this.camera.position.z + event.deltaY * 0.005;
    if (v >= 2 && v <= 10) {
      this.camera.position.z = v;
    }
    return false;
  }

  onDocumentKey(event) {
    this.keyMap[event.code] = event.type === "keydown";
    if (this.pointerLocked) {
      this.moveForward = this.keyMap["KeyW"];
      this.moveBackward = this.keyMap["KeyS"];
      this.moveLeft = this.keyMap["KeyA"];
      this.moveRight = this.keyMap["KeyD"];
    }
  }
  render() {
    this.renderer.render(this.scene, this.camera);
  }
  setupLighting() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.25);
    // ambientLight.position.set(5, 20, 10);
    this.scene.add(ambientLight);

    // const light = new THREE.PointLight(0xffffff, 300);
    // light.position.set(1, 200, 200);
    let light = new THREE.DirectionalLight(0xFFFFFF, 4.0);
    light.position.set(50, 100, 200);
    // light.target = this.personModel;
    // light.target.position.set(0, 0, 0);
    light.castShadow = true;
    light.shadow.bias = -0.001;
    light.shadow.mapSize.width = 4096;
    light.shadow.mapSize.height = 4096;
    light.shadow.camera.near = 0.1;
    light.shadow.camera.far = 500.0;
    light.shadow.camera.near = 0.5;
    light.shadow.camera.far = 500.0;
    light.shadow.camera.left = 50;
    light.shadow.camera.right = -50;
    light.shadow.camera.top = 50;
    light.shadow.camera.bottom = -50;
    // this._scene.add(light);
    this.scene.add(light);
    light.shadow.mapSize.width = 512; // default
    light.shadow.mapSize.height = 512; // default
    light.shadow.camera.near = 0.5; // default
    light.shadow.camera.far = 500;
  }

  setupGeometry() {
    const geometry = new THREE.CapsuleGeometry();
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true });
    // this.capsule = new THREE.Mesh(geometry, material);
    // this.capsule.position.y = 1.5;
    // this.scene.add(this.capsule);
  }

  // loadFBXModel() {
  //   const fbxLoader = new FBXLoader();
  //   fbxLoader.load('assets/remy.fbx', (model) => {
  //     model.scale.set(0.01, 0.01, 0.01);
  //     this.scene.add(model);

  //     this.mixer = new THREE.AnimationMixer(model);
  //     const clips = model.animations;
  //     const clip = THREE.AnimationClip.findByName(clips, "mixamo.com");
  //     if (clip) {
  //       const action = this.mixer.clipAction(clip);
  //       action.play();
  //     }
  //   }, undefined, (error) => {
  //     console.error(error);
  //   });
  // }
  onProgress(xhr) {

    if (xhr.lengthComputable) {

      const percentComplete = xhr.loaded / xhr.total * 100;
      console.log('model ' + percentComplete.toFixed(2) + '% downloaded');

    }

  }

  onError() { }
  loadFBXModel(callback) {
    const manager = new THREE.LoadingManager();
    const fbxLoader = new FBXLoader(manager);
    this.anims = []

    manager.onLoad = () => {
      if (callback) {
        console.log("person model", this.personModel, this.personModel.animations)
        this.anims[0].name = "walk";
        this.anims[1].name = "idle";
        this.anims[2].name = "left";
        this.anims[3].name = "right";


        console.log("this.anims", this.anims)


        console.log("yes its loaded", this.loaderScreen)
        this.loaderScreen.style.display = "none";

        callback();
      }
    };
    fbxLoader.load('assets/remy.fbx', (model) => {
      this.personModel = model
      this.personModel.scale.set(0.01, 0.01, 0.01);
      this.scene.add(this.personModel);

      this.mixer = new THREE.AnimationMixer(this.personModel);
      const clips = this.personModel.animations;
      const clip = THREE.AnimationClip.findByName(clips, "mixamo.com");
      if (clip) {
        const action = this.mixer.clipAction(clip);
        action.play();
      }
    }, this.onProgress, this.onError);

    // fbxLoader.setPath('./assets/anims/');
    fbxLoader.load('assets/anims/Walk.fbx', (walkingAnimation) => {
      // animations['walking'] = walkingAnimation.animations[0];

      this.anims[0] = walkingAnimation.animations[0];
      console.log("walking", walkingAnimation, walkingAnimation.animations[0])
      // You can store the animation for later use
    });

    fbxLoader.load('assets/anims/idle.fbx', (idleAnimation) => {
      // animations['idle'] = idleAnimation.animations[0];
      this.anims[1] = idleAnimation.animations[0];

      // You can store the animation for later use
    });
    fbxLoader.load('assets/anims/left.fbx', (idleAnimation) => {
      // animations['idle'] = idleAnimation.animations[0];
      this.anims[2] = idleAnimation.animations[0];

      // You can store the animation for later use
    });
    fbxLoader.load('assets/anims/right.fbx', (idleAnimation) => {
      // animations['idle'] = idleAnimation.animations[0];
      this.anims[3] = idleAnimation.animations[0];

      // You can store the animation for later use
    });




  }
  // _OnLoad(animName, anim){
  //   const clip = anim.animations[0];
  //   const action = this.mixer.clipAction(clip);

  //   this._animations[animName] = {
  //     clip: clip,
  //     action: action,
  //   };
  // };

  setupCameraControls() {

    if (this.personModel) {
      // Rotate the camera by 180 degrees around the Y-axis
      this.camera.rotation.set(0, Math.PI, 0);

      // Move the camera behind the player model
      const distance = 5; // Adjust this distance as needed
      const offsetX = 0; // Adjust this offset as needed
      const offsetY = 2; // Adjust this offset as needed
      const offsetZ = -10; // Adjust this offset as needed
      const playerPosition = this.personModel.position.clone();
      const cameraPosition = playerPosition.clone().add(new THREE.Vector3(offsetX, offsetY, offsetZ));
      this.camera.position.copy(cameraPosition);
  }
  
    this.pivot = new THREE.Object3D();
    this.pivot.position.set(0, 1, 30);
    this.yaw = new THREE.Object3D();
    this.pitch = new THREE.Object3D();
    this.scene.add(this.pivot);
    this.pivot.add(this.yaw);
    this.yaw.add(this.pitch);
    this.pitch.add(this.camera);
  



  }

  addEventListeners() {
    window.addEventListener('resize', this.onWindowResize.bind(this), false);
    document.addEventListener('pointerlockchange', this.onPointerLockChange.bind(this), false);

    this.startButton = document.getElementById('startButton');
    if (this.startButton) {
      this.startButton.addEventListener('click', () => {
        console.log("hello?")
      // this.personModel.rotation.set(0,60, 0);

        this.renderer.domElement.requestPointerLock();
      }, false);
    }
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  onPointerLockChange() {
    console.log("this", this.renderer)
    if (document.pointerLockElement === this.renderer.domElement) {
      this.pointerLocked = true;
      const menuPanel = document.getElementById("menuPanel");
      this.startButton.style.display = "none";
      menuPanel.style.display = "none";

      this.addPointerLockEventListeners();
    }

    else {
      console.log(" else?", this.renderer, this.startButton)



      this.pointerLocked = false;
      this.removePointerLockEventListeners();
      setTimeout(() => {
        menuPanel.style.display = "block";
        this.startButton.style.display = "block";
      }, 1000);
    }
  }

  //   addPointerLockEventListeners() {
  //     this.renderer.domElement.addEventListener('mousemove', this.onDocumentMouseMove.bind(this), false);
  //     this.renderer.domElement.addEventListener('wheel', this.onDocumentMouseWheel.bind(this), false);
  //     document.addEventListener('keydown', this.onDocumentKey.bind(this), false);
  //     document.addEventListener('keyup', this.onDocumentKey.bind(this), false);
  //   }

  //   removePointerLockEventListeners() {
  //     this.renderer.domElement.removeEventListener('mousemove', this.onDocumentMouseMove.bind(this), false);
  //     this.renderer.domElement.removeEventListener('wheel', this.onDocumentMouseWheel.bind(this), false);
  //     document.removeEventListener('keydown', this.onDocumentKey.bind(this),false);
  //   }
  addPointerLockEventListeners() {
    this.renderer.domElement.addEventListener('mousemove', this.onDocumentMouseMove, false);
    this.renderer.domElement.addEventListener('wheel', this.onDocumentMouseWheel, false);
    document.addEventListener('keydown', this.onDocumentKey, false);
    document.addEventListener('keyup', this.onDocumentKey, false);
  }

  removePointerLockEventListeners() {
    this.renderer.domElement.removeEventListener('mousemove', this.onDocumentMouseMove, false);
    this.renderer.domElement.removeEventListener('wheel', this.onDocumentMouseWheel, false);
    document.removeEventListener('keydown', this.onDocumentKey, false);
    document.removeEventListener('keyup', this.onDocumentKey, false);
  }

}
// class BasicCharacterControllerProxy {
//     constructor(animations) {
//       this._animations = animations;
//     }

//     get animations() {
//       return this._animations;
//     }
//   };
// class FiniteStateMachine {
//   constructor() {
//     this._states = {};
//     this._currentState = null;
//   }

//   //creates a key value pair for the _states JSON
//   _AddState(name, type) {
//     this._states[name] = type;
//   }

//   SetState(name) {
//     const prevState = this._currentState;

//     if (prevState) {
//       if (prevState.Name == name) {
//         return;
//       }
//       //calling the Exit method from State
//       prevState.Exit();
//     }
//     //creating new instance of a state class
//     const state = new this._states[name](this);

//     this._currentState = state;
//     //calling the Enter method from State
//     state.Enter(prevState);
//   }

//   Update(timeElapsed, input) {
//     if (this._currentState) {
//       //calling Update method from State
//       this._currentState.Update(timeElapsed, input);
//     }
//   }
// };

// //child of FiniteStateMachine
// class CharacterFSM extends FiniteStateMachine {
//   constructor(proxy) {
//     super();
//     this._proxy = proxy;
//     this._Init();
//   }

//   //adds states to the _states JSON in FiniteStateMachine
//   _Init() {       //name    type
//     this._AddState('idle', IdleState);
//     this._AddState('walk', WalkState);
//     this._AddState('walkBack', WalkBackState);
//   }
// };

// class State {
//   constructor(parent) {
//     this._parent = parent;
//   }
//   //methods that the subclass's inherit
//   Enter() {}
//   Exit() {}
//   Update() {}
// };



// //walking animation state
// class WalkState extends State {
//   constructor(parent) {
//     super(parent); //call the constructor of the parent class
//   }

//   //getter for the name this instance of class
//   get Name() {
//     return 'walk';
//   }

//   Enter(prevState) {
//     const curAction = this._parent._proxy._animations['walk'].action;
//     if (prevState) {
//       const prevAction = this._parent._proxy._animations[prevState.Name].action;

//       curAction.enabled = true;


//       curAction.crossFadeFrom(prevAction, 0.5, true);
//       curAction.play();
//     } else {
//       curAction.play();
//     }
//   }

//   Exit() {
//   }

//   Update(timeElapsed, input) {
//     if (input._keys.forward) {
//       return;
//     }

//     this._parent.SetState('idle');
//   }
// };

// //walking backwards animation state
// class WalkBackState extends State {
//   constructor(parent) {
//     super(parent);
//   }

//   get Name() {
//     return 'walkBack';
//   }

//   Enter(prevState) {
//     const curAction = this._parent._proxy._animations['walkBack'].action;
//     if (prevState) {
//       const prevAction = this._parent._proxy._animations[prevState.Name].action;

//       curAction.enabled = true;

//       curAction.crossFadeFrom(prevAction, 0.5, true);
//       curAction.play();
//     } else {
//       curAction.play();
//     }
//   }

//   Exit() {
//   }

//   Update(timeElapsed, input) {
//     if (input._keys.backward) {
//       return;
//     }

//     this._parent.SetState('idle');
//   }
// };


// //idle animation state
// class IdleState extends State {
//   constructor(parent) {
//     super(parent);
//   }

//   get Name() {
//     return 'idle';
//   }

//   Enter(prevState) {
//     const idleAction = this._parent._proxy._animations['idle'].action;
//     if (prevState) {
//       const prevAction = this._parent._proxy._animations[prevState.Name].action;
//       idleAction.time = 0.0;
//       idleAction.enabled = true;
//       idleAction.setEffectiveTimeScale(1.0);
//       idleAction.setEffectiveWeight(1.0);
//       idleAction.crossFadeFrom(prevAction, 0.5, true);
//       idleAction.play();
//     } else {
//       idleAction.play();
//     }
//   }

//   Exit() {



//   }
//   //you have to update state from the last
//   Update(_, input) {
//     if (input._keys.forward) {
//       this._parent.SetState('walk');
//     } else if(input._keys.backward) {
//       this._parent.SetState('walkBack');
//     } 
//   }
// };

const threeScene = new ThreeJSScene();