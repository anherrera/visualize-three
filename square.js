import * as THREE from 'three';
import { MapControls } from "three/addons/controls/MapControls";
import {Object3D} from "three";


// Scene setup
const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x000000, 1, 250);
const camera= new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.x = 25;


// renderer
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// map controls
const controls = new MapControls(camera, renderer.domElement);
controls.enableDamping = true;

// constants
const boxWidth = 16;
const segments = 32;
const lineArtShift = 32;

const createPlane = (size, color) => {
    const geometry = new THREE.PlaneGeometry(size, size, segments, segments);
    const material = new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 0 });
    const square = new THREE.Mesh(geometry, material);
    const edges = new THREE.EdgesGeometry(square.geometry);
    const vertices = square.geometry.getAttribute('position').array;
    const edgeVertices = edges.getAttribute('position').array;
    const verticesOnEdges = [];
    for (let i = 0; i < vertices.length; i += 3) {
        for (let j = 0; j < edgeVertices.length; j += 3) {
            if (vertices[i] === edgeVertices[j] && vertices[i + 1] === edgeVertices[j + 1] && vertices[i + 2] === edgeVertices[j + 2]) {
                verticesOnEdges.push(vertices[i], vertices[i + 1], vertices[i + 2]);
            }
        }
    }

    const vertices2d = [];
    for (let i = 0; i < verticesOnEdges.length; i += 3) {
        vertices2d.push([verticesOnEdges[i], verticesOnEdges[i + 1]]);
    }
    vertices2d.sort((a, b) => Math.atan2(a[1], a[0]) - Math.atan2(b[1], b[0]));
    vertices2d.reverse();
    const topLeft = vertices2d.reduce((a, b) => a[1] > b[1] || (a[1] === b[1] && a[0] < b[0]) ? a : b);
    while (vertices2d[0] !== topLeft) {
        vertices2d.push(vertices2d.shift());
    }

    const lineMaterial = new THREE.LineBasicMaterial({ color: color });
    const lines = [];
    for (let i = 0; i < vertices2d.length; i++) {
        const from = vertices2d[i];
        const to = vertices2d[(i + segments + lineArtShift) % vertices2d.length];
        const points = [
            new THREE.Vector2(from[0], from[1]),
            new THREE.Vector2(to[0], to[1])
        ];
        const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
        lines[i] = new THREE.Line(lineGeometry, lineMaterial);
    }
    lines.forEach(line => {
        square.add(line)
    });

    return square;
}

const createFaces = () => {
    // Face 1
    let face1 = createPlane(boxWidth, 'green');
    face1.position.z = -boxWidth / 2;
    // Face 2
    let face2 = createPlane(boxWidth, 'red');
    face2.position.z = boxWidth / 2;
    // Face 3
    let face3 = createPlane(boxWidth, 'white');
    face3.position.x = boxWidth / 2;
    face3.rotation.y = Math.PI / 2;
    // Face 4
    let face4 = createPlane(boxWidth, 'yellow');
    face4.position.x = -boxWidth / 2;
    face4.rotation.y = Math.PI / 2;
    // Face 5
    let face5 = createPlane(boxWidth, 0x1759ff);
    face5.position.y = boxWidth / 2;
    face5.rotation.x = Math.PI / 2;
    // Face 6
    let face6 = createPlane(boxWidth, 'orange');
    face6.position.y = -boxWidth / 2;
    face6.rotation.x = Math.PI / 2;

    return [face1, face2, face3, face4, face5, face6];
}

let faces = createFaces();
let cube = new Object3D();
cube.add(...faces);

cube.rotateY(45);
cube.rotateX(45);

scene.add(cube);

const animate = function () {
    requestAnimationFrame(animate);

    cube.rotateZ(0.001);

    renderer.render(scene, camera);
};

animate();