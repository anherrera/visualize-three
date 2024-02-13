import * as THREE from 'three';

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(window.innerWidth / -2, window.innerWidth / 2, window.innerHeight / 2, window.innerHeight / -2, 1, 1000 );
camera.position.z = 1;

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Parameters
const N = 32; // Number of points
let R = 200; // Radius
let R2 = 200; // Radius 2

// set different speeds for each layer
const speed = 0.0001;
const speed2 = 0.001;

const centerPoint = new THREE.Vector2(0, 0); // Center point
let points = [];
let points2 = [];
const material = new THREE.MeshBasicMaterial({ color: 0x7700ff });

const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffff00 });


// Create N points around the center
for (let i = 0; i < N; i++) {
    const theta = (i / N) * 2 * Math.PI; // Angle for this point
    const x = centerPoint.x + R * Math.cos(theta);
    const y = centerPoint.y + R * Math.sin(theta);

    const geometry = new THREE.CircleGeometry(2, 32); // Small circle for each point
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, 0);
    //scene.add(mesh);
    points.push(mesh);
}

// create N more points further from the center turning the opposite direction
for (let i = 0; i < N; i++) {
    const theta = (i / N) * 2 * Math.PI; // Angle for this point
    const x = centerPoint.x + R2 * Math.cos(theta);
    const y = centerPoint.y + R2 * Math.sin(theta);

    const geometry = new THREE.CircleGeometry(2, 32); // Small circle for each point
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, 0);
    //scene.add(mesh);
    points2.push(mesh);
}

const lines = [];
const lines2 = [];

for (let i = 0; i < N; i++) {
    const lineGeometry = new THREE.BufferGeometry().setFromPoints([points[i].position, points2[i].position]);
    const line = new THREE.Line(lineGeometry, lineMaterial);
    lines.push(line);
    scene.add(line);
}

// connect adjacent points on each layer using a curved line
for (let i = 0; i < N; i++) {
    const lineGeometry = new THREE.BufferGeometry().setFromPoints([points[i].position, points2[(i + 1) % N].position]);
    const line = new THREE.Line(lineGeometry, lineMaterial);
    scene.add(line);
    lines2.push(line);
}


// Animation function to rotate points
const animate = function () {
    requestAnimationFrame(animate);

    // slowly increment the radius of the circles proportionally to the window size
    R = window.innerWidth / 4 + 100 * Math.sin(Date.now() * 0.001);
    R2 = window.innerWidth / 4 + 100 * Math.sin(Date.now() * 0.001);

    // slowly increment the hue of the line colors
    lineMaterial.color.setHSL((Date.now() * 0.0001) % 1, 1, 0.8);

    // Update position of each point to rotate around the center
    points.forEach((point, index) => {
        const theta = (Date.now() * speed + (index / N) * 2 * Math.PI) % (2 * Math.PI); // Current angle
        point.position.x = centerPoint.x + R * Math.cos(theta);
        point.position.y = centerPoint.y + R * Math.sin(theta);
    });

    // Update position of each point to rotate around the center in the opposite direction
    points2.forEach((point, index) => {
        const theta = (Date.now() * speed2 - (index / N) * 2 * Math.PI) % (2 * Math.PI); // Current angle
        point.position.x = centerPoint.x - R2 * Math.cos(theta);
        point.position.y = centerPoint.y + R2 * Math.sin(theta);
    });

    // move the lines that connect the corresponding points on each layer
    lines.forEach((line, index) => {
        line.geometry.setFromPoints([points[index].position, points2[index].position]);
    });

    // move lines2
    lines2.forEach((line, index) => {
        line.geometry.setFromPoints([points[index].position, points2[(index + 1) % N].position]);
    });

    renderer.render(scene, camera);
};

animate();