import * as THREE from "three";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";

const canvas = document.getElementById("three-canvas");
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5;

const renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
renderer.setSize(window.innerWidth, window.innerHeight);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
scene.add(ambientLight);

const fontLoader = new FontLoader();
fontLoader.load(
  "https://threejs.org/examples/fonts/helvetiker_regular.typeface.json",
  (font) => {
    const createMaterial = (baseColor) =>
      new THREE.ShaderMaterial({
        uniforms: {
          cubePosition: { value: new THREE.Vector3(0, 0, 0) },
        },
        vertexShader: `
          varying vec3 vPosition;
          void main() {
            vPosition = (modelMatrix * vec4(position, 1.0)).xyz;
            gl_Position = projectionMatrix * viewMatrix * vec4(vPosition, 1.0);
          }
        `,
        fragmentShader: `
          uniform vec3 cubePosition;
          varying vec3 vPosition;
          void main() {
            float distance = length(cubePosition - vPosition);
            float brightness = 1.0 / (distance * distance + 1.0);
            vec3 glowColor = vec3(${baseColor}) * brightness;
            gl_FragColor = vec4(glowColor, 1.0);
          }
        `,
      });

    const letterMaterial = createMaterial("0.086, 0.612, 0.192"); // North Texas Green
    const letterGeometry = new TextGeometry("N", {
      font: font,
      size: 2.5,
      height: 0.2,
    });
    const letterMesh = new THREE.Mesh(letterGeometry, letterMaterial);
    letterMesh.position.set(-3, -1, 0);
    scene.add(letterMesh);

    const digitMaterial = createMaterial("0.784, 0.184, 0.098"); // Dark Pastel Red
    const digitGeometry = new TextGeometry("3", {
      font: font,
      size: 2.5,
      height: 0.2,
    });
    const digitMesh = new THREE.Mesh(digitGeometry, digitMaterial);
    digitMesh.position.set(1, -1, 0);
    scene.add(digitMesh);
  }
);

const glowMaterial = new THREE.ShaderMaterial({
  uniforms: {
    glowColor: { value: new THREE.Color(0xffffff) },
    viewVector: { value: new THREE.Vector3() },
  },
  vertexShader: `
    varying vec3 vNormal;
    varying vec3 vPosition;
    void main() {
      vNormal = normalize(normalMatrix * normal);
      vPosition = (modelMatrix * vec4(position, 1.0)).xyz;
      gl_Position = projectionMatrix * viewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform vec3 glowColor;
    uniform vec3 viewVector;
    varying vec3 vNormal;
    varying vec3 vPosition;
    void main() {
      float intensity = pow(0.6 - dot(vNormal, viewVector), 2.0);
      gl_FragColor = vec4(glowColor * intensity, 1.0);
    }
  `,
  side: THREE.FrontSide,
  blending: THREE.AdditiveBlending,
  transparent: true,
});

const cubeGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
const cube = new THREE.Mesh(cubeGeometry, glowMaterial);
cube.position.set(0, 0, 0);
scene.add(cube);

const pointLight = new THREE.PointLight(0xffffff, 1, 10);
pointLight.position.copy(cube.position);
scene.add(pointLight);

window.addEventListener("keydown", (event) => {
  switch (event.key) {
    case "w":
      cube.position.y += 0.1;
      pointLight.position.copy(cube.position);
      glowMaterial.uniforms.viewVector.value.copy(cube.position);
      break;
    case "s":
      cube.position.y -= 0.1;
      pointLight.position.copy(cube.position);
      glowMaterial.uniforms.viewVector.value.copy(cube.position);
      break;
    case "a":
      camera.position.x += 0.1;
      break;
    case "d":
      camera.position.x -= 0.1;
      break;
  }
});

function animate() {
  glowMaterial.uniforms.viewVector.value.copy(camera.position);
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
