// Import Three.js and required extras
import * as THREE from "three";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";

// Canvas Element
const canvas = document.getElementById("three-canvas");

// Scene Setup
// The scene is where all objects, lights, and cameras are added.
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5; // Position the camera to view the scene.

// Renderer Setup
// The renderer draws the scene from the perspective of the camera.
const renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
renderer.setSize(window.innerWidth, window.innerHeight); // Match the size of the canvas to the window dimensions.

// Glow Cube ShaderMaterial
// Creates a glowing effect for the cube, acting as a light source.
const glowCubeMaterial = new THREE.ShaderMaterial({
  vertexShader: `
    // Vertex Shader for the glowing cube
    // Pass the vertex position to the fragment shader.

    varying vec3 vPosition; // Position of the vertex in local space.

    void main() {
      // Pass the local position of the vertex to the fragment shader.
      vPosition = position;

      // Transform the vertex position to screen space for rendering.
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    // Fragment Shader for the glowing cube
    // Outputs a constant glowing color.

    varying vec3 vPosition; // Position of the vertex, interpolated for the fragment.

    void main() {
      // Glow Color
      // Constant white color to simulate a glowing effect.
      vec3 glowColor = vec3(1.0, 1.0, 1.0);

      // Set the final color of the fragment.
      gl_FragColor = vec4(glowColor, 1.0); // RGBA format (R, G, B, Alpha).
    }
  `,
});

// Create a glowing cube to act as a dynamic light source.
const glowCubeGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
const glowCube = new THREE.Mesh(glowCubeGeometry, glowCubeMaterial);
scene.add(glowCube);

// Function to calculate ambient intensity
// Takes the last three digits of an ID, adds 200, and normalizes the value.
const calculateAmbientIntensity = (lastThreeDigits) => {
  const abc = lastThreeDigits + 200;
  return abc / 1000; // Convert to ambient intensity (0.abc).
};
const ambientIntensity = calculateAmbientIntensity(33); // Example input for last three digits.

// Function to create ShaderMaterial for character meshes
// Takes a base color and metallic property to create materials with custom shading.
const createCharacterMaterial = (baseColor, isMetallic) => {
  return new THREE.ShaderMaterial({
    uniforms: {
      lightPosition: { value: glowCube.position }, // Position of the light source (cube).
      viewPosition: { value: camera.position },   // Position of the camera/viewer.
      baseColor: { value: new THREE.Color(baseColor) }, // Base color of the material.
      ambientIntensity: { value: ambientIntensity },    // Ambient light intensity.
      metallic: { value: isMetallic ? 1.0 : 0.0 },      // Metallic property (1 for metal, 0 for plastic).
      roughness: { value: isMetallic ? 0.1 : 0.6 },     // Roughness of the surface.
    },
    vertexShader: `
      // Vertex Shader for character materials
      // Passes transformed vertex data to the fragment shader for lighting calculations.

      varying vec3 vNormal;    // Normal vector of the surface at the vertex, in world space.
      varying vec3 vPosition;  // Position of the vertex, in world space.

      void main() {
        // Transform the normal vector to world space.
        vNormal = normalize(normalMatrix * normal);

        // Transform the vertex position to world space.
        vPosition = (modelMatrix * vec4(position, 1.0)).xyz;

        // Transform the vertex position to screen space for rendering.
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      // Fragment Shader for character materials
      // Calculates the final color of the material using ambient, diffuse, and specular components.

      uniform vec3 lightPosition;       // Position of the light source (cube) in world space.
      uniform vec3 viewPosition;        // Position of the camera/viewer in world space.
      uniform vec3 baseColor;           // Base color of the material.
      uniform float ambientIntensity;   // Intensity of ambient lighting (constant illumination).
      uniform float metallic;           // Determines the metallic quality of the material (0 = plastic, 1 = metal).
      uniform float roughness;          // Determines the roughness of the surface (lower = sharper highlights).

      varying vec3 vNormal;             // Interpolated surface normal at the fragment.
      varying vec3 vPosition;           // Interpolated surface position at the fragment.

      void main() {
        // Ambient Lighting
        vec3 ambient = ambientIntensity * baseColor;

        // Diffuse Lighting
        vec3 lightDir = normalize(lightPosition - vPosition);  // Direction from the surface to the light source.
        float diff = max(dot(vNormal, lightDir), 0.0);         // Cosine of the angle between the surface normal and light direction.
        vec3 diffuse = (1.0 - metallic) * diff * baseColor;    // Reduce diffuse effect for metallic materials.

        // Specular Lighting
        vec3 viewDir = normalize(viewPosition - vPosition);    // Direction from the surface to the viewer.
        vec3 halfDir = normalize(lightDir + viewDir);          // Halfway vector between light direction and view direction.
        float spec = pow(max(dot(vNormal, halfDir), 0.0), 1.0 / roughness);  // Shininess of the specular highlight.
        vec3 specular = mix(vec3(1.0), baseColor, metallic) * spec;  // Metallic materials have a specular tint matching the base color.

        // Combine Ambient, Diffuse, and Specular Components
        vec3 color = ambient + diffuse + specular;

        // Set the final color of the fragment.
        gl_FragColor = vec4(color, 1.0);  // RGBA format (R, G, B, Alpha).
      }
    `,
  });
};

// Load font and add text meshes to the scene
const fontLoader = new FontLoader();
fontLoader.load("https://threejs.org/examples/fonts/helvetiker_regular.typeface.json", (font) => {
  // Alphabet Material (Plastic-like)
  const alphabetMaterial = createCharacterMaterial("#159C31", false);

  // Digit Material (Metal-like)
  const digitMaterial = createCharacterMaterial("#C82F19", true);

  // Helper function to create and position text
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

  // Add "n" (alphabet) and "3" (digit) to the scene
  createText("n", alphabetMaterial, [-3, -1, 0]);
  createText("3", digitMaterial, [1, -1, 0]);
});

// Keyboard Controls for Cube and Camera Movement
const handleKeyDown = (event) => {
  switch (event.key) {
    case "w":
      glowCube.position.y += 0.1; // Move cube up.
      break;
    case "s":
      glowCube.position.y -= 0.1; // Move cube down.
      break;
    case "a":
      camera.position.x += 0.1; // Move camera left.
      break;
    case "d":
      camera.position.x -= 0.1; // Move camera right.
      break;
  }
};
window.addEventListener("keydown", handleKeyDown);

// Animation Loop
// Continuously renders the scene and updates the visuals.
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();

// Handle Window Resizing
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});