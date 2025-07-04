// Main Three.js variables
let scene, camera, renderer, controls;
let planets = [];
let stars = [];
let animationId = null;
let isPaused = false;
let clock = new THREE.Clock();

// Planet data
const planetData = [
    { name: 'Sun', radius: 10, color: 0xFDB813, orbitRadius: 0, speed: 0, rotationSpeed: 0.01 },
    { name: 'Mercury', radius: 0.4, color: 0xA9A9A9, orbitRadius: 20, speed: 0.04, rotationSpeed: 0.004 },
    { name: 'Venus', radius: 0.9, color: 0xE6C229, orbitRadius: 30, speed: 0.015, rotationSpeed: 0.002 },
    { name: 'Earth', radius: 1, color: 0x6B93D6, orbitRadius: 40, speed: 0.01, rotationSpeed: 0.02 },
    { name: 'Mars', radius: 0.5, color: 0x993D00, orbitRadius: 50, speed: 0.008, rotationSpeed: 0.018 },
    { name: 'Jupiter', radius: 2.5, color: 0xB07F35, orbitRadius: 70, speed: 0.002, rotationSpeed: 0.04 },
    { name: 'Saturn', radius: 2, color: 0xE4D191, orbitRadius: 90, speed: 0.0009, rotationSpeed: 0.038, hasRing: true },
    { name: 'Uranus', radius: 1.5, color: 0x4FD0E7, orbitRadius: 110, speed: 0.0004, rotationSpeed: 0.03 },
    { name: 'Neptune', radius: 1.5, color: 0x4B70DD, orbitRadius: 130, speed: 0.0001, rotationSpeed: 0.032 }
];

// Initialize the scene
function init() {
    // Create scene
    scene = new THREE.Scene();
    
    // Create camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 50, 150);
    
    // Create renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('scene-container').appendChild(renderer.domElement);
    
    // Add orbit controls
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    
    // Add lighting
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);
    
    // Add stars background
    createStars();
    
    // Create planets
    createPlanets();
    
    // Create speed controls
    createSpeedControls();
    
    // Add event listeners
    setupEventListeners();
    
    // Start animation
    animate();
    
    // Handle window resize
    window.addEventListener('resize', onWindowResize);
}

// Create stars background
function createStars() {
    const starGeometry = new THREE.BufferGeometry();
    const starMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.1
    });
    
    const starVertices = [];
    for (let i = 0; i < 10000; i++) {
        const x = (Math.random() - 0.5) * 2000;
        const y = (Math.random() - 0.5) * 2000;
        const z = (Math.random() - 0.5) * 2000;
        starVertices.push(x, y, z);
    }
    
    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
    const starsMesh = new THREE.Points(starGeometry, starMaterial);
    scene.add(starsMesh);
}

// Create planets and their orbits
function createPlanets() {
    planetData.forEach((planet, index) => {
        // Create planet
        const geometry = new THREE.SphereGeometry(planet.radius, 32, 32);
        const material = new THREE.MeshPhongMaterial({ 
            color: planet.color,
            shininess: 10
        });
        const planetMesh = new THREE.Mesh(geometry, material);
        
        // Position planets (except Sun)
        if (index !== 0) {
            planetMesh.position.x = planet.orbitRadius;
        }
        
        // Add to scene and planets array
        scene.add(planetMesh);
        planets.push({
            mesh: planetMesh,
            data: planet,
            angle: Math.random() * Math.PI * 2
        });
        
        // Create orbit path
        if (index !== 0) {
            const orbitGeometry = new THREE.BufferGeometry();
            const orbitMaterial = new THREE.LineBasicMaterial({ color: 0x555555, transparent: true, opacity: 0.5 });
            const orbitPoints = [];
            
            for (let i = 0; i <= 64; i++) {
                const angle = (i / 64) * Math.PI * 2;
                const x = planet.orbitRadius * Math.cos(angle);
                const z = planet.orbitRadius * Math.sin(angle);
                orbitPoints.push(new THREE.Vector3(x, 0, z));
            }
            
            orbitGeometry.setFromPoints(orbitPoints);
            const orbitLine = new THREE.Line(orbitGeometry, orbitMaterial);
            scene.add(orbitLine);
        }
        
        // Add rings to Saturn
        if (planet.hasRing) {
            const ringGeometry = new THREE.RingGeometry(planet.radius * 1.5, planet.radius * 2, 32);
            const ringMaterial = new THREE.MeshPhongMaterial({
                color: 0xE4D191,
                side: THREE.DoubleSide
            });
            const ringMesh = new THREE.Mesh(ringGeometry, ringMaterial);
            ringMesh.rotation.x = Math.PI / 2;
            planetMesh.add(ringMesh);
        }
    });
}

// Create speed controls UI
function createSpeedControls() {
    const controlsContainer = document.getElementById('speed-controls');
    
    planetData.slice(1).forEach((planet, index) => {
        const controlDiv = document.createElement('div');
        controlDiv.className = 'planet-control';
        
        const label = document.createElement('label');
        label.textContent = planet.name;
        label.htmlFor = `speed-${planet.name.toLowerCase()}`;
        
        const input = document.createElement('input');
        input.type = 'range';
        input.id = `speed-${planet.name.toLowerCase()}`;
        input.min = '0';
        input.max = '0.1';
        input.step = '0.001';
        input.value = planet.speed;
        
        const valueDisplay = document.createElement('span');
        valueDisplay.textContent = planet.speed.toFixed(3);
        
        input.addEventListener('input', () => {
            planets[index + 1].data.speed = parseFloat(input.value);
            valueDisplay.textContent = input.value;
        });
        
        controlDiv.appendChild(label);
        controlDiv.appendChild(input);
        controlDiv.appendChild(valueDisplay);
        controlsContainer.appendChild(controlDiv);
    });
}

// Setup event listeners for buttons
function setupEventListeners() {
    document.getElementById('pause-resume').addEventListener('click', togglePause);
    document.getElementById('reset-speeds').addEventListener('click', resetSpeeds);
    document.getElementById('toggle-dark').addEventListener('click', toggleDarkMode);
}

// Toggle animation pause/resume
function togglePause() {
    isPaused = !isPaused;
    document.getElementById('pause-resume').textContent = isPaused ? 'Resume' : 'Pause';
}

// Reset all planet speeds to default
function resetSpeeds() {
    planetData.slice(1).forEach((planet, index) => {
        planets[index + 1].data.speed = planet.speed;
        const input = document.getElementById(`speed-${planet.name.toLowerCase()}`);
        input.value = planet.speed;
        input.dispatchEvent(new Event('input'));
    });
}

// Toggle dark/light mode
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
}

// Animation loop
function animate() {
    animationId = requestAnimationFrame(animate);
    
    if (!isPaused) {
        const delta = clock.getDelta();
        
        // Update planets
        planets.forEach((planet, index) => {
            if (index !== 0) { // Skip the Sun
                // Orbit animation
                planet.angle += planet.data.speed * delta * 10;
                planet.mesh.position.x = planet.data.orbitRadius * Math.cos(planet.angle);
                planet.mesh.position.z = planet.data.orbitRadius * Math.sin(planet.angle);
                
                // Rotation animation
                planet.mesh.rotation.y += planet.data.rotationSpeed * delta * 10;
            } else {
                // Sun rotation
                planet.mesh.rotation.y += planet.data.rotationSpeed * delta * 10;
            }
        });
    }
    
    controls.update();
    renderer.render(scene, camera);
}

// Handle window resize
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Clean up
function cleanup() {
    cancelAnimationFrame(animationId);
    window.removeEventListener('resize', onWindowResize);
    document.getElementById('pause-resume').removeEventListener('click', togglePause);
    document.getElementById('reset-speeds').removeEventListener('click', resetSpeeds);
    document.getElementById('toggle-dark').removeEventListener('click', toggleDarkMode);
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', init);

// Clean up when leaving the page
window.addEventListener('beforeunload', cleanup);

