import * as THREE from 'three';

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 15;

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);


// sphere
const geometry = new THREE.SphereGeometry(5, 16, 16);
const material = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true});
const sphere = new THREE.Mesh(geometry, material);

// inner sphere
const geometry2 = new THREE.SphereGeometry(4, 16, 16);
const material2 = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true});
const sphere2 = new THREE.Mesh(geometry2, material2);

const vertices = sphere.geometry.getAttribute('position').array;
const vertices2 = sphere2.geometry.getAttribute('position').array;

const lineMaterial = new THREE.LineBasicMaterial({color: 0xffff00});

const lines = []

function calculateLines(vertices, vertices2) {
    for (let i = 0; i < vertices.length; i += 3) {
        const points = [
            new THREE.Vector3(vertices[i], vertices[i + 1], vertices[i + 2]),
            new THREE.Vector3(vertices2[i], vertices2[i + 2], vertices2[i + 1])
        ]
        const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);

        lines[i] = new THREE.Line(lineGeometry, lineMaterial)
    }
}
calculateLines(vertices, vertices2);

lines.forEach(line => {
    scene.add(line);
});

function animate() {
    requestAnimationFrame(animate);

    lines.forEach(line => {
        scene.remove(line);
    });


    sphere.geometry.rotateY(0.01);
    sphere2.geometry.rotateY(-0.01);

    const newVertices = sphere.geometry.getAttribute('position').array;
    const newVertices2 = sphere2.geometry.getAttribute('position').array;
    calculateLines(newVertices, newVertices2);

    lines.forEach(line => {
        scene.add(line);
    });

    renderer.render(scene, camera);
}

animate();