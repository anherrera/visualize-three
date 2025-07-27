import * as THREE from 'three';

// Scene setup
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x000033, 0.0008);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
camera.position.set(0, 50, 100);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

// Audio setup
let audioContext;
let analyser;
let microphone;
let dataArray;
let isListening = false;

// Central star
const starGeometry = new THREE.SphereGeometry(5, 32, 32);
const starMaterial = new THREE.MeshBasicMaterial({
    color: 0xffff00,
    emissive: 0xffaa00,
    emissiveIntensity: 1
});
const star = new THREE.Mesh(starGeometry, starMaterial);
scene.add(star);

// Star glow
const glowGeometry = new THREE.SphereGeometry(8, 32, 32);
const glowMaterial = new THREE.MeshBasicMaterial({
    color: 0xffaa00,
    transparent: true,
    opacity: 0.3
});
const starGlow = new THREE.Mesh(glowGeometry, glowMaterial);
scene.add(starGlow);

// Galaxy parameters
const galaxyParams = {
    count: 20000,
    size: 0.01,
    radius: 100,
    branches: 5,
    spin: 1,
    randomness: 0.2,
    randomnessPower: 3,
    insideColor: 0xff6030,
    outsideColor: 0x1b3984
};

// Galaxy geometry
let galaxyGeometry = null;
let galaxyMaterial = null;
let galaxy = null;

const generateGalaxy = () => {
    // Clean up old galaxy
    if (galaxy !== null) {
        galaxyGeometry.dispose();
        galaxyMaterial.dispose();
        scene.remove(galaxy);
    }

    galaxyGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(galaxyParams.count * 3);
    const colors = new Float32Array(galaxyParams.count * 3);
    const scales = new Float32Array(galaxyParams.count);

    const insideColor = new THREE.Color(galaxyParams.insideColor);
    const outsideColor = new THREE.Color(galaxyParams.outsideColor);

    for (let i = 0; i < galaxyParams.count; i++) {
        const i3 = i * 3;

        // Position
        const radius = Math.random() * galaxyParams.radius;
        const spinAngle = radius * galaxyParams.spin;
        const branchAngle = (i % galaxyParams.branches) / galaxyParams.branches * Math.PI * 2;

        const randomX = Math.pow(Math.random(), galaxyParams.randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * galaxyParams.randomness * radius;
        const randomY = Math.pow(Math.random(), galaxyParams.randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * galaxyParams.randomness * radius;
        const randomZ = Math.pow(Math.random(), galaxyParams.randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * galaxyParams.randomness * radius;

        positions[i3] = Math.cos(branchAngle + spinAngle) * radius + randomX;
        positions[i3 + 1] = randomY;
        positions[i3 + 2] = Math.sin(branchAngle + spinAngle) * radius + randomZ;

        // Color
        const mixedColor = insideColor.clone();
        mixedColor.lerp(outsideColor, radius / galaxyParams.radius);

        colors[i3] = mixedColor.r;
        colors[i3 + 1] = mixedColor.g;
        colors[i3 + 2] = mixedColor.b;

        // Scale
        scales[i] = Math.random();
    }

    galaxyGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    galaxyGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    galaxyGeometry.setAttribute('scale', new THREE.BufferAttribute(scales, 1));

    // Material
    galaxyMaterial = new THREE.PointsMaterial({
        size: galaxyParams.size * 100,
        sizeAttenuation: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexColors: true,
        transparent: true,
        opacity: 0.8
    });

    // Points
    galaxy = new THREE.Points(galaxyGeometry, galaxyMaterial);
    scene.add(galaxy);
};

generateGalaxy();

// Nebula clouds
const nebulaMaterial = new THREE.MeshBasicMaterial({
    color: 0x4444ff,
    transparent: true,
    opacity: 0.05,
    side: THREE.DoubleSide
});

for (let i = 0; i < 10; i++) {
    const nebulaGeometry = new THREE.SphereGeometry(
        Math.random() * 20 + 10,
        8,
        8
    );
    const nebula = new THREE.Mesh(nebulaGeometry, nebulaMaterial);
    nebula.position.set(
        (Math.random() - 0.5) * 200,
        (Math.random() - 0.5) * 50,
        (Math.random() - 0.5) * 200
    );
    nebula.scale.set(
        Math.random() + 1,
        Math.random() * 0.5 + 0.5,
        Math.random() + 1
    );
    scene.add(nebula);
}

// Create start button
const button = document.createElement('button');
button.innerText = 'Start Audio';
button.style.position = 'absolute';
button.style.top = '20px';
button.style.left = '20px';
button.style.padding = '10px 20px';
button.style.fontSize = '16px';
button.style.backgroundColor = '#00ff00';
button.style.border = 'none';
button.style.borderRadius = '5px';
button.style.cursor = 'pointer';
button.style.zIndex = '1000';
document.body.appendChild(button);

// Initialize audio on button click
button.addEventListener('click', async () => {
    if (!isListening) {
        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            analyser = audioContext.createAnalyser();
            analyser.fftSize = 256;
            
            const bufferLength = analyser.frequencyBinCount;
            dataArray = new Uint8Array(bufferLength);
            
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            microphone = audioContext.createMediaStreamSource(stream);
            microphone.connect(analyser);
            
            isListening = true;
            button.innerText = 'Stop Audio';
            button.style.backgroundColor = '#ff0000';
        } catch (err) {
            console.error('Error accessing microphone:', err);
            alert('Please allow microphone access to use this visualization');
        }
    } else {
        if (microphone) {
            microphone.disconnect();
            audioContext.close();
        }
        isListening = false;
        button.innerText = 'Start Audio';
        button.style.backgroundColor = '#00ff00';
    }
});

// Animation
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);
    const elapsedTime = clock.getElapsedTime();
    
    // Rotate galaxy
    if (galaxy) {
        galaxy.rotation.y = elapsedTime * 0.05;
    }
    
    // Gentle camera movement
    camera.position.x = Math.sin(elapsedTime * 0.1) * 100;
    camera.position.z = Math.cos(elapsedTime * 0.1) * 100;
    camera.lookAt(0, 0, 0);
    
    if (isListening && analyser) {
        analyser.getByteFrequencyData(dataArray);
        
        // Calculate average volume and bass
        const avgVolume = dataArray.reduce((a, b) => a + b) / dataArray.length / 255;
        const bass = dataArray.slice(0, 10).reduce((a, b) => a + b) / 10 / 255;
        
        // Pulse star based on bass
        const starScale = 1 + bass * 2;
        star.scale.set(starScale, starScale, starScale);
        starGlow.scale.set(starScale * 1.5, starScale * 1.5, starScale * 1.5);
        
        // Update star brightness
        starMaterial.emissiveIntensity = 1 + bass * 2;
        glowMaterial.opacity = 0.3 + bass * 0.5;
        
        // Make galaxy particles dance
        if (galaxyGeometry) {
            const positions = galaxyGeometry.attributes.position.array;
            const scales = galaxyGeometry.attributes.scale.array;
            
            for (let i = 0; i < scales.length; i++) {
                scales[i] = Math.random() * (1 + avgVolume * 2);
            }
            galaxyGeometry.attributes.scale.needsUpdate = true;
        }
        
        // Speed up rotation with volume
        if (galaxy) {
            galaxy.rotation.y += avgVolume * 0.01;
        }
    }
    
    renderer.render(scene, camera);
}

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();