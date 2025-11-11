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
 * Converts a video frame into an ASCII string with a Matrix-like flicker effect.
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
        
        // --- MATRIX EFFECT LOGIC ---
        
        // Calculate the column index (x position)
        const columnIndex = (i / 4) % currentWidth;
        
        // Combine column index and frame count for a looping, column-specific "flicker" value
        const flickerSeed = (columnIndex * FADE_RATE + frameCounter) % 100; 
        
        if (Math.random() > 0.9) { 
             // 10% chance to be fully bright (the 'head' of the cascade)
             // avg remains the same
        } else {
             // Dampen the brightness based on the flickerSeed to simulate the fade
             avg *= (flickerSeed / 100) * 0.8 + 0.2; 
        }
        
        // Map the (potentially dimmed) brightness to ASCII character
        asciiString += toAscii(avg);
        // --- END MATRIX EFFECT LOGIC ---

        if ((i / 4 + 1) % currentWidth === 0) {
            asciiString += '\n';
        }
    }

    // 4. Update the display element
    output.textContent = asciiString;

    // 5. Loop: Request the next frame.
    requestAnimationFrame(frameToAscii);
}

// --- Toggle Function (Pause/Play) ---

/**
 * Toggles the video and the ASCII processing loop on and off.
 */
function togglePause() {
    isPaused = !isPaused; 

    if (isPaused) {
        video.pause();
        toggleButton.textContent = 'Play';
        
    } else {
        video.play();
        toggleButton.textContent = 'Pause';
        frameToAscii(); // Restart the requestAnimationFrame loop
    }
}

// --- Resolution Function ---

/**
 * Reads the input field, updates the global width/height, and prepares elements.
 */
function changeResolution() {
    const newWidth = parseInt(resolutionInput.value);
    
    if (isNaN(newWidth) || newWidth <= 0) {
        alert("Please enter a valid resolution width.");
        return;
    }

    const newHeight = Math.floor(newWidth / ASPECT_RATIO);

    // Update global state
    currentWidth = newWidth;
    currentHeight = newHeight;

    // Update element attributes
    canvas.width = newWidth;
    canvas.height = newHeight;
    video.width = newWidth;
    video.height = newHeight;

    // Update the font size for the output for better viewing
    const fontSize = Math.max(3, 10 - Math.floor(newWidth / 50));
    output.style.fontSize = `${fontSize}px`;
    
    // Ensure the loop is running and restarts with new dimensions
    if (isPaused) {
        isPaused = false;
        toggleButton.textContent = 'Pause';
        video.play();
    }
    frameToAscii(); 
}

// --- Initialization ---

/**
 * Initializes the video stream and starts the processing loop.
 */
function initVideo() {
    // Attach event listeners, adding checks to prevent runtime errors if elements are missing
    if (toggleButton) toggleButton.addEventListener('click', togglePause); 
    if (applyButton) applyButton.addEventListener('click', changeResolution); 

    // 1. Ensure initial canvas/video sizes are set
    canvas.width = currentWidth;
    canvas.height = currentHeight;
    video.width = currentWidth;
    video.height = currentHeight;

    // 2. Request access to the user's media devices (camera)
    navigator.mediaDevices.getUserMedia({ video: { width: currentWidth, height: currentHeight } })
        .then(stream => {
            video.srcObject = stream;
            
            // 3. CRITICAL: Wait for video metadata to load before playing and starting the loop
            video.onloadedmetadata = () => {
                video.play();
                // Start the loop initially
                frameToAscii(); 
            };
        })
        .catch(err => {
            // Display error message directly in the output area
            console.error("Error accessing video stream: ", err);
            output.textContent = "Error: Could not access your camera. Please check permissions.";
        });
}

// Start the application
initVideo();
