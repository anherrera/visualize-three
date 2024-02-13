import * as THREE from 'three';

// Scene setup
const scene = new THREE.Scene();
const camera= new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 40;

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// make a square
const boxWidth = 16;
const segments = 16;
const lineArtShift = segments;

// make a transparent square
const geometry = new THREE.PlaneGeometry(boxWidth, boxWidth, segments, segments);
const material = new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0 });
const square = new THREE.Mesh(geometry, material);

// edges
const edges = new THREE.EdgesGeometry(square.geometry);

// get the vertices of the square
const vertices = square.geometry.getAttribute('position').array;

// edge vertices
const edgeVertices = edges.getAttribute('position').array;

// filter vertices by intersection with edges
const verticesOnEdges = [];
for (let i = 0; i < vertices.length; i += 3) {
    for (let j = 0; j < edgeVertices.length; j += 3) {
        if (vertices[i] === edgeVertices[j] && vertices[i + 1] === edgeVertices[j + 1] && vertices[i + 2] === edgeVertices[j + 2]) {
            verticesOnEdges.push(vertices[i], vertices[i + 1], vertices[i + 2]);
        }
    }
}


// 2d vertices
const vertices2d = [];
for (let i = 0; i < verticesOnEdges.length; i += 3) {
    vertices2d.push([verticesOnEdges[i], verticesOnEdges[i + 1]]);
}

// now sort vertices2d by angle, and reverse
vertices2d.sort((a, b) => Math.atan2(a[1], a[0]) - Math.atan2(b[1], b[0]));
vertices2d.reverse();

// make the first 2d vertex the one with the highest y and lowest x, where x is [0] and y is [1]
const topLeft = vertices2d.reduce((a, b) => a[1] > b[1] || (a[1] === b[1] && a[0] < b[0]) ? a : b);

// rotate the array so that the top left vertex is first
while (vertices2d[0] !== topLeft) {
    vertices2d.push(vertices2d.shift());
}

// now draw line art.
// each vertex goes to the vertex at index + (segments+1).
// the vertex at vertices2d.length - segments goes to the first vertex
const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffff00 });
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

// make a cube out of 6 instances of the square
const cube = new THREE.Group();
const squares = [];
for (let i = 0; i < 6; i++) {
    squares[i] = square.clone();
    cube.add(squares[i]);
}
// rotate the squares to make a cube, with the squares being the faces
squares[0].rotation.x = Math.PI / 2;
squares[0].position.z = boxWidth/2;
squares[0].position.y = boxWidth/2;
squares[1].rotation.x = -Math.PI / 2;
squares[1].position.z = boxWidth/2;
squares[1].position.y = -boxWidth/2;
squares[2].position.z = boxWidth;
squares[3].rotation.y = Math.PI / 2;
squares[3].position.x = boxWidth/2;
squares[3].position.z = boxWidth/2;
squares[4].rotation.y = -Math.PI / 2;
squares[4].position.x = -boxWidth/2;
squares[4].position.z = boxWidth/2;

scene.add(cube);


// Animation function to move points along the path of the square.
const animate = function () {
    requestAnimationFrame(animate);

    cube.rotateZ(0.0007);
    cube.rotateY(0.0001);
    cube.rotateX(0.0005);

    // hue-shift each face of the cube separately
    squares.forEach((square, sq) => {
        square.children.forEach((line, index) => {
            line.material.color.setHSL((Date.now() * 0.0001) % sq, 1, 0.8);
        });
    });


    renderer.render(scene, camera);
};

animate();