// To run the code, use npx vite in the terminal.

import * as THREE from "three";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";

// Retrieve the canvas element from the HTML
const canvas = document.getElementById("three-canvas");

// Scene setup: create a container for objects, lights, and the camera
const scene = new THREE.Scene();

// Camera setup
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5; // Position the camera slightly away from the center

// Renderer setup: create a WebGL renderer to display the 3D scene
const renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
renderer.setSize(window.innerWidth, window.innerHeight); // Match the canvas size to the window

// Shader material for the glowing cube (point light source)
// The cube is white to simulate a bright light source
const glowCubeMaterial = new THREE.ShaderMaterial({
  vertexShader: `
    varying vec3 vPosition; // Pass position data to the fragment shader
    void main() {
      vPosition = position; // Store vertex position in vPosition
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); // Transform vertex position
    }
  `,
  fragmentShader: `
    varying vec3 vPosition; // Receive position data from vertex shader
    void main() {
      vec3 glowColor = vec3(1.0, 1.0, 1.0); // Set the glowing cube color to white
      gl_FragColor = vec4(glowColor, 1.0); // Assign color to the fragment
    }
  `,
});

// Create a small cube that serves as the dynamic point light source
const glowCubeGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
const glowCube = new THREE.Mesh(glowCubeGeometry, glowCubeMaterial);
scene.add(glowCube); // Add the cube to the scene

// Function to calculate ambient light intensity
const calculateAmbientIntensity = (lastThreeDigits) => {
  const abc = lastThreeDigits + 200; // Add 200 as instructed
  return abc / 1000; // Normalize to a fraction
};
const ambientIntensity = calculateAmbientIntensity(33); // Last three student digits 033 is written as 33

// Function to create materials for alphabet and digit meshes
const createCharacterMaterial = (baseColor, isMetallic) => {
  return new THREE.ShaderMaterial({
    uniforms: {
      lightPosition: { value: glowCube.position }, // Position of the glowing cube
      viewPosition: { value: camera.position }, // Camera position for specular reflections
      baseColor: { value: new THREE.Color(baseColor) }, // Base color of the material
      ambientIntensity: { value: ambientIntensity }, // Ambient light intensity
      metallic: { value: isMetallic ? 1.0 : 0.0 }, // Metallic property: 1 for metallic, 0 for plastic
      roughness: { value: isMetallic ? 0.2 : 0.5 }, // Roughness value to control specular sharpness
    },
    vertexShader: `
      varying vec3 vNormal; // Pass normal vector to fragment shader
      varying vec3 vPosition; // Pass position vector to fragment shader
      void main() {
        vNormal = normalize(normalMatrix * normal); // Transform normal to world space
        vPosition = (modelMatrix * vec4(position, 1.0)).xyz; // Transform vertex position to world space
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); // Transform vertex to screen space
      }
    `,
    fragmentShader: `
      uniform vec3 lightPosition; // Position of the light source
      uniform vec3 viewPosition; // Position of the camera
      uniform vec3 baseColor; // Base color of the material
      uniform float ambientIntensity; // Intensity of ambient light
      uniform float metallic; // Indicates metallic or non-metallic surface
      uniform float roughness; // Roughness value for specular highlights

      varying vec3 vNormal; // Normal vector passed from vertex shader
      varying vec3 vPosition; // Position vector passed from vertex shader

      void main() {
        // Calculate ambient lighting
        vec3 ambient = ambientIntensity * baseColor;

        // Calculate diffuse lighting
        vec3 lightDir = normalize(lightPosition - vPosition); // Light direction
        float diff = max(dot(vNormal, lightDir), 0.0); // Diffuse intensity
        vec3 diffuse = (1.0 - metallic) * diff * baseColor; // Scale diffuse by metallic

        // Calculate specular lighting
        vec3 viewDir = normalize(viewPosition - vPosition); // Direction to the camera
        vec3 halfDir = normalize(lightDir + viewDir); // Halfway vector between light and view directions
        float spec = pow(max(dot(vNormal, halfDir), 0.0), 1.0 / roughness); // Specular intensity
        vec3 specular = mix(vec3(1.0), baseColor, metallic) * spec; // Adjust specular for metallic materials

        // Combine lighting components
        vec3 color = ambient + diffuse + specular;
        gl_FragColor = vec4(color, 1.0); // Set final fragment color
      }
    `,
  });
};

// Load the font and create the text meshes for "n" and "3"
const fontLoader = new FontLoader();
fontLoader.load("https://threejs.org/examples/fonts/helvetiker_regular.typeface.json", (font) => {
  // Alphabet material: North Texas Green
  const alphabetMaterial = createCharacterMaterial("#159C31", false);

  // Digit material: Dark Pastel Red
  const digitMaterial = createCharacterMaterial("#C82F19", true);

  // Helper function to create and position text
  const createText = (text, material, position) => {
    const textGeometry = new TextGeometry(text, {
      font,
      size: 2.5, // Font size
      height: 0.2, // Depth of the text
    });
    const textMesh = new THREE.Mesh(textGeometry, material);
    textMesh.position.set(...position); // Set position in 3D space
    scene.add(textMesh); // Add text to the scene
  };

  // Add text meshes for "n" and "3"
  createText("n", alphabetMaterial, [-3, -1, 0]);
  createText("3", digitMaterial, [1, -1, 0]);
});

// Handle keyboard input for cube and camera movement
const handleKeyDown = (event) => {
  switch (event.key) {
    case "w":
      glowCube.position.y += 0.1; // Move cube up
      break;
    case "s":
      glowCube.position.y -= 0.1; // Move cube down
      break;
    case "a":
      camera.position.x += 0.1; // Pan camera right
      break;
    case "d":
      camera.position.x -= 0.1; // Pan camera left
      break;
  }
};
window.addEventListener("keydown", handleKeyDown);

// Animation loop to render the scene continuously
function animate() {
  requestAnimationFrame(animate); // Request the next frame
  renderer.render(scene, camera); // Render the scene
}
animate();

// Handle window resizing to maintain aspect ratio
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight; // Update aspect ratio
  camera.updateProjectionMatrix(); // Update projection matrix
  renderer.setSize(window.innerWidth, window.innerHeight); // Resize the renderer
});