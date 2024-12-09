import * as THREE from "three";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";

const canvas = document.getElementById("three-canvas");

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5;

// Renderer setup
const renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
renderer.setSize(window.innerWidth, window.innerHeight);

// Glowing Cube ShaderMaterial
const glowCubeMaterial = new THREE.ShaderMaterial({
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
      vec3 glowColor = vec3(1.0, 1.0, 1.0); // Constant white glow
      gl_FragColor = vec4(glowColor, 1.0);
    }
  `,
});

// Glowing cube (light source)
const glowCubeGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
const glowCube = new THREE.Mesh(glowCubeGeometry, glowCubeMaterial);
scene.add(glowCube);

// Custom ShaderMaterial logic for text meshes
const calculateAmbientIntensity = (lastThreeDigits) => {
  const abc = lastThreeDigits + 200;
  return abc / 1000;
};
const ambientIntensity = calculateAmbientIntensity(33);

const createCharacterMaterial = (baseColor, isMetallic) => {
  return new THREE.ShaderMaterial({
    uniforms: {
      lightPosition: { value: glowCube.position },
      viewPosition: { value: camera.position },
      baseColor: { value: new THREE.Color(baseColor) },
      ambientIntensity: { value: ambientIntensity },
      shininess: { value: isMetallic ? 100.0 : 50.0 },
    },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vPosition;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vPosition = (modelMatrix * vec4(position, 1.0)).xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 lightPosition;
      uniform vec3 viewPosition;
      uniform vec3 baseColor;
      uniform float ambientIntensity;
      uniform float shininess;
      varying vec3 vNormal;
      varying vec3 vPosition;

      void main() {
        // Ambient component
        vec3 ambient = ambientIntensity * baseColor;

        // Diffuse component
        vec3 lightDir = normalize(lightPosition - vPosition);
        float diff = max(dot(vNormal, lightDir), 0.0);
        vec3 diffuse = diff * baseColor;

        // Specular component
        vec3 viewDir = normalize(viewPosition - vPosition);
        vec3 reflectDir = reflect(-lightDir, vNormal);
        float spec = pow(max(dot(viewDir, reflectDir), 0.0), shininess);
        vec3 specular = (shininess > 50.0 ? baseColor : vec3(1.0)) * spec;

        // Combine lighting components
        vec3 color = ambient + diffuse + specular;
        gl_FragColor = vec4(color, 1.0);
      }
    `,
  });
};

// Load font and add text meshes
const fontLoader = new FontLoader();
fontLoader.load("https://threejs.org/examples/fonts/helvetiker_regular.typeface.json", (font) => {
  const alphabetMaterial = createCharacterMaterial("#159C31", false); // Plastic-like
  const digitMaterial = createCharacterMaterial("#C82F19", true); // Metallic-like

  const createText = (text, material, position) => {
    const textGeometry = new TextGeometry(text, {
      font,
      size: 2.5,
      height: 0.2,
    });
    const textMesh = new THREE.Mesh(textGeometry, material);
    textMesh.position.set(...position);
    scene.add(textMesh);
  };

  createText("n", alphabetMaterial, [-3, -1, 0]);
  createText("3", digitMaterial, [1, -1, 0]);
});

// Event handlers for cube and camera movement
const handleKeyDown = (event) => {
  switch (event.key) {
    case "w":
      glowCube.position.y += 0.1; // Move cube up
      break;
    case "s":
      glowCube.position.y -= 0.1; // Move cube down
      break;
    case "a":
      camera.position.x += 0.1; // Move camera left
      break;
    case "d":
      camera.position.x -= 0.1; // Move camera right
      break;
  }
};
window.addEventListener("keydown", handleKeyDown);

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();

// Handle resizing
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});