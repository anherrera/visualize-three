import * as THREE from 'three';

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xc8e6ff); // Pale blue background
scene.fog = new THREE.FogExp2(0xc8e6ff, 0.0008);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 50, 100);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

// Boid class
class Boid {
    constructor(x, y, z) {
        this.position = new THREE.Vector3(x, y, z);
        this.velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2
        );
        this.acceleration = new THREE.Vector3(0, 0, 0);
        
        // Boid parameters
        this.maxSpeed = 2;
        this.maxForce = 0.03;
        this.separationRadius = 8;
        this.alignmentRadius = 12;
        this.cohesionRadius = 15;
        
        // Create visual representation
        this.createMesh();
    }
    
    createMesh() {
        // Simple triangle pointing in direction of movement
        const geometry = new THREE.ConeGeometry(0.2, 1, 4);
        const material = new THREE.MeshBasicMaterial({
            color: 0x000000, // Black birds
            transparent: false,
            opacity: 1
        });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.rotateX(Math.PI / 2); // Point forward
        scene.add(this.mesh);
    }
    
    // Separation: steer to avoid crowding local flockmates
    separate(boids) {
        const steer = new THREE.Vector3(0, 0, 0);
        let count = 0;
        
        for (let other of boids) {
            const distance = this.position.distanceTo(other.position);
            if (distance > 0 && distance < this.separationRadius) {
                const diff = new THREE.Vector3()
                    .subVectors(this.position, other.position)
                    .normalize()
                    .divideScalar(distance); // Weight by distance
                steer.add(diff);
                count++;
            }
        }
        
        if (count > 0) {
            steer.divideScalar(count);
            steer.normalize();
            steer.multiplyScalar(this.maxSpeed);
            steer.sub(this.velocity);
            steer.clampLength(0, this.maxForce);
        }
        
        return steer;
    }
    
    // Alignment: steer towards the average heading of neighbors
    align(boids) {
        const sum = new THREE.Vector3(0, 0, 0);
        let count = 0;
        
        for (let other of boids) {
            const distance = this.position.distanceTo(other.position);
            if (distance > 0 && distance < this.alignmentRadius) {
                sum.add(other.velocity);
                count++;
            }
        }
        
        if (count > 0) {
            sum.divideScalar(count);
            sum.normalize();
            sum.multiplyScalar(this.maxSpeed);
            const steer = new THREE.Vector3().subVectors(sum, this.velocity);
            steer.clampLength(0, this.maxForce);
            return steer;
        }
        
        return new THREE.Vector3(0, 0, 0);
    }
    
    // Cohesion: steer to move toward the average position of local flockmates
    cohesion(boids) {
        const sum = new THREE.Vector3(0, 0, 0);
        let count = 0;
        
        for (let other of boids) {
            const distance = this.position.distanceTo(other.position);
            if (distance > 0 && distance < this.cohesionRadius) {
                sum.add(other.position);
                count++;
            }
        }
        
        if (count > 0) {
            sum.divideScalar(count);
            return this.seek(sum);
        }
        
        return new THREE.Vector3(0, 0, 0);
    }
    
    // Seek a target
    seek(target) {
        const desired = new THREE.Vector3().subVectors(target, this.position);
        desired.normalize();
        desired.multiplyScalar(this.maxSpeed);
        
        const steer = new THREE.Vector3().subVectors(desired, this.velocity);
        steer.clampLength(0, this.maxForce);
        return steer;
    }
    
    // Main flocking behavior
    flock(boids) {
        const sep = this.separate(boids);
        const ali = this.align(boids);
        const coh = this.cohesion(boids);
        
        // Weight the forces
        sep.multiplyScalar(1.5);
        ali.multiplyScalar(1.0);
        coh.multiplyScalar(1.0);
        
        this.acceleration.add(sep);
        this.acceleration.add(ali);
        this.acceleration.add(coh);
    }
    
    // Boundary wrapping
    boundaries() {
        const bounds = 100;
        if (this.position.x > bounds) this.position.x = -bounds;
        if (this.position.x < -bounds) this.position.x = bounds;
        if (this.position.y > bounds) this.position.y = -bounds;
        if (this.position.y < -bounds) this.position.y = bounds;
        if (this.position.z > bounds) this.position.z = -bounds;
        if (this.position.z < -bounds) this.position.z = bounds;
    }
    
    // Update position
    update() {
        this.velocity.add(this.acceleration);
        this.velocity.clampLength(0, this.maxSpeed);
        this.position.add(this.velocity);
        this.acceleration.multiplyScalar(0);
        
        this.boundaries();
        this.updateMesh();
    }
    
    // Update visual representation
    updateMesh() {
        this.mesh.position.copy(this.position);
        
        // Orient the mesh to face the direction of movement
        if (this.velocity.length() > 0) {
            const direction = this.velocity.clone().normalize();
            this.mesh.lookAt(this.position.clone().add(direction));
            this.mesh.rotateX(-Math.PI / 2);
        }
        
        // Keep birds black - no color change needed
        this.mesh.material.color.setHex(0x000000);
    }
}

// Create flock
const flock = [];
const numBoids = 1000;

for (let i = 0; i < numBoids; i++) {
    const boid = new Boid(
        (Math.random() - 0.5) * 100,
        (Math.random() - 0.5) * 100,
        (Math.random() - 0.5) * 100
    );
    flock.push(boid);
}

// Camera controls
let mouseX = 0;
let mouseY = 0;

document.addEventListener('mousemove', (event) => {
    mouseX = (event.clientX / window.innerWidth) * 2 - 1;
    mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
});

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    // Update each boid
    for (let boid of flock) {
        boid.flock(flock);
        boid.update();
    }
    
    // Camera follows mouse slightly
    camera.position.x += (mouseX * 50 - camera.position.x) * 0.05;
    camera.position.y += (mouseY * 50 - camera.position.y) * 0.05;
    camera.lookAt(0, 0, 0);
    
    renderer.render(scene, camera);
}

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();