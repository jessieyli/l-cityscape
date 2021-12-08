import * as THREE from 'three'
import { updateCameraMovement } from './movement'
import { updateBoxes } from './box'

// Lighting
export function setupLighting(renderer, scene) {
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
  scene.add(ambientLight)

  // TODO: shadows?
  let directionalLight = new THREE.DirectionalLight(0xffffff, 0.5)
  directionalLight.position.set(-1, 1, -1)
  directionalLight.castShadow = true
  //TODO: this shit bonkers
  directionalLight.shadow.camera.left = 10
  directionalLight.shadow.camera.right = -10
  directionalLight.shadow.camera.top = 10
  directionalLight.shadow.camera.bottom = -10
  directionalLight.shadow.camera.near = -10
  directionalLight.shadow.camera.far = 1000
  scene.add(directionalLight)

  renderer.shadowMap.enabled = true

  // TODO: light doesn't seem to make sense? building reflections are too high
  const pointGeometry = new THREE.SphereGeometry(0.02)
  let pointLight = new THREE.PointLight(0xffffff, 1, 50, 2) // distance, decay
  pointLight.add(new THREE.Mesh(pointGeometry, new THREE.MeshBasicMaterial({ color: 0xff0040 })))
  pointLight.position.set(0.5, 0.1, 0.5)
  pointLight.castShadow = true
  // scene.add(pointLight);
}

// Fog
export function setupFog(scene) {
  const color = 0x21263a
  const density = 0.11
  scene.fog = new THREE.FogExp2(color, density)
}

// Plane
export function setupPlane(scene) {
  // plane that receives shadows (but does not cast them)
  const planeGeometry = new THREE.PlaneGeometry(20, 20, 32, 32)
  const planeMaterial = new THREE.MeshStandardMaterial({ color: 0x0000ff })
  const plane = new THREE.Mesh(planeGeometry, planeMaterial)
  plane.rotation.x = -Math.PI / 2.0
  plane.receiveShadow = true
  scene.add(plane)
}

// Update the size of the camera view.
export function updateSize(renderer, camera) {
  const factor = 0.01
  const canvas = renderer.domElement
  const w = window.innerWidth
  const h = window.innerHeight
  const needResize = canvas.width !== w || canvas.height !== h
  if (needResize) {
    renderer.setSize(w, h)
    camera.left = (-w / 2) * factor
    camera.right = (w / 2) * factor
    camera.top = (h / 2) * factor
    camera.bottom = (-h / 2) * factor
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    console.log(camera)
  }
  return needResize
}

// Animate.
let prevTime = 0
export function animate(stats, scene, renderer, camera, currTime) {
  requestAnimationFrame((currTime) => animate(stats, scene, renderer, camera, currTime))

  stats.begin() // Temporary

  const deltaTime = currTime - prevTime
  prevTime = currTime

  updateSize(renderer, camera)
  updateCameraMovement(deltaTime, camera)
  updateBoxes(scene, camera)

  renderer.render(scene, camera)

  stats.end() // Temporary
}
