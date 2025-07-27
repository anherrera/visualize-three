import * as THREE from 'three';

// Scene setup
const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x000000, 1, 1000);
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 30;

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Audio setup
let audioContext;
let analyser;
let microphone;
let dataArray;
let isListening = false;

// Visual elements
const bars = [];
const numBars = 64;
const barWidth = 0.5;
const barSpacing = 0.6;

// Create frequency bars
const barGeometry = new THREE.BoxGeometry(barWidth, 1, barWidth);
for (let i = 0; i < numBars; i++) {
    const material = new THREE.MeshBasicMaterial({ 
        color: new THREE.Color().setHSL(i / numBars, 1, 0.5),
        emissive: new THREE.Color().setHSL(i / numBars, 1, 0.5),
        emissiveIntensity: 0.5
    });
    
    const bar = new THREE.Mesh(barGeometry, material);
    bar.position.x = (i - numBars / 2) * barSpacing;
    bars.push(bar);
    scene.add(bar);
}

// Add particle system for extra effect
const particleCount = 1000;
const particleGeometry = new THREE.BufferGeometry();
const positions = new Float32Array(particleCount * 3);
const velocities = new Float32Array(particleCount * 3);

for (let i = 0; i < particleCount * 3; i += 3) {
    positions[i] = (Math.random() - 0.5) * 50;
    positions[i + 1] = (Math.random() - 0.5) * 50;
    positions[i + 2] = (Math.random() - 0.5) * 50;
    
    velocities[i] = (Math.random() - 0.5) * 0.1;
    velocities[i + 1] = Math.random() * 0.2;
    velocities[i + 2] = (Math.random() - 0.5) * 0.1;
}

particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
const particleMaterial = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.5,
    opacity: 0.6,
    transparent: true
});
const particles = new THREE.Points(particleGeometry, particleMaterial);
scene.add(particles);

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
function animate() {
    requestAnimationFrame(animate);
    
    if (isListening && analyser) {
        analyser.getByteFrequencyData(dataArray);
        
        // Update bars based on frequency data
        for (let i = 0; i < bars.length; i++) {
            const dataIndex = Math.floor(i * dataArray.length / bars.length);
            const scale = dataArray[dataIndex] / 128.0;
            
            bars[i].scale.y = Math.max(0.1, scale * 20);
            bars[i].position.y = bars[i].scale.y / 2 - 10;
            
            // Update color intensity based on amplitude
            bars[i].material.emissiveIntensity = scale;
        }
        
        // Make particles react to overall volume
        const avgVolume = dataArray.reduce((a, b) => a + b) / dataArray.length;
        const particlePositions = particles.geometry.attributes.position.array;
        
        for (let i = 0; i < particleCount * 3; i += 3) {
            particlePositions[i + 1] += velocities[i + 1] * (avgVolume / 128);
            
            if (particlePositions[i + 1] > 25) {
                particlePositions[i + 1] = -25;
            }
        }
        particles.geometry.attributes.position.needsUpdate = true;
    }
    
    // Rotate the entire scene slowly
    scene.rotation.y += 0.002;
    
    renderer.render(scene, camera);
}

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();