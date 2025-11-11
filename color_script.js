// --- Configuration Variables ---
const ASPECT_RATIO = 4 / 3; 
let currentWidth = 160;
let currentHeight = Math.floor(currentWidth / ASPECT_RATIO); 
const ASCII_CHARS = '@&$#BWM80Q%OCJUXLIYTV1FPASZ/?cxyrjuvxznli()<>1{}*+=-~^":,. '; 

// --- Global DOM Element Variables ---
let video, canvas, ctx, output, toggleButton, resolutionInput, applyButton;

// --- State Management ---
let isPaused = false; 
let frameCounter = 0; 
// INCREASED FADE_RATE for wider, longer stripes/tails
const FADE_RATE = 50; 

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

    ctx.drawImage(video, 0, 0, currentWidth, currentHeight); 
    const imageData = ctx.getImageData(0, 0, currentWidth, currentHeight); 
    const data = imageData.data;

    let htmlOutput = ''; // Now building HTML string for colored spans
    
    for (let i = 0; i < data.length; i += 4) {
        // Get original color values
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        // Calculate original brightness
        let avg = (r + g + b) / 3;
        
        // --- MATRIX EFFECT LOGIC (Falling Vertical Cascade) ---
        const pixelIndex = i / 4; 
        const rowIndex = Math.floor(pixelIndex / currentWidth);
        
        // Flicker calculation: Row-based timing (for verticality) - frame count (for falling)
        // FADE_RATE = 25 gives wider stripes. We use a large number to ensure a positive modulo result.
        const flickerSeed = (1000000 + (rowIndex * FADE_RATE) - frameCounter + Math.floor(Math.random() * FADE_RATE)) % 100;
        
        // Determine the dimming factor
        let dimmingFactor = 1.0; 
        if (Math.random() > 0.95) { 
             dimmingFactor = 1.0; // Head of trail (full brightness)
        } else {
             // Tail of trail (dampened brightness based on position in the fade cycle)
             dimmingFactor = (flickerSeed / 100) * 0.8 + 0.2; 
        }

        // Apply dimming factor to brightness (to select the character density)
        let dimmedAvg = avg * dimmingFactor;
        
        // Apply dimming factor to color (to make the color fade)
        const finalR = Math.floor(r * dimmingFactor);
        const finalG = Math.floor(g * dimmingFactor);
        const finalB = Math.floor(b * dimmingFactor);
        
        // --- END MATRIX EFFECT LOGIC ---

        // Map dimmed brightness to character density
        const char = toAscii(dimmedAvg);

        // Build the HTML span element with inline color style
        htmlOutput += `<span class="char" style="color: rgb(${finalR}, ${finalG}, ${finalB})">${char}</span>`;

        if ((i / 4 + 1) % currentWidth === 0) {
            htmlOutput += '\n';
        }
    }

    // Update the display element with the HTML content (color spans)
    output.innerHTML = htmlOutput;

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
        frameToAscii(); 
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
            console.error("Fatal Error: Could not access video stream.", err);
            output.textContent = "FATAL ERROR: Camera access denied or device unavailable. Please check permissions.";
        });
}

// CRITICAL: Ensure the script waits for the HTML DOM to be completely loaded.
document.addEventListener('DOMContentLoaded', initVideo);
