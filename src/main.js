import * as THREE from "three";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";

// Constants
const favoriteColor = new THREE.Color(21 / 255, 156 / 255, 49 / 255); // North Texas Green
const complementaryColor = new THREE.Color(200 / 255, 47 / 255, 25 / 255); // Dark Pastel Red
const ambientIntensity = 0.233; // 033 + 200
const fontURL =
  "https://threejs.org/examples/fonts/helvetiker_regular.typeface.json";

// Scene, Camera, Renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Cube (Point Light Source)
const cube = new THREE.Mesh(
  new THREE.BoxGeometry(0.5, 0.5, 0.5),
  new THREE.ShaderMaterial({
    vertexShader: `
      varying vec3 vPosition;
      void main() {
        vPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec3 vPosition;
      void main() {
        gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);    // white color
      }
    `,
  })
);
cube.position.set(0, 0, 0);
scene.add(cube);

// Point Light
const pointLight = new THREE.PointLight(0xffffff, 1, 50);
pointLight.position.copy(cube.position);
scene.add(pointLight);

// Font Loader for Text
const fontLoader = new FontLoader();
fontLoader.load(fontURL, (font) => {
  // Alphabet (N)
  const alphabetGeometry = new TextGeometry("N", {
    font: font,
    size: 1,
    height: 0.2,
  });
  const alphabetMaterial = new THREE.ShaderMaterial({
    uniforms: {
      lightPos: { value: pointLight.position },
      color: { value: favoriteColor },
      ambientIntensity: { value: ambientIntensity },
    },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vPosition;
      void main() {
        vNormal = normalMatrix * normal;
        vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 lightPos;
      uniform vec3 color;
      uniform float ambientIntensity;
      varying vec3 vNormal;
      varying vec3 vPosition;
      void main() {
        vec3 ambient = ambientIntensity * color;

        vec3 lightDir = normalize(lightPos - vPosition);
        vec3 normal = normalize(vNormal);
        float diff = max(dot(normal, lightDir), 0.0);
        vec3 diffuse = diff * color;

        vec3 viewDir = normalize(-vPosition);
        vec3 reflectDir = reflect(-lightDir, normal);
        float spec = pow(max(dot(viewDir, reflectDir), 0.0), 16.0);
        vec3 specular = spec * vec3(1.0);

        gl_FragColor = vec4(ambient + diffuse + specular, 1.0);
      }
    `,
  });
  const alphabetMesh = new THREE.Mesh(alphabetGeometry, alphabetMaterial);
  alphabetMesh.position.set(-2, 0, 0);
  scene.add(alphabetMesh);

  // Digit (3)
  const digitGeometry = new TextGeometry("3", {
    font: font,
    size: 1,
    height: 0.2,
  });
  const digitMaterial = new THREE.ShaderMaterial({
    uniforms: {
      lightPos: { value: pointLight.position },
      color: { value: complementaryColor },
      ambientIntensity: { value: ambientIntensity },
    },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vPosition;
      void main() {
        vNormal = normalMatrix * normal;
        vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 lightPos;
      uniform vec3 color;
      uniform float ambientIntensity;
      varying vec3 vNormal;
      varying vec3 vPosition;
      void main() {
        vec3 ambient = ambientIntensity * color;

        vec3 lightDir = normalize(lightPos - vPosition);
        vec3 normal = normalize(vNormal);
        float diff = max(dot(normal, lightDir), 0.0);
        vec3 diffuse = diff * color;

        vec3 viewDir = normalize(-vPosition);
        vec3 reflectDir = reflect(-lightDir, normal);
        float spec = pow(max(dot(viewDir, reflectDir), 0.0), 32.0);
        vec3 specular = spec * color;

        gl_FragColor = vec4(ambient + diffuse + specular, 1.0);
      }
    `,
  });
  const digitMesh = new THREE.Mesh(digitGeometry, digitMaterial);
  digitMesh.position.set(2, 0, 0);
  scene.add(digitMesh);
});

// Camera Position
camera.position.z = 5;

// Keyboard Controls
document.addEventListener("keydown", (event) => {
  if (event.key === "w") cube.position.y += 0.1;
  if (event.key === "s") cube.position.y -= 0.1;
  if (event.key === "a") camera.position.x += 0.1;
  if (event.key === "d") camera.position.x -= 0.1;

  // Update point light position
  pointLight.position.copy(cube.position);
});

// Animation Loop
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();
