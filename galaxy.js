import * as THREE from 'three';

// Scene setup
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x000011, 0.0003);

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

// Central star with gradient shader
const starMaterial = new THREE.ShaderMaterial({
    uniforms: {
        glowColor: { value: new THREE.Color(0xffff88) },
        coreColor: { value: new THREE.Color(0xffffff) },
        viewVector: { value: new THREE.Vector3() }
    },
    vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPositionNormal;
        void main() {
            vNormal = normalize(normalMatrix * normal);
            vPositionNormal = normalize((modelViewMatrix * vec4(position, 1.0)).xyz);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform vec3 glowColor;
        uniform vec3 coreColor;
        varying vec3 vNormal;
        varying vec3 vPositionNormal;
        void main() {
            float intensity = pow(0.7 - dot(vNormal, vPositionNormal), 2.0);
            vec3 color = mix(coreColor, glowColor, intensity);
            gl_FragColor = vec4(color, 1.0);
        }
    `,
    side: THREE.FrontSide,
    blending: THREE.AdditiveBlending,
    transparent: true
});

const starGeometry = new THREE.SphereGeometry(1.5, 32, 32);
const star = new THREE.Mesh(starGeometry, starMaterial);
scene.add(star);

// Create soft glow layers around the star
const glowLayers = [];
const numLayers = 5;

for (let i = 0; i < numLayers; i++) {
    const size = 3 + i * 4;
    const glowGeometry = new THREE.SphereGeometry(size, 32, 32);
    const glowMaterial = new THREE.MeshBasicMaterial({
        color: new THREE.Color().setHSL(0.1, 0.8, 0.7),
        transparent: true,
        opacity: 0.1,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
        depthWrite: false
    });
    const glowSphere = new THREE.Mesh(glowGeometry, glowMaterial);
    glowLayers.push(glowSphere);
    scene.add(glowSphere);
}

// Add point light for extra glow effect
const starLight = new THREE.PointLight(0xffff88, 2, 100);
scene.add(starLight);

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
        positions[i3 + 1] = randomY * 0.1;
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

    // Create circular texture for particles
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 16;
    const context = canvas.getContext('2d');
    const gradient = context.createRadialGradient(8, 8, 0, 8, 8, 8);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.4, 'rgba(255,255,255,0.8)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, 16, 16);
    const texture = new THREE.CanvasTexture(canvas);
    
    // Material
    galaxyMaterial = new THREE.PointsMaterial({
        size: galaxyParams.size * 50,
        sizeAttenuation: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexColors: true,
        transparent: true,
        opacity: 0.9,
        map: texture
    });

    // Points
    galaxy = new THREE.Points(galaxyGeometry, galaxyMaterial);
    scene.add(galaxy);
};

generateGalaxy();

// Add some bright background stars
const bgStarGeometry = new THREE.BufferGeometry();
const bgStarCount = 5000;
const bgPositions = new Float32Array(bgStarCount * 3);

for (let i = 0; i < bgStarCount * 3; i += 3) {
    bgPositions[i] = (Math.random() - 0.5) * 1000;
    bgPositions[i + 1] = (Math.random() - 0.5) * 1000;
    bgPositions[i + 2] = (Math.random() - 0.5) * 1000;
}

bgStarGeometry.setAttribute('position', new THREE.BufferAttribute(bgPositions, 3));
const bgStarMaterial = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 1,
    sizeAttenuation: false,
    transparent: true,
    opacity: 0.5
});
const bgStars = new THREE.Points(bgStarGeometry, bgStarMaterial);
scene.add(bgStars);

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
        
        // Update star shader uniforms
        starMaterial.uniforms.viewVector.value = camera.position;
        const colorIntensity = 1 + bass * 0.5;
        starMaterial.uniforms.glowColor.value.setRGB(colorIntensity, colorIntensity * 0.9, colorIntensity * 0.5);
        
        // Dramatic light pulsing
        starLight.intensity = 1 + bass * 10;
        
        // Animate soft glow layers based on frequency
        const midFreq = dataArray.slice(40, 80).reduce((a, b) => a + b) / 40 / 255;
        const highFreq = dataArray.slice(80, 120).reduce((a, b) => a + b) / 40 / 255;
        
        glowLayers.forEach((glow, index) => {
            // Pulse size gently
            const baseSize = 3 + index * 4;
            const pulseSize = baseSize + (bass * 2 + midFreq * 1.5) * (index + 1) * 0.5;
            glow.scale.set(pulseSize / baseSize, pulseSize / baseSize, pulseSize / baseSize);
            
            // Shift colors based on frequency ranges
            const hue = 0.05 + bass * 0.1 + index * 0.02; // Warm yellows to oranges
            const saturation = 0.8 - index * 0.1;
            const lightness = 0.7 + highFreq * 0.2;
            glow.material.color.setHSL(hue, saturation, lightness);
            
            // Vary opacity based on volume
            glow.material.opacity = 0.05 + avgVolume * 0.15 - index * 0.01;
        })
        
        // Make galaxy particles dance
        if (galaxyGeometry) {
            const positions = galaxyGeometry.attributes.position.array;
            const scales = galaxyGeometry.attributes.scale.array;
            
            for (let i = 0; i < scales.length; i++) {
                scales[i] = Math.random() * (1 + avgVolume * 5);
            }
            galaxyGeometry.attributes.scale.needsUpdate = true;
            
            // Pulse galaxy brightness
            galaxyMaterial.opacity = 0.6 + avgVolume * 0.4;
        }
        
        // Speed up rotation with volume - more dramatic
        if (galaxy) {
            galaxy.rotation.y += avgVolume * 0.03;
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