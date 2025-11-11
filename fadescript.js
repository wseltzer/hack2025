// --- Configuration Variables ---
// We use a fixed aspect ratio (4:3) to calculate height based on user's width input
const ASPECT_RATIO = 4 / 3; 

// Initial dimensions (matching HTML default input value of 160)
let currentWidth = 160;
let currentHeight = Math.floor(currentWidth / ASPECT_RATIO); 

// Character set ordered from darkest/most dense (beginning) to lightest/least dense (end)
const ASCII_CHARS = '@&$#BWM80Q%OCJUXLIYTV1FPASZ/?cxyrjuvxznli()<>1{}*+=-~^":,. '; 

// --- DOM Element References ---
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
// Set { willReadFrequently: true } for better performance
const ctx = canvas.getContext('2d', { willReadFrequently: true });
const output = document.getElementById('ascii-output');
const toggleButton = document.getElementById('toggle-button'); 
const resolutionInput = document.getElementById('resolution-input'); 
const applyButton = document.getElementById('apply-resolution-button');

// --- State Management ---
let isPaused = false; 
let frameCounter = 0; // Used for the Matrix effect timing
const FADE_RATE = 10; // Controls the speed/timing of the cascade (lower is faster)

// --- Helper Functions ---

/**
 * Maps a grayscale value (0-255) to an ASCII character.
 */
function toAscii(g) {
    const index = Math.floor(g / 256 * ASCII_CHARS.length);
    // Return the character, reversed for density mapping (dark areas = dense chars)
    return ASCII_CHARS[ASCII_CHARS.length - 1 - index];
}

/**
 * Converts a video frame into an ASCII string with a Matrix-like flicker effect, 
 * simulating STRICT vertical rain.
 */
function frameToAscii() {
    if (isPaused) {
        return;
    }
    
    // Increment the frame counter for the animation timing
    frameCounter++;

    // 1. Draw the current video frame onto the hidden canvas
    ctx.drawImage(video, 0, 0, currentWidth, currentHeight); 
    const imageData = ctx.getImageData(0, 0, currentWidth, currentHeight); 
    const data = imageData.data;

    let asciiString = '';
    
    // 3. Iterate over the pixels
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        // Calculate the average brightness (grayscale conversion)
        let avg = (r + g + b) / 3;
        
        // --- MATRIX EFFECT LOGIC (FIXED FOR STRICT VERTICAL CASCADE) ---
        
        const pixelIndex = i / 4; 
        
        // 1. Calculate the ROW (Y position)
        const rowIndex = Math.floor(pixelIndex / currentWidth);
        
        // 2. Create a time-based flicker seed controlled ONLY by the ROW and FRAME COUNTER.
        // We use Math.random() to add a slight offset, ensuring each column looks messy and independent.
        const flickerSeed = (rowIndex * FADE_RATE + frameCounter + Math.floor(Math.random() * FADE_RATE)) % 100;
        
        // 3. Apply temporary dimming (The Fade/Trail)
        if (Math.random() > 0.95) { 
             // 5% chance to be fully bright (The "head" of the rain trail)
        } else {
             // Dampen the brightness based on the flickerSeed.
             avg *= (flickerSeed / 100)
