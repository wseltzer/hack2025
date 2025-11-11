// --- Configuration Variables ---
const ASPECT_RATIO = 4 / 3; 
let currentWidth = 160;
let currentHeight = Math.floor(currentWidth / ASPECT_RATIO); 
const ASCII_CHARS = '@&$#BWM80Q%OCJUXLIYTV1FPASZ/?cxyrjuvxznli()<>1{}*+=-~^":,. '; 

// --- Global DOM Element Variables (Will be set after DOMContentLoaded) ---
let video, canvas, ctx, output, toggleButton, resolutionInput, applyButton;

// --- State Management ---
let isPaused = false; 
let frameCounter = 0; 
const FADE_RATE = 10; 

// --- Helper Functions ---

function toAscii(g) {
    const index = Math.floor(g / 256 * ASCII_CHARS.length);
    return ASCII_CHARS[ASCII_CHARS.length - 1 - index];
}

/**
 * The core loop for video processing and Matrix effect rendering.
 */
function frameToAscii() {
    if (isPaused || video.paused) {
        return;
    }
    
    frameCounter++;

    // 1. Draw the current video frame onto the hidden canvas
    ctx.drawImage(video, 0, 0, currentWidth, currentHeight); 
    const imageData = ctx.getImageData(0, 0, currentWidth, currentHeight); 
    const data = imageData.data;

    let asciiString = '';
    
    for (let i = 0; i < data.length; i += 4) {
        let avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
        
        // --- MATRIX EFFECT LOGIC (Vertical Cascade) ---
        const pixelIndex = i / 4; 
        const rowIndex = Math.floor(pixelIndex / currentWidth);
        
        // Flicker calculation: Row-based timing + frame count + random offset
        const flickerSeed = (rowIndex * FADE_RATE + frameCounter + Math.floor(Math.random() * FADE_RATE)) % 100;
        
        if (Math.random() > 0.95) { 
             // 5% chance for "head" of the rain trail
        } else {
             // Dampen brightness for the "tail" effect
             avg *= (flickerSeed / 100) * 0.8 + 0.2; 
        }
        
        asciiString += toAscii(avg);

        if ((i / 4 + 1) % currentWidth === 0) {
            asciiString += '\n';
        }
    }

    output.textContent = asciiString;
    requestAnimationFrame(frameToAscii);
}

// --- Toggle Function (Pause/Play) ---

function togglePause() {
    isPaused = !isPaused; 

    if (isPaused) {
        video.pause();
        toggleButton.textContent = 'Play';
    } else {
        video.play();
        toggleButton.textContent = 'Pause';
        frameToAscii(); // Restart the loop
    }
}

// --- Resolution Function ---

function changeResolution() {
    const newWidth = parseInt(resolutionInput.value);
    
    if (isNaN(newWidth) || newWidth <= 0) {
        alert("Please enter a valid resolution width.");
        return;
    }

    currentWidth = newWidth;
    currentHeight = Math.floor(newWidth / ASPECT_RATIO);

    canvas.width = currentWidth;
    canvas.height = currentHeight;
    video.width = currentWidth;
    video.height = currentHeight;

    const fontSize = Math.max(3, 10 - Math.floor(newWidth / 50));
    output.style.fontSize = `${fontSize}px`;
    
    // Restart logic
    if (isPaused) {
        isPaused = false;
        toggleButton.textContent = 'Pause';
        video.play();
    }
    frameToAscii(); 
}

// --- Initialization ---

function initVideo() {
    // 1. Set element references
    video = document.getElementById('video');
    canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d', { willReadFrequently: true });
    output = document.getElementById('ascii-output');
    toggleButton = document.getElementById('toggle-button'); 
    resolutionInput = document.getElementById('resolution-input'); 
    applyButton = document.getElementById('apply-resolution-button');

    // 2. Attach event listeners
    if (toggleButton) toggleButton.addEventListener('click', togglePause); 
    if (applyButton) applyButton.addEventListener('click', changeResolution); 

    // 3. Set initial element sizes
    canvas.width = currentWidth;
    canvas.height = currentHeight;
    video.width = currentWidth;
    video.height = currentHeight;

    // 4. Request camera access
    navigator.mediaDevices.getUserMedia({ video: { width: currentWidth, height: currentHeight } })
        .then(stream => {
            video.srcObject = stream;
            
            // 5. Start the loop ONLY when the video metadata is loaded
            video.onloadedmetadata = () => {
                video.play();
                frameToAscii(); 
            };
        })
        .catch(err => {
            // Log and display error if camera access fails
            console.error("Fatal Error: Could not access video stream.", err);
            output.textContent = "FATAL ERROR: Camera access denied or device unavailable. Please check permissions.";
        });
}

// CRITICAL FIX: Ensure the entire script waits for the HTML DOM to be completely loaded.
document.addEventListener('DOMContentLoaded', initVideo);
