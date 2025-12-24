import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { GameState, InputState } from '../types';
import { COLORS, MOVE_SPEED, ANIMAL_CONFIGS } from '../constants';

// --- CUSTOM MESSAGE ---
const FINAL_MESSAGE = `Dear QZ: 


❄️ 祝圣诞快乐～Qingzheng老师，希望能和你的毛孩子们长久、快乐地生活在一起，每天都开心！
( ੭ ˙ᗜ˙ )੭

Mimi`;

// --- AUDIO SYSTEM (Music Box Synthesizer) ---
const playMusicBoxTune = () => {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    // Jingle Bells (Chorus) simplified
    const E5 = 659.25;
    const G5 = 783.99;
    const C5 = 523.25;
    const D5 = 587.33;
    const F5 = 698.46;

    const tune = [
        { f: E5, d: 0.25, t: 0 },
        { f: E5, d: 0.25, t: 0.25 },
        { f: E5, d: 0.5,  t: 0.5 },
        { f: E5, d: 0.25, t: 1.0 },
        { f: E5, d: 0.25, t: 1.25 },
        { f: E5, d: 0.5,  t: 1.5 },
        { f: E5, d: 0.25, t: 2.0 },
        { f: G5, d: 0.25, t: 2.25 },
        { f: C5, d: 0.25, t: 2.5 },
        { f: D5, d: 0.15, t: 2.75 },
        { f: E5, d: 1.0,  t: 3.0 },
        // F F F F F E E
        { f: F5, d: 0.25, t: 4.0 },
        { f: F5, d: 0.25, t: 4.25 },
        { f: F5, d: 0.25, t: 4.5 },
        { f: F5, d: 0.25, t: 4.75 },
        { f: F5, d: 0.25, t: 5.0 },
        { f: E5, d: 0.25, t: 5.25 },
        { f: E5, d: 0.5,  t: 5.5 },
    ];

    tune.forEach(({ f, d, t }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine'; 
        osc.frequency.value = f;

        const startTime = ctx.currentTime + t;
        const stopTime = startTime + d;
        
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.15, startTime + 0.05); // Pluck
        gain.gain.exponentialRampToValueAtTime(0.001, stopTime); // Decay ring

        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(startTime);
        osc.stop(stopTime + 0.1);
    });
};

// --- CUTE RESCUE SOUND ---
const playRescueSound = () => {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const t = ctx.currentTime;

    // A cute, bubbly "pop-up" sound (Major Triad Arpeggio)
    const notes = [
        { f: 1046.50, t: 0 },    // C6
        { f: 1318.51, t: 0.08 }, // E6
        { f: 1567.98, t: 0.16 }  // G6
    ];

    notes.forEach(({ f, t: offset }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'sine'; // Sine is soft and cute
        osc.frequency.value = f;
        
        // Envelope: Quick attack, smooth decay
        gain.gain.setValueAtTime(0, t + offset);
        gain.gain.linearRampToValueAtTime(0.15, t + offset + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, t + offset + 0.2);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(t + offset);
        osc.stop(t + offset + 0.25);
    });
};

// --- ASSET GENERATION FUNCTIONS (Module Scope) ---

const createBaseFeatures = (headContainer: THREE.Group, eyeColor: string | number) => {
    const eyeGeo = new THREE.SphereGeometry(0.045, 6, 6);
    const eyeMat = new THREE.MeshBasicMaterial({ color: eyeColor });
    const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
    eyeL.position.set(0.32, 0.05, 0.12);
    const eyeR = eyeL.clone();
    eyeR.position.set(0.32, 0.05, -0.12);
    
    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 6), new THREE.MeshStandardMaterial({ color: COLORS.nose_pink }));
    nose.position.set(0.34, -0.02, 0);
    
    headContainer.add(eyeL, eyeR, nose);
    return { eyeL, eyeR, nose };
};

const createBlueCat = () => {
    const group = new THREE.Group();
    const furColor = COLORS.fur_blue_grey;
    const whiteColor = 0xFFFFFF;
    const furMat = new THREE.MeshStandardMaterial({ color: furColor, flatShading: true });
    const whiteMat = new THREE.MeshStandardMaterial({ color: whiteColor, flatShading: true });

    const body = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 8), furMat);
    body.scale.set(1.0, 0.8, 1.1);
    body.position.y = 0.3;
    body.castShadow = true;
    
    const bib = new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 8), whiteMat);
    bib.position.set(0.15, 0.1, 0); 
    bib.scale.set(0.5, 0.8, 0.8);
    body.add(bib);

    const headGroup = new THREE.Group();
    headGroup.name = 'head';
    headGroup.position.set(0.3, 0.55, 0);
    const headContainer = new THREE.Group();
    headContainer.name = 'headContainer';
    headContainer.rotation.y = -Math.PI / 2;
    headGroup.add(headContainer);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.32, 10, 10), furMat);
    
    const muzzleL = new THREE.Mesh(new THREE.SphereGeometry(0.09, 6, 6), whiteMat);
    muzzleL.position.set(0.25, -0.08, 0.08);
    const muzzleR = muzzleL.clone();
    muzzleR.position.set(0.25, -0.08, -0.08);
    const chin = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 6), whiteMat);
    chin.position.set(0.22, -0.18, 0);

    const earGeo = new THREE.ConeGeometry(0.08, 0.15, 4);
    const earL = new THREE.Mesh(earGeo, furMat);
    earL.position.set(0, 0.28, 0.18);
    earL.rotation.set(0.2, 0, -0.2);
    const earR = earL.clone();
    earR.position.set(0, 0.28, -0.18);
    earR.rotation.set(-0.2, 0, -0.2);

    headContainer.add(head, muzzleL, muzzleR, chin, earL, earR);
    createBaseFeatures(headContainer, COLORS.gold);

    const legGeo = new THREE.CylinderGeometry(0.07, 0.06, 0.25, 6);
    [[0.2, 0.12, 0.15], [0.2, 0.12, -0.15], [-0.2, 0.12, 0.15], [-0.2, 0.12, -0.15]].forEach(pos => {
        const leg = new THREE.Mesh(legGeo, whiteMat);
        leg.position.set(pos[0], pos[1], pos[2]);
        group.add(leg);
    });

    const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.04, 0.4), furMat);
    tail.rotation.z = Math.PI / 3;
    tail.position.set(-0.35, 0.4, 0);
    
    group.add(body, headGroup, tail);
    return group;
};

const createRagdoll = () => {
    const group = new THREE.Group();
    const bodyColor = COLORS.fur_white;
    const pointColor = COLORS.fur_ragdoll_point;
    
    const bodyMat = new THREE.MeshStandardMaterial({ color: bodyColor });
    const pointMat = new THREE.MeshStandardMaterial({ color: pointColor }); 
    
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.28, 0.5, 4, 8), bodyMat);
    body.rotation.z = Math.PI / 2;
    body.position.y = 0.35;
    body.castShadow = true;
    
    const ruff = new THREE.Mesh(new THREE.DodecahedronGeometry(0.22), bodyMat);
    ruff.position.set(0.25, 0.5, 0);
    ruff.scale.set(1, 0.6, 1.2);
    group.add(ruff);

    const headGroup = new THREE.Group();
    headGroup.name = 'head';
    headGroup.position.set(0.35, 0.6, 0);
    const headContainer = new THREE.Group();
    headContainer.name = 'headContainer';
    headContainer.rotation.y = -Math.PI / 2;
    headGroup.add(headContainer);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.3, 10, 10), bodyMat);
    headContainer.add(head);
    
    const patchL = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 8), pointMat);
    patchL.position.set(0.26, 0.08, 0.12);
    patchL.scale.set(0.3, 1.0, 1.2);
    patchL.rotation.y = 0.2;
    
    const patchR = patchL.clone();
    patchR.position.set(0.26, 0.08, -0.12);
    patchR.rotation.y = -0.2;
    
    headContainer.add(patchL, patchR);

    const cheekFluffL = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.2, 4), bodyMat);
    cheekFluffL.rotation.z = 2.0;
    cheekFluffL.rotation.y = 0.5;
    cheekFluffL.position.set(0, -0.1, 0.28);
    const cheekFluffR = cheekFluffL.clone();
    cheekFluffR.rotation.y = -0.5;
    cheekFluffR.position.set(0, -0.1, -0.28);
    headContainer.add(cheekFluffL, cheekFluffR);

    const earGeo = new THREE.ConeGeometry(0.09, 0.18, 4);
    const earL = new THREE.Mesh(earGeo, pointMat);
    earL.position.set(-0.05, 0.28, 0.15);
    earL.rotation.set(0.2, 0, -0.2);
    const earR = earL.clone();
    earR.position.set(-0.05, 0.28, -0.15);
    earR.rotation.set(-0.2, 0, -0.2);
    headContainer.add(earL, earR);

    createBaseFeatures(headContainer, COLORS.eye_blue);

    const legGeo = new THREE.CylinderGeometry(0.07, 0.06, 0.35, 6);
    [[0.3, 0.175, 0.15], [0.3, 0.175, -0.15], [-0.3, 0.175, 0.15], [-0.3, 0.175, -0.15]].forEach(pos => {
        const leg = new THREE.Mesh(legGeo, bodyMat);
        leg.position.set(pos[0], pos[1], pos[2]);
        group.add(leg);
    });

    const tailGroup = new THREE.Group();
    tailGroup.position.set(-0.4, 0.45, 0);
    tailGroup.rotation.z = Math.PI / 3;
    for(let i=0; i<5; i++) {
        const s = new THREE.Mesh(new THREE.SphereGeometry(0.1 - i*0.012), pointMat);
        s.position.y = i * 0.12;
        tailGroup.add(s);
    }
    
    group.add(body, headGroup, tailGroup);
    return group;
};

const createBlackCat = () => {
    const group = new THREE.Group();
    const blackMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 }); 
    
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.26, 0.55, 4, 8), blackMat);
    body.rotation.z = Math.PI / 2;
    body.position.y = 0.35;
    body.castShadow = true;
    
    const ruff = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.08, 6, 10), blackMat);
    ruff.rotation.y = Math.PI / 2;
    ruff.position.set(0.3, 0.5, 0);

    const headGroup = new THREE.Group();
    headGroup.name = 'head';
    headGroup.position.set(0.35, 0.6, 0);
    const headContainer = new THREE.Group();
    headContainer.name = 'headContainer';
    headContainer.rotation.y = -Math.PI / 2;
    headGroup.add(headContainer);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 8), blackMat);
    const earGeo = new THREE.ConeGeometry(0.08, 0.18, 4);
    const earL = new THREE.Mesh(earGeo, blackMat);
    earL.position.set(0, 0.25, 0.14);
    earL.rotation.set(0.2, 0, -0.2);
    const earR = earL.clone();
    earR.position.set(0, 0.25, -0.14);
    earR.rotation.set(-0.2, 0, -0.2);

    headContainer.add(head, earL, earR);
    const { eyeL, eyeR, nose } = createBaseFeatures(headContainer, 0xFFEB3B);
    eyeL.scale.set(1.2, 1.2, 1.2); 
    eyeR.scale.set(1.2, 1.2, 1.2);
    nose.material = new THREE.MeshStandardMaterial({ color: 0x333333 }); 

    const legGeo = new THREE.CylinderGeometry(0.06, 0.05, 0.35, 6);
    [[0.3, 0.175, 0.15], [0.3, 0.175, -0.15], [-0.3, 0.175, 0.15], [-0.3, 0.175, -0.15]].forEach(pos => {
        const leg = new THREE.Mesh(legGeo, blackMat);
        leg.position.set(pos[0], pos[1], pos[2]);
        group.add(leg);
    });

    const tailGroup = new THREE.Group();
    tailGroup.position.set(-0.4, 0.4, 0);
    tailGroup.rotation.z = Math.PI / 3;
    for(let i=0; i<4; i++) {
        const s = new THREE.Mesh(new THREE.SphereGeometry(0.08 - i*0.01), blackMat);
        s.position.y = i * 0.12;
        tailGroup.add(s);
    }
    
    group.add(body, ruff, headGroup, tailGroup);
    return group;
};

const createTeddyDog = () => {
    const group = new THREE.Group();
    const furMat = new THREE.MeshStandardMaterial({ color: COLORS.fur_teddy, roughness: 1.0 }); 
    
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.45, 0.55), furMat);
    body.position.y = 0.35;
    body.castShadow = true;

    const headGroup = new THREE.Group();
    headGroup.name = 'head';
    headGroup.position.set(0, 0.65, 0.35); 
    const headContainer = new THREE.Group();
    headContainer.name = 'headContainer'; 
    headGroup.add(headContainer);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 8), furMat);
    const topknot = new THREE.Mesh(new THREE.SphereGeometry(0.18, 6, 6), furMat);
    topknot.position.y = 0.25;

    const earL = new THREE.Mesh(new THREE.SphereGeometry(0.14, 6, 6), furMat);
    earL.position.set(0.26, 0.05, 0);
    const earR = earL.clone();
    earR.position.set(-0.26, 0.05, 0);

    const muzzle = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), furMat);
    muzzle.position.set(0, -0.05, 0.22);
    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.05), new THREE.MeshStandardMaterial({ color: COLORS.nose_black }));
    nose.position.set(0, 0, 0.32);
    
    const eyeGeo = new THREE.SphereGeometry(0.04);
    const eyeMat = new THREE.MeshBasicMaterial({ color: COLORS.eye_black });
    const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
    eyeL.position.set(0.1, 0.05, 0.26);
    const eyeR = eyeL.clone();
    eyeR.position.set(-0.1, 0.05, 0.26);

    headContainer.add(head, topknot, earL, earR, muzzle, nose, eyeL, eyeR);

    const legGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.3, 6);
    const positions = [
        {x: 0.18, z: 0.18}, {x: -0.18, z: 0.18},
        {x: 0.18, z: -0.18}, {x: -0.18, z: -0.18}
    ];
    positions.forEach(pos => {
        const leg = new THREE.Mesh(legGeo, furMat);
        leg.position.set(pos.x, 0.15, pos.z);
        group.add(leg);
        const paw = new THREE.Mesh(new THREE.SphereGeometry(0.1), furMat);
        paw.position.set(pos.x, 0.05, pos.z);
        group.add(paw);
    });

    const tail = new THREE.Mesh(new THREE.SphereGeometry(0.12), furMat);
    tail.position.set(0, 0.5, -0.3);

    group.add(body, headGroup, tail);
    return group;
};

// --- RETRO SNOW CAR COMPONENT (FIXED MODELING) ---
const createSnowCar = () => {
    const group = new THREE.Group();
    const bodyColor = 0xC62828; // Vintage Red
    const windowColor = 0xB3E5FC; // Icy Blue Windows
    
    const matBody = new THREE.MeshStandardMaterial({ color: bodyColor, roughness: 0.3, flatShading: true });
    const matWindow = new THREE.MeshStandardMaterial({ color: windowColor, roughness: 0.1, metalness: 0.5 });
    const matWheel = new THREE.MeshStandardMaterial({ color: 0x333333 });
    const matSnow = new THREE.MeshStandardMaterial({ color: COLORS.snow, roughness: 1 });
    const matBumper = new THREE.MeshStandardMaterial({ color: 0xEEEEEE, metalness: 0.4 });

    // Chassis (Main Body)
    const chassis = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.7, 1.0), matBody);
    chassis.position.y = 0.5;
    chassis.castShadow = true;

    // Cabin (Top Part)
    // Cabin center local to group is (-0.1, 1.0, 0).
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.6, 0.9), matBody);
    cabin.position.set(-0.1, 1.0, 0);
    cabin.castShadow = true;

    // Windows (Simplified) - Fixed positions relative to cabin center (0,0,0 local)
    // Cabin size is 1.2(x) * 0.6(y) * 0.9(z). 
    // Faces are at x=±0.6, y=±0.3, z=±0.45.
    
    // Front Window (on x=+0.6 face)
    const winFront = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.35), matWindow);
    winFront.rotation.y = Math.PI / 2;
    winFront.position.set(0.61, 0, 0); // Slightly offset from x=0.6 face
    
    // Back Window (on x=-0.6 face)
    const winBack = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.35), matWindow);
    winBack.rotation.y = -Math.PI / 2;
    winBack.position.set(-0.61, 0, 0); // Slightly offset from x=-0.6 face

    // Left Window (on z=+0.45 face)
    const winSideL = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.35), matWindow);
    winSideL.position.set(0, 0, 0.46); // Slightly offset from z=0.45 face
    
    // Right Window (on z=-0.45 face)
    const winSideR = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.35), matWindow);
    winSideR.rotation.y = Math.PI;
    winSideR.position.set(0, 0, -0.46); // Slightly offset from z=-0.45 face

    // Add windows to CABIN group so they move with it
    cabin.add(winFront, winBack, winSideL, winSideR);

    // Snow Roof (Mound)
    const snowRoof = new THREE.Mesh(new THREE.SphereGeometry(0.65, 8, 8, 0, Math.PI * 2, 0, Math.PI/1.5), matSnow);
    snowRoof.scale.set(1.1, 0.6, 0.9);
    snowRoof.position.set(-0.1, 1.3, 0);
    
    // Snow Hood (Mound)
    const snowHood = new THREE.Mesh(new THREE.SphereGeometry(0.4, 7, 7, 0, Math.PI * 2, 0, Math.PI/1.5), matSnow);
    snowHood.scale.set(1.2, 0.5, 1.2);
    snowHood.position.set(0.6, 0.85, 0);

    // Bumpers
    const bumperF = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 1.1, 4, 4), matBumper);
    bumperF.rotation.x = Math.PI/2;
    bumperF.position.set(1.0, 0.35, 0);
    
    const bumperB = bumperF.clone();
    bumperB.position.set(-1.0, 0.35, 0);

    // Wheels
    const wGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.25, 10);
    wGeo.rotateX(Math.PI/2);
    const wheels = [
        {x: 0.6, z: 0.4}, {x: 0.6, z: -0.4},
        {x: -0.6, z: 0.4}, {x: -0.6, z: -0.4}
    ];
    wheels.forEach(p => {
        const w = new THREE.Mesh(wGeo, matWheel);
        w.position.set(p.x, 0.3, p.z);
        group.add(w);
    });

    // Headlights
    const lightGeo = new THREE.SphereGeometry(0.12);
    const lightMat = new THREE.MeshStandardMaterial({ color: 0xFFF9C4, emissive: 0xFFF9C4, emissiveIntensity: 0.5 });
    const hlL = new THREE.Mesh(lightGeo, lightMat); hlL.position.set(1.0, 0.6, 0.3);
    const hlR = new THREE.Mesh(lightGeo, lightMat); hlR.position.set(1.0, 0.6, -0.3);

    group.add(chassis, cabin, snowRoof, snowHood, bumperF, bumperB, hlL, hlR);
    return group;
}

const createCabin = () => {
    const group = new THREE.Group();
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x5D4037, flatShading: true });
    const roofMat = new THREE.MeshStandardMaterial({ color: COLORS.roof, flatShading: true });
    
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.5, 1.5, 2.0), woodMat);
    body.position.y = 0.75;
    body.castShadow = true;
    body.receiveShadow = true;
    
    const roof = new THREE.Mesh(new THREE.ConeGeometry(2.2, 1.2, 4), roofMat);
    roof.position.y = 2.1;
    roof.rotation.y = Math.PI / 4;
    roof.scale.set(1, 1, 0.7);
    group.add(body, roof);
    
    const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.8, 0.4), new THREE.MeshStandardMaterial({color: 0x3E2723}));
    chimney.position.set(0.6, 2.0, -0.4);
    group.add(chimney);

    const door = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 1.0), new THREE.MeshStandardMaterial({color: 0x3E2723}));
    door.position.set(0, 0.6, 1.01);
    group.add(door);
    
    const win = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.6), new THREE.MeshStandardMaterial({color: 0xFFEB3B, emissive: 0xFFEB3B, emissiveIntensity: 0.5}));
    win.position.set(0.8, 0.8, 1.01);
    group.add(win);
    
    return group;
};

const createSnowman = () => {
    const group = new THREE.Group();
    const snowMat = new THREE.MeshStandardMaterial({ color: COLORS.snow });
    
    const bottom = new THREE.Mesh(new THREE.SphereGeometry(0.4, 8, 8), snowMat);
    bottom.position.y = 0.3;
    
    const middle = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 8), snowMat);
    middle.position.y = 0.85;
    
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), snowMat);
    head.position.y = 1.25;
    
    const armGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.5);
    const armMat = new THREE.MeshStandardMaterial({ color: COLORS.wood });
    const armL = new THREE.Mesh(armGeo, armMat);
    armL.position.set(0.3, 0.9, 0);
    armL.rotation.z = Math.PI / 2 + 0.3;
    const armR = armL.clone();
    armR.position.set(-0.3, 0.9, 0);
    armR.rotation.z = -Math.PI / 2 - 0.3;

    const hat = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.25), new THREE.MeshStandardMaterial({ color: 0x333333 }));
    hat.position.y = 1.5;
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.02), new THREE.MeshStandardMaterial({ color: 0x333333 }));
    brim.position.y = 1.38;

    group.add(bottom, middle, head, armL, armR, hat, brim);
    return group;
};

const createCandyCane = () => {
    const group = new THREE.Group();
    const geo = new THREE.CylinderGeometry(0.05, 0.05, 1.2, 8);
    const mat = new THREE.MeshStandardMaterial({ color: COLORS.candy_red });
    const stick = new THREE.Mesh(geo, mat);
    stick.position.y = 0.6;
    
    const hookGeo = new THREE.TorusGeometry(0.15, 0.05, 4, 8, Math.PI);
    const hook = new THREE.Mesh(hookGeo, mat);
    hook.position.set(0.15, 1.2, 0);
    
    group.add(stick, hook);
    return group;
};

const createFirewoodPile = () => {
    const group = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color: COLORS.wood });
    const logGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.5);
    logGeo.rotateZ(Math.PI/2);
    
    for(let i=0; i<3; i++) {
        const log = new THREE.Mesh(logGeo, mat);
        log.position.set(0, 0.06, (i-1)*0.12);
        group.add(log);
    }
    const logTop = new THREE.Mesh(logGeo, mat);
    logTop.position.set(0, 0.15, 0);
    group.add(logTop);
    return group;
};

const createSnowPile = () => {
    const geo = new THREE.SphereGeometry(0.3, 7, 6, 0, Math.PI*2, 0, Math.PI/2);
    const mat = new THREE.MeshStandardMaterial({ color: COLORS.snow });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.scale.set(1.5, 0.5, 1.5);
    return mesh;
};

const createWinterBush = () => {
    const group = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color: COLORS.tree_light });
    const snowMat = new THREE.MeshStandardMaterial({ color: COLORS.snow });
    
    const main = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.6, 6), mat);
    main.position.y = 0.3;
    const topSnow = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.25, 6), snowMat);
    topSnow.position.y = 0.5;
    
    group.add(main, topSnow);
    return group;
};

const createRoundBush = () => {
    const group = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color: COLORS.tree_dark });
    const bush = new THREE.Mesh(new THREE.SphereGeometry(0.35, 6, 5), mat);
    bush.position.y = 0.2;
    group.add(bush);
    return group;
};

const createMushroom = () => {
    const group = new THREE.Group();
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.2), new THREE.MeshStandardMaterial({ color: 0xFFE0B2 }));
    stem.position.y = 0.1;
    const cap = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.1, 8), new THREE.MeshStandardMaterial({ color: 0xD32F2F }));
    cap.position.y = 0.25;
    group.add(stem, cap);
    return group;
};

const createDecoratedTree = (scale = 1, isGrand = false) => {
    const group = new THREE.Group();
    const treeColor = COLORS.tree_dark;
    const treeMat = new THREE.MeshStandardMaterial({ color: treeColor, flatShading: true });
    
    // Trunk
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.15 * scale, 0.2 * scale, 0.8 * scale), new THREE.MeshStandardMaterial({ color: COLORS.wood }));
    trunk.position.y = 0.4 * scale;
    group.add(trunk);

    // Layers
    const layers = isGrand ? 5 : 3;
    for(let i=0; i<layers; i++) {
        const radius = (0.8 - i*0.15) * scale * (isGrand ? 1.5 : 1);
        const height = 0.8 * scale * (isGrand ? 1.2 : 1);
        const y = (0.8 + i*0.5) * scale;
        const cone = new THREE.Mesh(new THREE.ConeGeometry(radius, height, 8), treeMat);
        cone.position.y = y;
        cone.castShadow = true;
        group.add(cone);
        
        // Ornaments
        if (i < layers - 1) {
             for(let j=0; j<4 + i; j++) {
                 const angle = (j / (4+i)) * Math.PI * 2;
                 const oRad = radius * 0.85;
                 const ox = Math.cos(angle) * oRad;
                 const oz = Math.sin(angle) * oRad;
                 const oy = y - height * 0.35;
                 
                 const colors = [COLORS.ornament_red, COLORS.ornament_gold, COLORS.ornament_blue, COLORS.candy_white];
                 const color = colors[Math.floor(Math.random() * colors.length)];
                 const ball = new THREE.Mesh(new THREE.SphereGeometry(0.08 * scale), new THREE.MeshStandardMaterial({ color: color, roughness: 0.4, metalness: 0.6 }));
                 ball.position.set(ox, oy, oz);
                 group.add(ball);
             }
        }
    }
    
    // Top Star
    const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.15 * scale), new THREE.MeshBasicMaterial({ color: COLORS.gold }));
    star.position.y = (0.8 + layers * 0.5) * scale;
    group.add(star);

    return group;
};

const createSantaGroup = () => {
    const group = new THREE.Group();
    const content = new THREE.Group();
    
    // --- SLEIGH (High Detail) ---
    const sleighGroup = new THREE.Group();
    
    // Main Body: Glossy Red with curve hint
    const sleighBodyGeo = new THREE.BoxGeometry(2.2, 0.8, 1.4);
    const sleighMat = new THREE.MeshStandardMaterial({color: 0xB71C1C, roughness: 0.2, metalness: 0.1});
    const sleighBody = new THREE.Mesh(sleighBodyGeo, sleighMat);
    sleighBody.position.y = 0.6;
    
    // Gold Trim: Detailed railing
    const trimMat = new THREE.MeshStandardMaterial({color: 0xFFD700, metalness: 0.7, roughness: 0.2});
    const trimSideL = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.3), trimMat);
    trimSideL.rotation.z = Math.PI / 2;
    trimSideL.position.set(0, 1.05, 0.75);
    const trimSideR = trimSideL.clone();
    trimSideR.position.set(0, 1.05, -0.75);
    const trimFront = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.5), trimMat);
    trimFront.rotation.x = Math.PI / 2;
    trimFront.position.set(1.15, 1.05, 0);
    const trimBack = trimFront.clone();
    trimBack.position.set(-1.15, 1.05, 0);
    
    // Seat: Upholstered look
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.6, 1.2), new THREE.MeshStandardMaterial({color: 0x5D4037, roughness: 0.9}));
    seat.position.set(-0.5, 0.8, 0);
    const seatBack = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 1.2, 4, 1, false, 0, Math.PI), new THREE.MeshStandardMaterial({color: 0x8D6E63}));
    seatBack.rotation.z = Math.PI / 2;
    seatBack.rotation.x = Math.PI / 2;
    seatBack.position.set(-0.9, 1.2, 0);

    // Runners: Gold Spirals
    const runnerMat = new THREE.MeshStandardMaterial({color: 0xFFD700, metalness: 0.6}); 
    const createFancyRunner = () => {
        const rGroup = new THREE.Group();
        // Main curve
        const curve = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.08, 6, 16, Math.PI), runnerMat);
        curve.rotation.y = Math.PI;
        curve.scale.set(1.2, 0.5, 1);
        curve.position.set(0.2, 0, 0);
        
        // Front curl
        const curl = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.06, 6, 12, Math.PI * 1.5), runnerMat);
        curl.position.set(1.4, 0.3, 0);
        curl.rotation.z = Math.PI / 4;

        // Base
        const base = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.1, 0.1), runnerMat);
        base.position.set(0, -0.5, 0);
        
        // Struts
        const s1 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.8), runnerMat); s1.position.set(0.8, -0.1, 0);
        const s2 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.8), runnerMat); s2.position.set(-0.8, -0.1, 0);
        
        rGroup.add(curve, curl, base, s1, s2);
        return rGroup;
    }
    const runnerL = createFancyRunner(); runnerL.position.set(0, 0.4, 0.6);
    const runnerR = createFancyRunner(); runnerR.position.set(0, 0.4, -0.6);
    
    sleighGroup.add(sleighBody, trimSideL, trimSideR, trimFront, trimBack, seat, seatBack, runnerL, runnerR);

    // --- SANTA (High Detail) ---
    const santaGroup = new THREE.Group();
    santaGroup.position.set(-0.3, 1.3, 0); 
    
    const santaRed = new THREE.MeshStandardMaterial({color: 0xD32F2F});
    const santaWhite = new THREE.MeshStandardMaterial({color: 0xFFFFFF, roughness: 1.0}); // Fur
    const santaSkin = new THREE.MeshStandardMaterial({color: 0xFFCCBC});

    // Legs & Boots
    const legL = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.6), santaRed);
    legL.position.set(0.2, 0.3, 0.25); legL.rotation.x = -Math.PI/2;
    const legR = legL.clone(); legR.position.set(0.2, 0.3, -0.25);
    
    const bootL = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.15, 0.4), new THREE.MeshStandardMaterial({color: 0x111111}));
    bootL.rotation.x = -Math.PI/2; bootL.position.set(0.5, 0.3, 0.25);
    const bootR = bootL.clone(); bootR.position.set(0.5, 0.3, -0.25);

    // Torso & Coat
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.55, 0.8, 8), santaRed);
    body.position.y = 0.4;
    
    // White Coat Trim (Vertical)
    const trimV = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.8, 0.92), santaWhite);
    trimV.position.set(0.1, 0.4, 0); 

    // White Coat Trim (Bottom)
    const trimB = new THREE.Mesh(new THREE.CylinderGeometry(0.56, 0.56, 0.15, 8), santaWhite);
    trimB.position.y = 0.05;

    // Belt
    const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.52, 0.12, 8), new THREE.MeshStandardMaterial({color: 0x212121}));
    belt.position.y = 0.35;
    const buckle = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.03, 4, 4), new THREE.MeshStandardMaterial({color: 0xFFD700}));
    buckle.rotation.y = Math.PI / 4; // Square diamond
    buckle.position.set(0.45, 0.35, 0);

    // Head
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.32, 10, 10), santaSkin);
    head.position.y = 0.95;
    
    // Face Features
    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.06), new THREE.MeshStandardMaterial({color: 0xE57373}));
    nose.position.set(0.3, 0.95, 0);
    const eyeGeo = new THREE.SphereGeometry(0.035);
    const eyeMat = new THREE.MeshBasicMaterial({color: 0x000000});
    const eyeL = new THREE.Mesh(eyeGeo, eyeMat); eyeL.position.set(0.28, 1.02, 0.12);
    const eyeR = eyeL.clone(); eyeR.position.set(0.28, 1.02, -0.12);
    
    // Beard & Mustache
    const beard = new THREE.Mesh(new THREE.SphereGeometry(0.32, 8, 8, 0, Math.PI * 2, 0, Math.PI/1.8), santaWhite);
    beard.position.set(0.05, 0.9, 0);
    beard.scale.set(1, 1.2, 0.8);
    beard.rotation.x = -0.3;
    beard.rotation.z = -Math.PI/2;

    const mustacheL = new THREE.Mesh(new THREE.CapsuleGeometry(0.04, 0.15), santaWhite);
    mustacheL.rotation.z = Math.PI / 2;
    mustacheL.rotation.y = -0.3;
    mustacheL.position.set(0.32, 0.9, 0.12);
    const mustacheR = mustacheL.clone();
    mustacheR.rotation.y = 0.3;
    mustacheR.position.set(0.32, 0.9, -0.12);

    // Hat (Floppy)
    const hatBase = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.12, 5, 12), santaWhite);
    hatBase.position.y = 1.15;
    hatBase.rotation.x = Math.PI/2;
    const hatMid = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.32, 0.4, 8), santaRed);
    hatMid.position.y = 1.35;
    hatMid.rotation.z = -0.2;
    const hatTip = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.5, 8), santaRed);
    hatTip.position.set(-0.2, 1.6, 0);
    hatTip.rotation.z = -0.6;
    const hatPom = new THREE.Mesh(new THREE.SphereGeometry(0.12), santaWhite);
    hatPom.position.set(-0.45, 1.75, 0);

    // Arms
    const armGeo = new THREE.CylinderGeometry(0.1, 0.13, 0.5);
    const armL = new THREE.Mesh(armGeo, santaRed);
    armL.position.set(0.2, 0.65, 0.45); armL.rotation.x = -1.2; armL.rotation.z = -0.2;
    const armR = new THREE.Mesh(armGeo, santaRed);
    armR.position.set(0.2, 0.65, -0.45); armR.rotation.x = 1.2; armR.rotation.z = -0.2;
    
    // Gloves
    const gloveGeo = new THREE.SphereGeometry(0.14);
    const gloveMat = new THREE.MeshStandardMaterial({color: 0x1B5E20}); // Green gloves for contrast
    const gloveL = new THREE.Mesh(gloveGeo, gloveMat); gloveL.position.set(0, 0.3, 0); armL.add(gloveL);
    const gloveR = new THREE.Mesh(gloveGeo, gloveMat); gloveR.position.set(0, 0.3, 0); armR.add(gloveR);

    santaGroup.add(legL, legR, bootL, bootR, body, trimB, trimV, belt, buckle, head, nose, eyeL, eyeR, beard, mustacheL, mustacheR, hatBase, hatMid, hatTip, hatPom, armL, armR);
    
    // Bag of Toys (Overflowing)
    const bagGroup = new THREE.Group();
    bagGroup.position.set(-1.2, 1.2, 0);
    const bagMain = new THREE.Mesh(new THREE.SphereGeometry(0.7, 8, 8), new THREE.MeshStandardMaterial({color: 0x8D6E63}));
    bagMain.scale.set(1, 0.8, 1);
    bagGroup.add(bagMain);
    // Toys sticking out
    const toy1 = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.4), new THREE.MeshStandardMaterial({color: COLORS.ornament_blue}));
    toy1.position.set(0.2, 0.5, 0.2); toy1.rotation.y = 0.5;
    const toy2 = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.6), new THREE.MeshStandardMaterial({color: COLORS.candy_red}));
    toy2.position.set(-0.1, 0.6, -0.2); toy2.rotation.z = 0.3;
    bagGroup.add(toy1, toy2);

    content.add(sleighGroup, santaGroup, bagGroup);
    
    // --- REINDEER (Slightly refined) ---
    for(let i=1; i<=2; i++) {
        const deer = new THREE.Group();
        deer.position.set(2.5 + i*2.0, 0.5, 0); // Spaced out more
        
        // Body
        const dBody = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 0.4), new THREE.MeshStandardMaterial({color: 0x8D6E63}));
        
        // Head
        const dHead = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 0.3), new THREE.MeshStandardMaterial({color: 0x8D6E63}));
        dHead.position.set(0.5, 0.4, 0);
        
        const isRudolph = (i === 2);
        const dNose = new THREE.Mesh(
            new THREE.SphereGeometry(0.08), 
            new THREE.MeshStandardMaterial({
                color: isRudolph ? 0xFF0000 : 0x212121, 
                emissive: isRudolph ? 0xFF0000 : 0x000000, 
                emissiveIntensity: isRudolph ? 2.0 : 0 
            })
        ); 
        dNose.position.set(0.7, 0.4, 0);
        if (isRudolph) {
             const light = new THREE.PointLight(0xFF0000, 1, 2);
             light.position.set(0.8, 0.4, 0);
             deer.add(light);
        }

        // Antlers
        const antlerL = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.5), new THREE.MeshStandardMaterial({color: 0xD7CCC8}));
        antlerL.position.set(0.5, 0.7, 0.15); antlerL.rotation.z = -0.3; antlerL.rotation.x = 0.4;
        const antlerR = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.5), new THREE.MeshStandardMaterial({color: 0xD7CCC8}));
        antlerR.position.set(0.5, 0.7, -0.15); antlerR.rotation.z = -0.3; antlerR.rotation.x = -0.4;

        // Legs
        const legGeo = new THREE.CylinderGeometry(0.06, 0.05, 0.5);
        const legMat = new THREE.MeshStandardMaterial({color: 0x5D4037});
        const l1 = new THREE.Mesh(legGeo, legMat); l1.position.set(0.3, -0.3, 0.15);
        const l2 = new THREE.Mesh(legGeo, legMat); l2.position.set(0.3, -0.3, -0.15);
        const l3 = new THREE.Mesh(legGeo, legMat); l3.position.set(-0.3, -0.3, 0.15); l3.rotation.z = 0.4; // Running
        const l4 = new THREE.Mesh(legGeo, legMat); l4.position.set(-0.3, -0.3, -0.15); l4.rotation.z = -0.4;

        const tail = new THREE.Mesh(new THREE.SphereGeometry(0.1), new THREE.MeshStandardMaterial({color: 0xFFFFFF}));
        tail.position.set(-0.45, 0.2, 0);

        deer.add(dBody, dHead, dNose, antlerL, antlerR, l1, l2, l3, l4, tail);
        content.add(deer);
        
        // Reins
        const rein = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.04, 0.04), new THREE.MeshStandardMaterial({color: 0x5D4037}));
        rein.position.set(1.5 + (i-1)*2.0, 0.6, 0);
        content.add(rein);
    }
    
    // Rotate content so -X (Forward) faces +Z (LookAt direction)
    // -Math.PI / 2 means +X (Reindeer) points to +Z (Global Target)
    content.rotation.y = -Math.PI / 2;
    group.add(content);
    group.scale.set(1.4, 1.4, 1.4);
    
    return group;
  };

  const createGiftBoxes = () => {
      const group = new THREE.Group();
      
      const createFancyBox = (color: number, ribbonColor: number, x: number, z: number, scale: number, heightMult = 1) => {
          const box = new THREE.Group();
          const w = 0.6;
          const h = 0.6 * heightMult;
          const d = 0.6;

          // Box Base
          const mat = new THREE.MeshStandardMaterial({ color: color, roughness: 0.3, metalness: 0.1 });
          const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
          mesh.castShadow = true;
          
          // Lid
          const lidH = 0.1;
          const lid = new THREE.Mesh(new THREE.BoxGeometry(w + 0.04, lidH, d + 0.04), mat);
          lid.position.y = h/2;
          lid.castShadow = true;
          
          // Ribbon Strips (Vertical)
          const ribMat = new THREE.MeshStandardMaterial({ color: ribbonColor, emissive: ribbonColor, emissiveIntensity: 0.2, roughness: 0.5 });
          const ribW = 0.12;
          const rib1 = new THREE.Mesh(new THREE.BoxGeometry(w + 0.05, h + 0.02, ribW), ribMat);
          const rib2 = new THREE.Mesh(new THREE.BoxGeometry(ribW, h + 0.02, d + 0.05), ribMat);
          
          // Puffy Bow
          const bowGroup = new THREE.Group();
          bowGroup.position.y = h/2 + 0.05;
          const bowLoopGeo = new THREE.TorusGeometry(0.15, 0.06, 6, 12);
          const b1 = new THREE.Mesh(bowLoopGeo, ribMat); b1.rotation.y = Math.PI/4; b1.position.y = 0.1;
          const b2 = new THREE.Mesh(bowLoopGeo, ribMat); b2.rotation.y = -Math.PI/4; b2.position.y = 0.1;
          const b3 = new THREE.Mesh(bowLoopGeo, ribMat); b3.rotation.y = Math.PI/4; b3.rotation.x = Math.PI/2; b3.position.y = 0.1;
          const knot = new THREE.Mesh(new THREE.SphereGeometry(0.08), ribMat); knot.position.y = 0.1;
          
          bowGroup.add(b1, b2, b3, knot);

          box.add(mesh, lid, rib1, rib2, bowGroup);
          box.position.set(x, h/2, z);
          box.scale.setScalar(scale);
          group.add(box);
          return box;
      };

      createFancyBox(0xD32F2F, 0xFFD700, 0, 0, 1.0, 1.0);     // Red/Gold
      createFancyBox(0x2E8B57, 0xFFFFFF, -0.9, 0.3, 0.9, 0.8); // Green/White
      createFancyBox(0x1976D2, 0xC0C0C0, 0.9, -0.2, 0.95, 1.2); // Blue/Silver Tall
      
      return group;
  };

const createPlayer = () => {
    const group = new THREE.Group();
    const bodyMat = new THREE.MeshStandardMaterial({ color: COLORS.player });
    const skinMat = new THREE.MeshStandardMaterial({ color: COLORS.player_skin });
    const whiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff });

    const body = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.7, 8), bodyMat);
    body.position.y = 0.35;
    body.castShadow = true;
    
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 10), skinMat);
    head.position.y = 0.8;
    
    const hat = new THREE.Mesh(new THREE.ConeGeometry(0.23, 0.4), bodyMat);
    hat.position.y = 1.05;
    const pompom = new THREE.Mesh(new THREE.SphereGeometry(0.06), whiteMat);
    pompom.position.y = 1.25;
    
    const scarf = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.06, 6, 12), new THREE.MeshStandardMaterial({color: 0x4CAF50}));
    scarf.rotation.x = Math.PI/2;
    scarf.position.y = 0.65;
    
    group.add(body, head, hat, pompom, scarf);
    return group;
};

const createAnimalMesh = (type: string) => {
    switch(type) {
        case 'CAT_BLUE': return createBlueCat();
        case 'CAT_RAGDOLL': return createRagdoll();
        case 'CAT_BLACK': return createBlackCat();
        case 'DOG_TEDDY': return createTeddyDog();
        default: return createBlueCat();
    }
};

const createMarker = () => {
    const group = new THREE.Group();
    const star = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.25),
        new THREE.MeshBasicMaterial({ color: COLORS.marker_glow })
    );
    star.scale.set(1, 1, 0.4); 
    star.position.y = 2.5; 
    group.add(star);

    const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.5, 0.7, 32),
        new THREE.MeshBasicMaterial({ color: COLORS.marker_ring, transparent: true, opacity: 0.6, side: THREE.DoubleSide })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.05;
    group.add(ring);
    return group;
};

const createHeartEffect = () => {
    const group = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color: COLORS.candy_red, emissive: 0x880000 });
    const c = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.4), mat);
    c.rotation.z = Math.PI / 4;
    c.rotation.y = Math.PI / 4;
    group.add(c);
    
    group.position.set(0, 2.0, 0);
    group.scale.set(0, 0, 0); // Start hidden
    return group;
};

// --- MINI AVATAR COMPONENT ---

const AnimalAvatar: React.FC<{ type: string }> = ({ type }) => {
    const mountRef = useRef<HTMLDivElement>(null);
    const [renderer, setRenderer] = useState<THREE.WebGLRenderer | null>(null);

    useEffect(() => {
        if (!mountRef.current) return;

        // Scene Setup
        const scene = new THREE.Scene();
        // Transparent background
        
        // Lighting similar to game
        const ambient = new THREE.AmbientLight(0xffffff, 0.7);
        const dirLight = new THREE.DirectionalLight(0xfffce3, 1.5);
        dirLight.position.set(5, 5, 5);
        scene.add(ambient, dirLight);

        // Camera Setup (Portrait mode)
        const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 20);
        camera.position.set(2, 2, 2);
        camera.lookAt(0, 0.35, 0); // Focus on animal center
        camera.zoom = 1.0;
        camera.updateProjectionMatrix();

        // Renderer
        const newRenderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        newRenderer.setSize(100, 100); // Small fixed size
        newRenderer.setPixelRatio(window.devicePixelRatio);
        mountRef.current.appendChild(newRenderer.domElement);
        setRenderer(newRenderer);

        // Create Mesh
        let mesh;
        switch(type) {
            case 'CAT_BLUE': mesh = createBlueCat(); break;
            case 'CAT_RAGDOLL': mesh = createRagdoll(); break;
            case 'CAT_BLACK': mesh = createBlackCat(); break;
            case 'DOG_TEDDY': mesh = createTeddyDog(); break;
        }

        if (mesh) {
            // Adjust mesh for portrait
            mesh.scale.setScalar(1.2);
            scene.add(mesh);
        }

        // Animation Loop
        let frameId: number;
        const animate = () => {
            frameId = requestAnimationFrame(animate);
            if (mesh) {
                mesh.rotation.y += 0.015; // Slow spin
            }
            newRenderer.render(scene, camera);
        };
        animate();

        return () => {
            cancelAnimationFrame(frameId);
            newRenderer.dispose();
            if (mountRef.current) mountRef.current.innerHTML = '';
        };
    }, [type]);

    return <div ref={mountRef} className="w-[100px] h-[100px]" />;
};

// --- MAIN GAMECANVAS COMPONENT ---

const GameCanvas: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Game Logic State
  const [gameState, setGameState] = useState<GameState>({
    isPlaying: false,
    isWon: false,
    envelopeOpen: false,
    letterContent: null,
    loadingLetter: false,
    score: 0
  });

  const [showSuccessUI, setShowSuccessUI] = useState(false);

  // Joystick State for UI
  const [joystickState, setJoystickState] = useState({
    active: false,
    cx: 0, cy: 0, kx: 0, ky: 0
  });

  // Blessing State
  const [blessing, setBlessing] = useState<{text: string, subtext?: string, key: number, type?: 'santa' | 'normal'} | null>(null);
  const blessingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Guide UI Ref (for high performance updates)
  const guideRef = useRef<HTMLDivElement>(null);

  // Refs for 3D engine
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const playerMeshRef = useRef<THREE.Group | null>(null);
  const animalsRef = useRef<Map<string, { mesh: THREE.Group, marker: THREE.Group, light: THREE.PointLight, heart: THREE.Group, data: any }>>(new Map());
  const particlesRef = useRef<THREE.Points | null>(null);
  const smokeParticlesRef = useRef<THREE.Group | null>(null); 
  const exitRef = useRef<THREE.Group | null>(null);
  const winTriggeredRef = useRef<boolean>(false);
  const explosionsRef = useRef<{group: THREE.Group, particles: {mesh: THREE.Mesh, velocity: THREE.Vector3, life: number}[], gravity: number}[]>([]);
  const snowDomeRef = useRef<THREE.Mesh | null>(null);
  
  // Santa & Gifts Refs
  const santaRef = useRef<THREE.Group | null>(null);
  const giftsRef = useRef<THREE.Group | null>(null);
  const giftsVisibleRef = useRef<boolean>(false);
  
  // Phase: 'HIDDEN' | 'ARRIVING' | 'PARKED'
  const santaStateRef = useRef({ phase: 'HIDDEN', progress: 0, startPos: new THREE.Vector3(), endPos: new THREE.Vector3() });
  const prevRescuedRef = useRef(0);
  
  // Camera State (Smoothed Focus & Zoom)
  const cameraStateRef = useRef({
      target: new THREE.Vector3(0, 0, 8),
      currentZoom: 1.0
  });

  // Zoom Animation State (Rescue Bump)
  const zoomStateRef = useRef({ active: false, startTime: 0, duration: 1500, peak: 1.20 });

  const inputRef = useRef<InputState>({ 
    left: false, right: false, up: false, down: false, 
    vector: { x: 0, y: 0 } 
  });
  
  const playerPosRef = useRef({ x: 0, z: 8, moving: false });
  const trailRef = useRef<{x: number, z: number}[]>([]);
  const frameIdRef = useRef<number>(0);

  // --- RESTART LOGIC ---
  const handleRestart = () => {
    // 1. Reset React State
    setGameState({
        isPlaying: true, 
        isWon: false,
        envelopeOpen: false,
        letterContent: null,
        loadingLetter: false,
        score: 0
    });
    setShowSuccessUI(false);
    setBlessing(null);
    if (guideRef.current) guideRef.current.style.display = 'none';

    // 2. Reset Logic Refs
    playerPosRef.current = { x: 0, z: 8, moving: false };
    inputRef.current = { left: false, right: false, up: false, down: false, vector: { x: 0, y: 0 } };
    trailRef.current = [];
    winTriggeredRef.current = false;
    giftsVisibleRef.current = false;
    prevRescuedRef.current = 0;
    
    santaStateRef.current = { phase: 'HIDDEN', progress: 0, startPos: new THREE.Vector3(), endPos: new THREE.Vector3() };
    cameraStateRef.current = { target: new THREE.Vector3(0, 0, 8), currentZoom: 1.0 };
    zoomStateRef.current = { active: false, startTime: 0, duration: 1500, peak: 1.20 };
    
    // Reset Fog
    if (sceneRef.current) {
        sceneRef.current.fog = new THREE.Fog(COLORS.background, 30, 80);
    }

    // 3. Reset 3D Positions
    if (playerMeshRef.current) {
        playerMeshRef.current.position.set(0, 0, 8);
        playerMeshRef.current.rotation.set(0, 0, 0);
    }
    if (santaRef.current) santaRef.current.position.set(0, -100, 0);
    if (giftsRef.current) giftsRef.current.position.set(0, -100, 0);

    // 4. Reset Animals
    const configEntries = Object.entries(ANIMAL_CONFIGS);
    let idx = 0;
    animalsRef.current.forEach((animal) => {
         const angle = (idx / configEntries.length) * Math.PI * 2 + 1.0;
         const dist = 7 + Math.random() * 3; 
         animal.mesh.position.set(Math.cos(angle) * dist, 0, Math.sin(angle) * dist);
         animal.mesh.rotation.y = Math.random() * Math.PI * 2;
         
         animal.data.isRescued = false;
         if(animal.heart) animal.heart.visible = false;
         if(animal.marker) animal.marker.visible = true;
         if(animal.light) animal.light.intensity = 1.5;
         idx++;
    });
  };

  const handleOpenGift = () => {
      setShowSuccessUI(false);
      setGameState(prev => ({...prev, isWon: true, envelopeOpen: true }));
      playMusicBoxTune();
  };

  // --- COMPONENT SCOPED HELPERS ---
  const createExplosion = (pos: THREE.Vector3, colorOverride?: string | number) => {
    if (!sceneRef.current) return;
    const group = new THREE.Group();
    group.position.copy(pos);
    sceneRef.current.add(group);
    
    const particles: {mesh: THREE.Mesh, velocity: THREE.Vector3, life: number}[] = [];
    const colors = [COLORS.gold, COLORS.candy_red, COLORS.ornament_blue, COLORS.ornament_gold];
    const geometry = new THREE.OctahedronGeometry(0.15); // Star-like
    
    for(let i=0; i<40; i++) {
        const color = colorOverride !== undefined ? colorOverride : colors[Math.floor(Math.random() * colors.length)];
        const material = new THREE.MeshBasicMaterial({ color: color });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.rotation.set(Math.random()*Math.PI, Math.random()*Math.PI, Math.random()*Math.PI);
        group.add(mesh);
        
        const velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 0.6,
            (Math.random() * 0.8) + 0.2, 
            (Math.random() - 0.5) * 0.6
        );
        particles.push({ mesh, velocity, life: 1.0 });
    }
    
    explosionsRef.current.push({ group, particles, gravity: 0.015 });
  };

  const createSnowBurst = (pos: THREE.Vector3) => {
    if (!sceneRef.current) return;
    const group = new THREE.Group();
    group.position.copy(pos);
    sceneRef.current.add(group);
    
    const particles: {mesh: THREE.Mesh, velocity: THREE.Vector3, life: number}[] = [];
    const geometry = new THREE.TetrahedronGeometry(0.12); 
    
    for(let i=0; i<15; i++) {
        const material = new THREE.MeshBasicMaterial({ color: 0xFFFFFF, transparent: true, opacity: 0.9 });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.rotation.set(Math.random()*Math.PI, Math.random()*Math.PI, Math.random()*Math.PI);
        group.add(mesh);
        
        // Gentle flutter
        const velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 0.4,
            (Math.random() * 0.4) + 0.1, 
            (Math.random() - 0.5) * 0.4
        );
        particles.push({ mesh, velocity, life: 1.5 });
    }
    explosionsRef.current.push({ group, particles, gravity: 0.005 });
  };

  const createEnvironment = (scene: THREE.Scene) => {
     const radius = 18;
     const topMat = new THREE.MeshStandardMaterial({ color: COLORS.snow, roughness: 1.0 });
     const top = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, 0.1, 64), topMat);
     top.receiveShadow = true;
     scene.add(top);

     const side = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius * 0.95, 2, 64, 1, true), new THREE.MeshStandardMaterial({ color: COLORS.base_side }));
     side.position.y = -1;
     scene.add(side);

     // --- NEW HEMISPHERE (FLOATING ISLAND BOTTOM - CRYSTAL) ---
     // Use fewer segments for a faceted crystal look
     const bottomGeo = new THREE.SphereGeometry(radius * 0.95, 32, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
     
     const bottomMat = new THREE.MeshPhysicalMaterial({
         color: 0x88CCFF,        // Icy/Crystal Blue
         emissive: 0x003366,     // Subtle deep blue glow from inside
         emissiveIntensity: 0.3,
         roughness: 0.1,         // Very smooth surface
         metalness: 0.1,
         transmission: 0.6,      // Glass-like transparency
         thickness: 3.0,         // Refraction volume
         transparent: true,
         opacity: 0.9,
         flatShading: true,      // Faceted crystal look
         clearcoat: 1.0,         // Shiny coating
         clearcoatRoughness: 0.1
     });

     const bottom = new THREE.Mesh(bottomGeo, bottomMat);
     bottom.position.y = -2;
     bottom.scale.set(1, 0.6, 1); 
     scene.add(bottom);
     // ---------------------------------------------

     // --- SNOW DOME (GLASS COVER) ---
     // FULL CRYSTAL SPHERE ENCLOSING EVERYTHING
     const domeGeo = new THREE.SphereGeometry(23, 64, 48); // High poly for smooth glass
     const domeMat = new THREE.MeshPhysicalMaterial({
         color: 0xE0F7FA,        // Very light cyan
         emissive: 0x004d40,     // Deep teal glow
         emissiveIntensity: 0.0, // Start 0
         transmission: 1.0,      // Fully transmissive
         opacity: 0,             // Start invisible
         transparent: true,
         roughness: 0.0,         // Perfectly smooth
         metalness: 0.0,
         ior: 2.0,               // High index of refraction (Crystal/Diamond)
         thickness: 2.5,         // Volume refraction
         specularIntensity: 1.0,
         clearcoat: 1.0,
         side: THREE.DoubleSide,
         depthWrite: false
     });
     const dome = new THREE.Mesh(domeGeo, domeMat);
     // Center roughly between top tree and bottom of island (approx center of mass)
     dome.position.set(0, -2, 0); 
     dome.visible = false; 
     scene.add(dome);
     snowDomeRef.current = dome;
     // ---------------------------------------------

     const cabin = createCabin();
     cabin.position.set(-6, 0, -2);
     cabin.rotation.y = Math.PI / 6;
     cabin.scale.set(1.2, 1.2, 1.2);
     scene.add(cabin);

     for(let i=0; i<26; i++) { // Increased tree count from 18 to 26
         const tree = createDecoratedTree(1 + Math.random() * 0.4);
         const angle = Math.random() * Math.PI * 2;
         const dist = 4 + Math.random() * 12; 
         if (dist < 8 && Math.abs(angle - Math.PI) < 0.5) continue;
         tree.position.set(Math.cos(angle) * dist, 0, Math.sin(angle) * dist);
         scene.add(tree);
     }

     for(let i=0; i<5; i++) {
         const sm = createSnowman();
         sm.position.set((Math.random()-0.5)*20, 0, (Math.random()-0.5)*20);
         if(sm.position.length() < 16) scene.add(sm);
         
         const cc = createCandyCane();
         cc.position.set((Math.random()-0.5)*24, 0, (Math.random()-0.5)*24);
         cc.rotation.y = Math.random() * Math.PI;
         if(cc.position.length() < 16) scene.add(cc);
     }

     // --- ADD SNOW CAR ---
     const car = createSnowCar();
     car.position.set(-3.5, 0, 3.5); // Parked near the path
     car.rotation.y = Math.PI / 5;
     scene.add(car);
     // --------------------

     // --- ADD SNOW PILES AND FIREWOOD PILES (Existing) ---
     for(let i=0; i<6; i++) {
        const isWood = Math.random() > 0.5;
        const item = isWood ? createFirewoodPile() : createSnowPile();
        
        // Random pos
        const angle = Math.random() * Math.PI * 2;
        const dist = 5 + Math.random() * 10;
        
        item.position.set(Math.cos(angle) * dist, 0, Math.sin(angle) * dist);
        item.rotation.y = Math.random() * Math.PI;
        
        // Avoid spawning too close to start
        if (item.position.length() > 3) { 
            scene.add(item);
        }
     }

     // --- NEW: Add Winter Bushes (6-8) ---
     for(let i=0; i<8; i++) {
         const bush = createWinterBush();
         const angle = Math.random() * Math.PI * 2;
         const dist = 5 + Math.random() * 12;
         bush.position.set(Math.cos(angle)*dist, 0, Math.sin(angle)*dist);
         bush.rotation.y = Math.random() * Math.PI;
         // Avoid center
         if(bush.position.length() > 3) scene.add(bush);
     }

     // --- NEW: Add Round Bushes (10-12) ---
     for(let i=0; i<12; i++) {
         const rBush = createRoundBush();
         const angle = Math.random() * Math.PI * 2;
         const dist = 3 + Math.random() * 11;
         rBush.position.set(Math.cos(angle)*dist, 0, Math.sin(angle)*dist);
         rBush.rotation.y = Math.random() * Math.PI;
         if(rBush.position.length() > 2) scene.add(rBush);
     }

     // --- NEW: Add more Snow Piles (10) ---
     for(let i=0; i<10; i++) {
         const pile = createSnowPile();
         const angle = Math.random() * Math.PI * 2;
         const dist = 4 + Math.random() * 13;
         pile.position.set(Math.cos(angle)*dist, 0, Math.sin(angle)*dist);
         pile.scale.setScalar(0.6 + Math.random() * 0.4);
         pile.rotation.y = Math.random() * Math.PI;
         if(pile.position.length() > 3) scene.add(pile);
     }

     // --- NEW: Add Mushrooms (5-6) ---
     for(let i=0; i<6; i++) {
         const mush = createMushroom();
         const angle = Math.random() * Math.PI * 2;
         const dist = 3 + Math.random() * 8; // Can be closer
         mush.position.set(Math.cos(angle)*dist, 0, Math.sin(angle)*dist);
         mush.rotation.y = Math.random() * Math.PI;
         if(mush.position.length() > 2) scene.add(mush);
     }

     const exitGroup = new THREE.Group();
     exitGroup.position.set(0, 0, -12); 
     
     const grandScale = 1.7; 
     const bigTree = createDecoratedTree(grandScale, true); 
     const treeTopY = 6.25 * grandScale;

     const star = new THREE.Mesh(
         new THREE.OctahedronGeometry(0.4 * grandScale), 
         new THREE.MeshStandardMaterial({ color: COLORS.gold, emissive: COLORS.gold, emissiveIntensity: 1.0 })
     );
     star.position.y = treeTopY;
     star.rotation.z = Math.PI / 4;
     
     const light = new THREE.PointLight(COLORS.gold, 2, 15);
     light.position.y = treeTopY * 0.6;
     
     exitGroup.add(bigTree, star, light);
     scene.add(exitGroup);
     exitRef.current = exitGroup;
     
     const santa = createSantaGroup();
     santa.position.set(0, -100, 0); 
     scene.add(santa);
     santaRef.current = santa;

     const gifts = createGiftBoxes();
     gifts.position.set(0, -100, 0); 
     scene.add(gifts);
     giftsRef.current = gifts;

     const particlesGeom = new THREE.BufferGeometry();
     const count = 1000;
     const pos = new Float32Array(count * 3);
     for(let i=0; i<count*3; i++) pos[i] = (Math.random() - 0.5) * 50;
     particlesGeom.setAttribute('position', new THREE.BufferAttribute(pos, 3));
     const snowSystem = new THREE.Points(particlesGeom, new THREE.PointsMaterial({
        color: 0xffffff, 
        size: 1.0, 
        transparent:true, 
        opacity:0.95
     }));
     snowSystem.position.y = 10;
     scene.add(snowSystem);
     particlesRef.current = snowSystem;

     const smokeGroup = new THREE.Group();
     smokeGroup.position.set(-5.3, 3.5, -1.5);
     for(let i=0; i<10; i++){
         const p = new THREE.Mesh(new THREE.SphereGeometry(0.15), new THREE.MeshBasicMaterial({color:0xeeeeee, transparent:true, opacity:0.4}));
         p.position.set((Math.random()-0.5)*0.5, i*0.4, (Math.random()-0.5)*0.5);
         smokeGroup.add(p);
     }
     scene.add(smokeGroup);
     smokeParticlesRef.current = smokeGroup;
  };

  useEffect(() => {
    if (!containerRef.current) return;
    while(containerRef.current.firstChild) containerRef.current.removeChild(containerRef.current.firstChild);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(COLORS.background);
    
    scene.fog = new THREE.Fog(COLORS.background, 30, 80);
    sceneRef.current = scene;

    const aspect = window.innerWidth / window.innerHeight;
    const viewSize = 14; 
    const camera = new THREE.OrthographicCamera(-viewSize * aspect, viewSize * aspect, viewSize, -viewSize, 1, 100);
    camera.position.set(20, 20, 20); 
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; 
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const ambient = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambient);

    const hemiLight = new THREE.HemisphereLight(0x87CEEB, 0xE1F5FE, 0.4); 
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xfffce3, 1.8);
    dirLight.position.set(30, 45, 20); 
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 100;
    
    const shadowSize = 30;
    dirLight.shadow.camera.left = -shadowSize;
    dirLight.shadow.camera.right = shadowSize;
    dirLight.shadow.camera.top = shadowSize;
    dirLight.shadow.camera.bottom = -shadowSize;
    dirLight.shadow.bias = -0.0001; 
    scene.add(dirLight);

    createEnvironment(scene);

    const player = createPlayer();
    scene.add(player);
    playerMeshRef.current = player;
    playerPosRef.current = { x: 0, z: 8, moving: false };
    player.position.set(0, 0, 8);

    const configs = Object.entries(ANIMAL_CONFIGS);
    configs.forEach(([key, conf], idx) => {
        const animalMesh = createAnimalMesh(conf.type);
        animalMesh.scale.setScalar(conf.scale);
        
        const marker = createMarker();
        animalMesh.add(marker);
        
        const light = new THREE.PointLight(COLORS.marker_glow, 1.5, 4);
        light.position.y = 0.5;
        animalMesh.add(light);

        const heart = createHeartEffect();
        animalMesh.add(heart);
        
        const angle = (idx / configs.length) * Math.PI * 2 + 1.0;
        const dist = 7 + Math.random() * 3; 
        animalMesh.position.set(Math.cos(angle) * dist, 0, Math.sin(angle) * dist);
        animalMesh.rotation.y = Math.random() * Math.PI * 2;
        scene.add(animalMesh);
        
        animalsRef.current.set(key, { mesh: animalMesh, marker: marker, light: light, heart: heart, data: { id: key, isRescued: false } });
    });

    const animate = () => {
        frameIdRef.current = requestAnimationFrame(animate);
        update();
        renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
        if (!cameraRef.current || !rendererRef.current) return;
        const asp = window.innerWidth / window.innerHeight;
        cameraRef.current.left = -viewSize * asp;
        cameraRef.current.right = viewSize * asp;
        cameraRef.current.top = viewSize;
        cameraRef.current.bottom = -viewSize;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
        window.removeEventListener('resize', handleResize);
        cancelAnimationFrame(frameIdRef.current);
        if (rendererRef.current) {
            rendererRef.current.dispose();
            if(containerRef.current && rendererRef.current.domElement) {
                containerRef.current.innerHTML = '';
            }
        }
    };
  }, []);

  const update = () => {
     if (!playerMeshRef.current || !cameraRef.current || !sceneRef.current) return;

     let dx = inputRef.current.vector.x;
     let dy = inputRef.current.vector.y;
     if (dx === 0 && dy === 0) {
         if (inputRef.current.left) dx = -1;
         if (inputRef.current.right) dx = 1;
         if (inputRef.current.up) dy = -1;
         if (inputRef.current.down) dy = 1;
         if (dx !== 0 && dy !== 0) { dx *= 0.707; dy *= 0.707; }
     }

     if (Math.abs(dx) > 0.05 || Math.abs(dy) > 0.05) {
         playerPosRef.current.x += dx * MOVE_SPEED;
         playerPosRef.current.z += dy * MOVE_SPEED;
         playerPosRef.current.moving = true;

         const targetRot = Math.atan2(dx, dy);
         let rotDiff = targetRot - playerMeshRef.current.rotation.y;
         while (rotDiff > Math.PI) rotDiff -= Math.PI * 2;
         while (rotDiff < -Math.PI) rotDiff += Math.PI * 2;
         playerMeshRef.current.rotation.y += rotDiff * 0.2;

         trailRef.current.unshift({ x: playerPosRef.current.x, z: playerPosRef.current.z });
         if (trailRef.current.length > 500) trailRef.current.pop();
     } else {
         playerPosRef.current.moving = false;
     }

     const dist = Math.sqrt(playerPosRef.current.x**2 + playerPosRef.current.z**2);
     if (dist > 16.5) {
         const angle = Math.atan2(playerPosRef.current.z, playerPosRef.current.x);
         playerPosRef.current.x = Math.cos(angle) * 16.5;
         playerPosRef.current.z = Math.sin(angle) * 16.5;
     }

     playerMeshRef.current.position.x = playerPosRef.current.x;
     playerMeshRef.current.position.z = playerPosRef.current.z;
     const time = Date.now();
     playerMeshRef.current.position.y = playerPosRef.current.moving ? Math.abs(Math.sin(time * 0.005 * 3)) * 0.2 : 0;

     // -----------------------------------------------------------
     // CINEMATIC CAMERA LOGIC UPDATE (3-Stage Sequence)
     // -----------------------------------------------------------
     
     // 1. Base Target (Default: Player)
     const desiredFocus = new THREE.Vector3(playerPosRef.current.x, 0, playerPosRef.current.z);
     let camLerpFactor = 0.05;
     let targetZoom = 1.0; 
     // Default Isometric Offset (Top-Right-Front)
     let targetOffset = new THREE.Vector3(20, 20, 20);

     // 2. Handle Cinematic Sequences
     if (santaStateRef.current.phase === 'ARRIVING' && santaRef.current) {
         const progress = santaStateRef.current.progress;
         
         // FOG CONTROL: Clear fog for crystal view
         if (sceneRef.current.fog instanceof THREE.Fog) {
             sceneRef.current.fog.far = THREE.MathUtils.lerp(sceneRef.current.fog.far, 2000, 0.02);
         }

         if (progress < 0.65) { // Phase 1: Snowdome Orbit (Extended to 65% of time)
             // Look at center to show the whole island floating in void
             desiredFocus.set(0, 0, 0);
             
             // ZOOM OUT significantly 
             targetZoom = 0.45;
             
             // ROTATING CAMERA EFFECT (SNOWDOME MOMENT)
             // Orbit slowly around the island for a rich, 3D presentation
             const rotSpeed = 0.0002; // Even slower, more majestic rotation
             const orbitRadius = 35;
             const orbitHeight = 35; // High angle
             
             // Use time to drive rotation
             targetOffset.set(
                 Math.cos(time * rotSpeed) * orbitRadius,
                 orbitHeight,
                 Math.sin(time * rotSpeed) * orbitRadius
             );
             
             // Very slow, majestic drift
             camLerpFactor = 0.015;
         } else {
             // Phase 2: Cinematic Glide (Follow Santa)
             // Focus on Santa
             desiredFocus.copy(santaRef.current.position);
             
             // Zoom back in slightly 
             targetZoom = 0.75;
             
             // Standard high tracking angle
             targetOffset.set(20, 25, 20);
             
             // Smooth cinematic follow speed
             camLerpFactor = 0.03;
         }

         // EVEN SLOWER SPEED FOR EXTENDED MAJESTIC ENTRANCE
         santaStateRef.current.progress += 0.0015; 
     } else if (santaStateRef.current.phase === 'PARKED') {
         // STAGE 3: ELEGANT RETURN
         // Implicitly targets Player via Step 1
         camLerpFactor = 0.04; 
         targetZoom = 1.0;
         targetOffset.set(20, 20, 20);
         
         // Reset fog slowly
         if (sceneRef.current.fog instanceof THREE.Fog) {
             sceneRef.current.fog.far = THREE.MathUtils.lerp(sceneRef.current.fog.far, 80, 0.01);
         }
     } else {
         // Normal Gameplay
         targetZoom = 1.0;
         targetOffset.set(20, 20, 20);
     }

     // --- SNOW DOME VISIBILITY LOGIC ---
     if (snowDomeRef.current) {
         const domeMat = snowDomeRef.current.material as THREE.MeshPhysicalMaterial;
         
         if (santaStateRef.current.phase === 'ARRIVING') {
             // Fade IN the dome during the cinematic sequence
             snowDomeRef.current.visible = true;
             // We lerp opacity to a subtle level (0.25) so it looks like glass but doesn't obscure too much
             domeMat.opacity = THREE.MathUtils.lerp(domeMat.opacity, 0.25, 0.02);
         } else if (santaStateRef.current.phase === 'PARKED') {
             // Fade OUT when the camera comes back close (PARKED phase)
             domeMat.opacity = THREE.MathUtils.lerp(domeMat.opacity, 0, 0.05);
             if (domeMat.opacity < 0.01) snowDomeRef.current.visible = false;
         } else {
             // Normal gameplay: hidden
             snowDomeRef.current.visible = false;
             domeMat.opacity = 0;
         }
     }
     // ----------------------------------

     // 3. Apply Smooth Logic
     if (!cameraStateRef.current.target) {
         cameraStateRef.current.target = desiredFocus.clone();
     }
     
     // Lerp the look-at target
     cameraStateRef.current.target.lerp(desiredFocus, camLerpFactor);
     
     // Lerp Zoom
     cameraStateRef.current.currentZoom = THREE.MathUtils.lerp(cameraStateRef.current.currentZoom, targetZoom, 0.03);

     // 5. Handle Zoom Effect (for Rescuing animals override)
     let finalZoom = cameraStateRef.current.currentZoom;
     if (zoomStateRef.current.active) {
         const progress = (time - zoomStateRef.current.startTime) / zoomStateRef.current.duration;
         if (progress >= 1) {
             zoomStateRef.current.active = false;
         } else {
             const bump = Math.sin(progress * Math.PI); 
             // Apply bump on top of current zoom
             finalZoom = finalZoom + bump * (zoomStateRef.current.peak - 1);
         }
     }
     
     // 4. Position Camera relative to smoothed target
     const desiredCamPos = cameraStateRef.current.target.clone().add(targetOffset);
     
     // 6. Move Camera & Apply Zoom
     cameraRef.current.zoom = finalZoom;
     cameraRef.current.updateProjectionMatrix();
     cameraRef.current.position.lerp(desiredCamPos, camLerpFactor);
     cameraRef.current.lookAt(cameraStateRef.current.target);

     for (let i = explosionsRef.current.length - 1; i >= 0; i--) {
        const expl = explosionsRef.current[i];
        let aliveCount = 0;
        expl.particles.forEach(p => {
            if (p.life > 0) {
                p.mesh.position.add(p.velocity);
                p.velocity.y -= expl.gravity; 
                p.mesh.rotation.x += 0.1;
                p.mesh.rotation.z += 0.1;
                p.mesh.scale.setScalar(p.life);
                p.life -= 0.02;
                aliveCount++;
            } else {
                p.mesh.visible = false;
            }
        });
        if (aliveCount === 0) {
            if (sceneRef.current) sceneRef.current.remove(expl.group);
            explosionsRef.current.splice(i, 1);
        }
     }

     if (santaStateRef.current.phase !== 'HIDDEN' && santaRef.current) {
         if (santaStateRef.current.phase === 'ARRIVING') {
             // Logic handled above in Camera block mostly, but movement here:
             const t = Math.min(santaStateRef.current.progress, 1);
             const easeOut = 1 - Math.pow(1 - t, 3);
             santaRef.current.position.lerpVectors(santaStateRef.current.startPos, santaStateRef.current.endPos, easeOut);
             
             // FIX FOR FLIP: Look at a point extended beyond the endPos
             // Vector from Start to End
             const direction = new THREE.Vector3().subVectors(santaStateRef.current.endPos, santaStateRef.current.startPos);
             // Look at a point 10 units past the end position to avoid singularity/flip at t=1
             const lookTarget = santaStateRef.current.endPos.clone().add(direction.normalize().multiplyScalar(10));
             santaRef.current.lookAt(lookTarget);

             if (Math.random() > 0.2) {
                 const offset = new THREE.Vector3((Math.random()-0.5)*1, 0.5, (Math.random()-0.5)*1).applyQuaternion(santaRef.current.quaternion);
                 createSnowBurst(santaRef.current.position.clone().add(offset));
             }
             if (t >= 1) {
                 santaStateRef.current.phase = 'PARKED';
                 // Don't reset rotation.z here, let him keep his orientation
                 if (giftsRef.current && !giftsVisibleRef.current) {
                     giftsVisibleRef.current = true;
                     const giftPos = santaStateRef.current.endPos.clone().add(new THREE.Vector3(2, 0, 1));
                     giftsRef.current.position.copy(giftPos);
                     createExplosion(giftPos, COLORS.gold); 
                     createExplosion(giftPos.clone().add(new THREE.Vector3(0.5,0.5,0)), COLORS.candy_red);
                 }
             }
         } else if (santaStateRef.current.phase === 'PARKED') {
             santaRef.current.position.y = Math.sin(time * 0.002) * 0.1;
             
             // Slowly rotate Santa to face player
             if (playerMeshRef.current) {
                 const targetQ = new THREE.Quaternion();
                 const m = new THREE.Matrix4().lookAt(santaRef.current.position, playerMeshRef.current.position, new THREE.Vector3(0,1,0));
                 targetQ.setFromRotationMatrix(m);
                 santaRef.current.quaternion.slerp(targetQ, 0.02);
             }

             if (giftsRef.current && giftsVisibleRef.current) {
                 giftsRef.current.children.forEach((gift, i) => {
                     gift.position.y = 0.3 + Math.sin(time * 0.003 + i) * 0.1;
                     gift.rotation.y += 0.02;
                 });
             }
         }
     }

     let rescuedCount = 0;
     let followIndex = 14; 
     animalsRef.current.forEach(({ mesh, marker, light, heart, data }) => {
         const headGroup = mesh.getObjectByName('head');
         
         if (!data.isRescued) {
             const d = Math.sqrt(Math.pow(playerPosRef.current.x - mesh.position.x, 2) + Math.pow(playerPosRef.current.z - mesh.position.z, 2));
             mesh.position.y = Math.sin(time * 0.005 + data.id.length) * 0.1 + 0.2;

             if (marker && light) {
                 marker.visible = true;
                 marker.rotation.y += 0.05;
                 marker.children[0].position.y = 2.5 + Math.sin(time * 0.005 * 3) * 0.3; 
                 light.intensity = 1.2 + Math.sin(time * 0.005 * 5) * 0.5; 
             }

             if (d < 2.2) {
                 data.isRescued = true;
                 setGameState(prev => ({...prev, score: prev.score + 1}));
                 
                 playRescueSound(); // <--- Play sound effect

                 zoomStateRef.current.active = true;
                 zoomStateRef.current.startTime = time;
                 
                 if (heart) {
                     heart.visible = true;
                     heart.scale.set(0, 0, 0); 
                     data.heartTime = time;
                 }

                 createExplosion(mesh.position);
                 
                 if (blessingTimeoutRef.current) clearTimeout(blessingTimeoutRef.current);

                 const animalNames: {[key: string]: string} = {
                    'CAT_BLUE': 'Winnie',
                    'CAT_RAGDOLL': 'Lola',
                    'CAT_BLACK': 'WanWan',
                    'DOG_TEDDY': 'Cute Puppy'
                 };
                 const name = animalNames[data.id] || 'Friend';

                 setBlessing({ text: `${name} Found! 🐾`, key: Date.now(), type: 'normal' });
                 
                 blessingTimeoutRef.current = setTimeout(() => setBlessing(null), 3000);
             }
         } else {
             if (marker) marker.visible = false;
             if (light) light.intensity = 0; 
             rescuedCount++;
             if (trailRef.current[followIndex]) {
                 const target = trailRef.current[followIndex];
                 mesh.position.x += (target.x - mesh.position.x) * 0.12;
                 mesh.position.z += (target.z - mesh.position.z) * 0.12;
                 mesh.lookAt(target.x, mesh.position.y, target.z);
                 mesh.rotateY(-Math.PI / 2); 
                 mesh.position.y = Math.abs(Math.sin(time * 0.005 * 3 + followIndex)) * 0.2;

                 if (headGroup && playerMeshRef.current) {
                     const lookTarget = playerMeshRef.current.position.clone();
                     lookTarget.y = 1.0; 
                     headGroup.lookAt(lookTarget);
                 }
             }
             followIndex += 14;

             if (heart && heart.visible && data.heartTime) {
                 const age = time - data.heartTime;
                 if (age < 2000) {
                     const s = 1.0 + Math.sin(age * 0.005) * 0.3;
                     heart.scale.setScalar(s * Math.min(1, age/300));
                     heart.position.y = 2.0 + age * 0.001;
                     heart.rotation.y += 0.05;
                 } else {
                     heart.visible = false;
                 }
             }
         }
     });

     if(smokeParticlesRef.current) {
         smokeParticlesRef.current.children.forEach((p, i) => {
             p.position.y += 0.02;
             p.position.x += Math.sin(time * 0.005 + i)*0.005;
             if(p.position.y > 4) p.position.y = 0;
         });
     }

     if (particlesRef.current) {
         const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
         for(let i=1; i<positions.length; i+=3) {
             positions[i] -= 0.05;
             if (positions[i] < -2) positions[i] = 12;
         }
         particlesRef.current.geometry.attributes.position.needsUpdate = true;
     }

     if (rescuedCount === 4) {
         if (prevRescuedRef.current !== 4) {
             const px = playerPosRef.current.x;
             const pz = playerPosRef.current.z;
             santaStateRef.current.startPos.set(px - 30, 0, pz + 20);
             santaStateRef.current.endPos.set(px - 6, 0, pz + 2);
             santaStateRef.current.phase = 'ARRIVING';
             santaStateRef.current.progress = 0;
             createExplosion(playerMeshRef.current.position.clone().add(new THREE.Vector3(0,3,0)), COLORS.gold);
         }

         if (giftsVisibleRef.current && giftsRef.current && !winTriggeredRef.current && guideRef.current && cameraRef.current) {
            const p1 = playerMeshRef.current.position.clone();
            const p2 = giftsRef.current.position.clone();
            p1.project(cameraRef.current);
            p2.project(cameraRef.current);
            
            const ndcDx = p2.x - p1.x;
            const ndcDy = p2.y - p1.y; 
            
            const dist = playerMeshRef.current.position.distanceTo(giftsRef.current.position);
            
            if (dist > 3.0) {
                guideRef.current.style.display = 'flex';
                // Calculate direction in screen space (Y down). NDC Up is +Y, Screen Up is -Y.
                const screenDx = ndcDx;
                const screenDy = -ndcDy;
                const angle = Math.atan2(screenDy, screenDx);

                const radius = 120;
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;
                
                guideRef.current.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`; 
            } else {
                guideRef.current.style.display = 'none';
            }
         } else if (guideRef.current) {
            guideRef.current.style.display = 'none';
         }

         if (giftsVisibleRef.current && giftsRef.current) {
             const distToGifts = playerMeshRef.current.position.distanceTo(giftsRef.current.position);
             
             if (distToGifts < 3.0) {
                if (!winTriggeredRef.current) {
                    winTriggeredRef.current = true;
                    createExplosion(giftsRef.current.position, COLORS.gold);
                    createExplosion(giftsRef.current.position.clone().add(new THREE.Vector3(0,1,0)), COLORS.candy_red);
                    setShowSuccessUI(true);
                    
                    // Directly set the final message
                    setGameState(prev => ({...prev, letterContent: FINAL_MESSAGE, loadingLetter: false}));
                }
             }
         }
         
         if (winTriggeredRef.current && exitRef.current) {
             const star = exitRef.current.children[1];
             const light = exitRef.current.children[2] as THREE.PointLight;
             if (star) {
                 star.rotation.z += 0.1;
                 star.scale.setScalar(1 + Math.sin(time * 0.005 * 8) * 0.3);
             }
             if (light) {
                 light.intensity = 3 + Math.sin(time * 0.005 * 20) * 2; 
                 const hue = (time * 0.005 * 0.5) % 1;
                 light.color.setHSL(hue, 1, 0.5);
             }
         }
     }
     prevRescuedRef.current = rescuedCount;
  };

  const JOYSTICK_RADIUS = 50; 
  const handleJoystickStart = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    const container = e.currentTarget.getBoundingClientRect();
    const cx = container.width / 2;
    const cy = container.height / 2;
    let clientX, clientY;
    if ('touches' in e) { clientX = e.touches[0].clientX; clientY = e.touches[0].clientY; } 
    else { clientX = (e as React.MouseEvent).clientX; clientY = (e as React.MouseEvent).clientY; }
    const tx = clientX - container.left;
    const ty = clientY - container.top;
    setJoystickState({ active: true, cx, cy, kx: 0, ky: 0 });
    updateJoystickVector(tx, ty, cx, cy);
  };

  const handleJoystickMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!joystickState.active) return;
    e.preventDefault();
    let clientX, clientY;
    if ('touches' in e) { clientX = e.touches[0].clientX; clientY = e.touches[0].clientY; } 
    else { clientX = (e as React.MouseEvent).clientX; clientY = (e as React.MouseEvent).clientY; }
    const container = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const tx = clientX - container.left;
    const ty = clientY - container.top;
    updateJoystickVector(tx, ty, joystickState.cx, joystickState.cy);
  };

  const updateJoystickVector = (tx: number, ty: number, cx: number, cy: number) => {
      const dx = tx - cx;
      const dy = ty - cy;
      const dist = Math.sqrt(dx*dx + dy*dy);
      const angle = Math.atan2(dy, dx);
      const cappedDist = Math.min(dist, JOYSTICK_RADIUS);
      const kx = Math.cos(angle) * cappedDist;
      const ky = Math.sin(angle) * cappedDist;
      setJoystickState(prev => ({...prev, kx, ky}));
      const inputX = dist > 0 ? (dx / dist) * (cappedDist / JOYSTICK_RADIUS) : 0;
      const inputY = dist > 0 ? (dy / dist) * (cappedDist / JOYSTICK_RADIUS) : 0;
      inputRef.current.vector = { x: inputX, y: inputY };
  };

  const handleJoystickEnd = () => {
    setJoystickState(prev => ({...prev, active: false, kx: 0, ky: 0}));
    inputRef.current.vector = { x: 0, y: 0 };
  };

  useEffect(() => {
    const kd = (e: KeyboardEvent) => {
        if(e.code==='ArrowLeft' || e.code==='KeyA') inputRef.current.left=true;
        if(e.code==='ArrowRight' || e.code==='KeyD') inputRef.current.right=true;
        if(e.code==='ArrowUp' || e.code==='KeyW') inputRef.current.up=true;
        if(e.code==='ArrowDown' || e.code==='KeyS') inputRef.current.down=true;
    };
    const ku = (e: KeyboardEvent) => {
        if(e.code==='ArrowLeft' || e.code==='KeyA') inputRef.current.left=false;
        if(e.code==='ArrowRight' || e.code==='KeyD') inputRef.current.right=false;
        if(e.code==='ArrowUp' || e.code==='KeyW') inputRef.current.up=false;
        if(e.code==='ArrowDown' || e.code==='KeyS') inputRef.current.down=false;
    };
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);
    return () => { window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); };
  }, []);

  return (
    <div className="relative w-full h-screen bg-[#B0E2FF] overflow-hidden select-none">
      <div ref={containerRef} className="absolute inset-0 z-0" />
      
      {/* UI: Score */}
      <div className="absolute top-6 left-6 z-10 pointer-events-none">
          <div className="bg-white/90 backdrop-blur px-6 py-3 rounded-full shadow-lg border-2 border-white flex items-center gap-3">
              <span className="text-2xl">🐾</span>
              <span className="font-bold text-blue-900 text-lg">{gameState.score} / 4 Found</span>
          </div>
      </div>

      {/* Guide Arrow UI */}
      <div 
        ref={guideRef} 
        className="absolute top-1/2 left-1/2 z-20 hidden flex-row items-center justify-center pointer-events-none"
        style={{ width: '0px', height: '0px' }}
      >
        <div className="flex flex-col items-center justify-center">
             <div className="text-4xl animate-bounce drop-shadow-lg filter">🎁</div>
             <div className="bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded shadow-md mt-1 border border-white whitespace-nowrap">
                 GIFTS
             </div>
        </div>
      </div>

      {/* UI: Blessing Popup (Refined Glass Style) */}
      {blessing && (
        <div key={blessing.key} className="absolute top-20 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none animate-[fadeIn_0.5s_ease-out] w-max max-w-[90vw]">
            {/* Ice Glass Card */}
            <div className="relative flex items-center gap-3 px-6 py-2 rounded-full bg-white/20 backdrop-blur-xl border border-white/40 shadow-[0_8px_32px_0_rgba(31,38,135,0.15)] ring-1 ring-white/30">
                
                {/* Shimmer Effect */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/10 via-transparent to-blue-100/20 pointer-events-none"></div>
                
                {/* Icon Circle */}
                <div className="relative flex-shrink-0 w-8 h-8 bg-gradient-to-br from-white/80 to-white/40 rounded-full flex items-center justify-center shadow-md border border-white/60">
                    <span className="text-base animate-bounce filter drop-shadow-sm">
                       {blessing.type === 'santa' ? '🎅' : '🐾'}
                    </span>
                </div>

                {/* Text Content */}
                <div className="relative flex flex-col pr-1">
                    <span className="text-base md:text-lg font-black text-slate-800 drop-shadow-sm tracking-wide font-handwriting whitespace-nowrap">
                        {blessing.text}
                    </span>
                </div>

                {/* Decorative Snowflakes (Floating) */}
                <div className="absolute -right-4 -top-4 text-white text-opacity-80 text-2xl animate-[spin_10s_linear_infinite] filter drop-shadow">
                    ❄️
                </div>
            </div>
        </div>
      )}

      {/* SUCCESS UI OVERLAY (UPDATED: Premium Mobile-Friendly Winter Glass) */}
      {showSuccessUI && (
          <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-fade-in p-4 overflow-y-auto">
             {/* Background Snow */}
             <div className="absolute inset-0 overflow-hidden pointer-events-none">
                 {[...Array(50)].map((_, i) => (
                     <div key={i} className="absolute text-white text-opacity-80 animate-fall" style={{
                         left: `${Math.random() * 100}%`,
                         top: `-10%`,
                         animationDuration: `${2 + Math.random() * 3}s`,
                         animationDelay: `${Math.random() * 2}s`,
                         fontSize: `${10 + Math.random() * 20}px`
                     }}>❄</div>
                 ))}
             </div>
             
             {/* THE FROSTED CARD */}
             <div className="relative w-full max-w-sm md:max-w-md transform scale-100 transition-all my-auto">
                {/* Main Glass Container - Premium Winter Glass Border */}
                <div className="relative rounded-[32px] p-[2px] shadow-2xl overflow-hidden group">
                    
                    {/* Animated Champagne Gold & Silver Gradient Border */}
                    <div className="absolute inset-0 bg-gradient-to-br from-[#F3E5AB] via-[#C0C0C0] to-[#D4AF37] opacity-100" />
                    
                    {/* Inner Glass Body */}
                    <div className="relative bg-gradient-to-b from-white/95 to-slate-50/90 backdrop-blur-xl rounded-[30px] h-full w-full overflow-hidden border border-white/60">
                        
                        {/* Subtle Texture Overlay */}
                        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/snow.png')] mix-blend-multiply pointer-events-none"></div>
                        
                        {/* Top Decorative Shine */}
                        <div className="absolute -top-32 -left-20 w-80 h-80 bg-white/60 rounded-full blur-3xl pointer-events-none"></div>

                        {/* Corner Decorations (Gold Snowflakes) */}
                        <div className="absolute top-5 left-5 text-xl text-[#D4AF37] opacity-60 filter drop-shadow animate-pulse">❄</div>
                        <div className="absolute top-5 right-5 text-xl text-[#D4AF37] opacity-60 filter drop-shadow animate-pulse">❄</div>

                        {/* Top Ribbon (Velvet Style) */}
                        <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 z-20">
                             <div className="relative">
                                 <div className="w-20 h-14 bg-gradient-to-b from-[#B71C1C] to-[#800000] shadow-lg rounded-b-xl flex items-end justify-center pb-2 border-x border-b border-[#D4AF37]/50 ring-1 ring-inset ring-white/10">
                                     <span className="text-2xl filter drop-shadow-md">🎀</span>
                                 </div>
                             </div>
                        </div>

                        {/* Content */}
                        <div className="relative z-10 px-6 pt-14 pb-8 flex flex-col items-center text-center">
                            
                            {/* Premium Typography */}
                            <h2 className="text-3xl md:text-4xl font-serif font-black text-transparent bg-clip-text bg-gradient-to-b from-[#B8860B] to-[#8B4513] mt-2 mb-6 tracking-[0.2em] uppercase drop-shadow-sm leading-tight">
                                Wonderful!
                            </h2>
                            
                            <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent mb-6 opacity-60"></div>

                            {/* Glass Ornaments Grid */}
                            <div className="grid grid-cols-2 gap-x-6 gap-y-6 mb-8 w-full px-2">
                                {[
                                    { type: 'CAT_BLUE', label: '维尼', ring: 'from-blue-200 to-blue-400' },
                                    { type: 'CAT_RAGDOLL', label: '萝拉', ring: 'from-orange-100 to-orange-300' },
                                    { type: 'CAT_BLACK', label: '万万', ring: 'from-gray-300 to-gray-500' },
                                    { type: 'DOG_TEDDY', label: 'Unknown', ring: 'from-[#E6DCC3] to-[#C4A484]' }
                                ].map((pet, i) => (
                                    <div key={i} className="flex flex-col items-center relative group/item">
                                        {/* String */}
                                        <div className="absolute -top-12 left-1/2 w-[1px] h-12 bg-[#D4AF37]/40 z-0"></div>
                                        
                                        {/* Glass Bubble Container */}
                                        <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-full shadow-[inset_0_-4px_6px_rgba(0,0,0,0.1),0_8px_15px_-3px_rgba(0,0,0,0.2)] bg-gradient-to-br from-white/80 to-white/40 border border-white/80 backdrop-blur-md overflow-hidden flex items-center justify-center z-10">
                                            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent opacity-50"></div>
                                            <div className="scale-75 translate-y-2">
                                                <AnimalAvatar type={pet.type} />
                                            </div>
                                            {/* Shine Reflection */}
                                            <div className="absolute top-2 left-3 w-3 h-1.5 bg-white rounded-full blur-[1px] opacity-90"></div>
                                        </div>
                                        
                                        {/* Name Tag */}
                                        <div className="mt-2 bg-[#F5F5DC] text-[#5D4037] text-xs font-bold px-3 py-1 rounded-full border border-[#D4AF37]/30 shadow-sm relative z-10">
                                            {pet.label}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col gap-3 w-full max-w-[280px]">
                                {!gameState.envelopeOpen ? (
                                    <button 
                                        onClick={handleOpenGift}
                                        className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-[#D32F2F] to-[#B71C1C] px-8 py-4 shadow-[0_4px_0_#800000] active:shadow-none active:translate-y-[4px] transition-all"
                                    >
                                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagmonds-light.png')] opacity-10"></div>
                                        <span className="relative flex items-center justify-center gap-2 text-white font-black text-lg tracking-wider uppercase drop-shadow-md">
                                            <span className="text-xl animate-bounce">💌</span> Open Letter
                                        </span>
                                    </button>
                                ) : (
                                    <div className="animate-fade-in w-full">
                                        <div className="bg-[#FFF8E1] p-6 rounded-lg shadow-inner border border-[#D4AF37]/20 mb-4 font-serif text-[#3E2723] leading-relaxed relative">
                                            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 text-2xl text-[#D32F2F]">📌</div>
                                            <p className="whitespace-pre-line text-sm md:text-base font-medium">
                                                {gameState.letterContent || "Loading..."}
                                            </p>
                                            <div className="mt-4 text-right text-xs text-[#8D6E63] italic">
                                                - Santa Claus
                                            </div>
                                        </div>
                                        
                                        <button 
                                            onClick={handleRestart}
                                            className="w-full bg-[#388E3C] hover:bg-[#2E7D32] text-white font-bold py-3 px-6 rounded-xl shadow-[0_4px_0_#1B5E20] active:shadow-none active:translate-y-[4px] transition-all flex items-center justify-center gap-2"
                                        >
                                            <span>🔄</span> Play Again
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
             </div>
          </div>
      )}

      {/* Touch Controls */}
      <div 
        className="absolute bottom-12 left-12 w-32 h-32 rounded-full backdrop-blur-sm border border-white/20 touch-none z-30 hidden md:block lg:block"
        style={{ backgroundColor: COLORS.joystick_bg }}
        onMouseDown={handleJoystickStart}
        onMouseMove={handleJoystickMove}
        onMouseUp={handleJoystickEnd}
        onMouseLeave={handleJoystickEnd}
      >
        {joystickState.active && (
            <div 
                className="absolute w-12 h-12 rounded-full shadow-lg"
                style={{
                    backgroundColor: COLORS.joystick_handle,
                    left: joystickState.cx + joystickState.kx - 24,
                    top: joystickState.cy + joystickState.ky - 24,
                    pointerEvents: 'none'
                }}
            />
        )}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-50 text-white text-xs font-bold">DRAG</div>
      </div>
      
      {/* Mobile Full Screen Touch Area (Invisible) */}
      <div 
        className="absolute inset-0 z-20 md:hidden lg:hidden"
        onTouchStart={handleJoystickStart}
        onTouchMove={handleJoystickMove}
        onTouchEnd={handleJoystickEnd}
      />
      
      {/* Mobile Visual Joystick Indicator */}
      {joystickState.active && (
         <div 
            className="absolute w-24 h-24 rounded-full border-2 border-white/30 z-30 pointer-events-none transform -translate-x-1/2 -translate-y-1/2 bg-white/10 backdrop-blur-sm"
            style={{ left: joystickState.cx + 20, top: joystickState.cy + 20 }} 
         >
             <div 
                className="absolute w-10 h-10 rounded-full bg-white/80 shadow-lg transform -translate-x-1/2 -translate-y-1/2"
                style={{
                    left: '50%',
                    top: '50%',
                    transform: `translate(calc(-50% + ${joystickState.kx}px), calc(-50% + ${joystickState.ky}px))`
                }}
             />
         </div>
      )}

      {/* Instructions / Credits */}
      <div className="absolute bottom-4 right-4 text-white/60 text-xs md:text-sm font-bold text-right pointer-events-none z-10 drop-shadow-md">
        <p>Use WASD / Arrows / Drag to Move</p>
        <p className="opacity-70 mt-1">Design & Code by Gemini</p>
      </div>

    </div>
  );
};

export default GameCanvas;