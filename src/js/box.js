import * as THREE from 'three'
import { getNoise, getPrimaryColor, getSecondaryColor, HEIGHT_SEED } from "./color"
import { xbounds, zbounds, camOffsetX, camOffsetZ } from './config'

// Constants
let oldX = 0
let oldZ = 0
const buildings = new Map()

// Check is a box is within bounds.
export function withinBounds(cameraX, cameraZ, x, z) {
    return (
        x >= cameraX - xbounds - camOffsetX &&
        x < cameraX + xbounds - camOffsetX &&
        z >= cameraZ - zbounds - camOffsetZ &&
        z < cameraZ + zbounds - camOffsetZ
    )
}

// Make one box.
export function makeBox(scene, h, x, z, pc, sc) {
    let coordKey = x.toString() + '#' + z.toString()
    if (buildings.has(coordKey)) return
    const boxGeo = new THREE.BoxGeometry(0.8, h, 0.8)
    const boxTex = new THREE.MeshPhongMaterial({
        color: pc,
        specular: sc,
    })
    const boxMesh = new THREE.Mesh(boxGeo, boxTex)
    boxMesh.position.set(0 + x, h / 2, 0 + z)
    boxMesh.castShadow = true
    boxMesh.receiveShadow = true
    scene.add(boxMesh)

    buildings.set(coordKey, boxMesh)
}

// Make all boxes.
export function makeBoxes(scene, centerX, centerZ) {
    for (let i = centerX - xbounds - camOffsetX; i < centerX + xbounds - camOffsetX; i++) {
        for (let j = centerZ - zbounds - camOffsetZ; j < centerZ + zbounds - camOffsetZ; j++) {
            const h = getNoise(i, j, HEIGHT_SEED)
            const pc = getPrimaryColor(i, j, 1, 0.5)
            const sc = getSecondaryColor(i, j, 1, 0.5)
            makeBox(scene, h, i, j, pc, sc)
        }
    }
}

// Update all boxes.
export function updateBoxes(scene, camera) {
    // TODO: checking whether boxes are within the boundaries is broken
    let x = Math.round(camera.position.x)
    let z = Math.round(camera.position.z)
    if (x == oldX && z == oldZ) return
    oldX = x
    oldZ = z
    // Clean up irrelevant boxes
    let toDelete = []
    buildings.forEach((object, key, map) => {
        if (!withinBounds(x, z, object.position.x, object.position.z)) {
            scene.remove(object)
            object.geometry.dispose()
            object.material.dispose()
            toDelete.push(key)
        }
    })
    toDelete.forEach((key) => {
        buildings.delete(key)
    })
    //renderer.renderLists.dispose();
    // Generate new boxes
    makeBoxes(scene, x, z)
}
