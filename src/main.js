// To see the result, use npx vite in the terminal.

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
    // Pass the position of each vertex to the fragment shader
    varying vec3 vPosition;
    void main() {
      vPosition = position; // Pass the local position of the vertex
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); // Transform vertex to screen space
    }
  `,
  fragmentShader: `
    // Receive the interpolated position from the vertex shader
    varying vec3 vPosition;

    void main() {
      // Constant glow color for the cube
      vec3 glowColor = vec3(1.0, 1.0, 1.0); // White color for glowing effect
      gl_FragColor = vec4(glowColor, 1.0); // Output the final color
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
  return abc / 1000; // Convert to ambient intensity (0.abc)
};
const ambientIntensity = calculateAmbientIntensity(33);

const createCharacterMaterial = (baseColor, isMetallic) => {
  return new THREE.ShaderMaterial({
    uniforms: {
      lightPosition: { value: glowCube.position }, // Position of the light source (glowing cube)
      viewPosition: { value: camera.position }, // Position of the camera/viewer
      baseColor: { value: new THREE.Color(baseColor) }, // Base color of the material
      ambientIntensity: { value: ambientIntensity }, // Ambient light intensity
      shininess: { value: isMetallic ? 100.0 : 50.0 }, // Shininess for specular reflection
    },
    vertexShader: `
      // Variables to pass data to the fragment shader
      varying vec3 vNormal; // Normal vector for lighting calculations
      varying vec3 vPosition; // World position of the vertex

      void main() {
        // Transform normal vector to world space
        vNormal = normalize(normalMatrix * normal); 
        // Compute world position of the vertex
        vPosition = (modelMatrix * vec4(position, 1.0)).xyz; 
        // Transform vertex to screen space
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); 
      }
    `,
    fragmentShader: `
      // Uniforms from JavaScript
      uniform vec3 lightPosition; // Position of the light source
      uniform vec3 viewPosition; // Position of the camera/viewer
      uniform vec3 baseColor; // Base color of the material
      uniform float ambientIntensity; // Intensity of ambient light
      uniform float shininess; // Shininess value for specular reflection

      // Varying inputs from the vertex shader
      varying vec3 vNormal; // Normal vector at the fragment
      varying vec3 vPosition; // World position of the fragment

      void main() {
        // Ambient lighting (constant base light)
        vec3 ambient = ambientIntensity * baseColor;

        // Diffuse lighting (angle-dependent light)
        vec3 lightDir = normalize(lightPosition - vPosition); // Direction from fragment to light
        float diff = max(dot(vNormal, lightDir), 0.0); // Dot product for light intensity
        vec3 diffuse = diff * baseColor;

        // Specular lighting (reflected light highlights)
        vec3 viewDir = normalize(viewPosition - vPosition); // Direction from fragment to camera
        vec3 reflectDir = reflect(-lightDir, vNormal); // Reflection direction of the light
        float spec = pow(max(dot(viewDir, reflectDir), 0.0), shininess); // Specular intensity
        vec3 specular = (shininess > 50.0 ? baseColor : vec3(1.0)) * spec; // Specular color

        // Combine ambient, diffuse, and specular components
        vec3 color = ambient + diffuse + specular;
        gl_FragColor = vec4(color, 1.0); // Output the final color
      }
    `,
  });
};

// Load font and add text meshes
const fontLoader = new FontLoader();
fontLoader.load("https://threejs.org/examples/fonts/helvetiker_regular.typeface.json", (font) => {
  const alphabetMaterial = createCharacterMaterial("#159C31", false); // Plastic-like material
  const digitMaterial = createCharacterMaterial("#C82F19", true); // Metallic-like material

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