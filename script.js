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
const ctx = canvas.getContext('2d', { willReadFrequently: true });
const output = document.getElementById('ascii-output');
const toggleButton = document.getElementById('toggle-button'); 
const resolutionInput = document.getElementById('resolution-input'); 
const applyButton = document.getElementById('apply-resolution-button');

// --- State Management ---
let isPaused = false; // Tracks the pause state

// --- Helper Functions ---

/**
 * Maps a grayscale value (0-255) to an ASCII character.
 */
function toAscii(g) {
    // Map grayscale value to an index, then reverse it for density mapping
    const index = Math.floor(g / 256 * ASCII_CHARS.length);
    return ASCII_CHARS[ASCII_CHARS.length - 1 - index];
}

/**
 * Converts a video frame into an ASCII string. This function runs in a continuous loop 
 * via requestAnimationFrame as long as isPaused is false.
 */
function frameToAscii() {
    if (isPaused) {
        // If paused, just exit the function and don't request the next frame.
        return;
    }

    // 1. Draw the current video frame onto the hidden canvas using current dynamic size
    ctx.drawImage(video, 0, 0, currentWidth, currentHeight); 

    // 2. Get the raw pixel data
    const imageData = ctx.getImageData(0, 0, currentWidth, currentHeight); 
    const data = imageData.data;

    let asciiString = '';
    
    // 3. Iterate over the pixels
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        // Calculate the average brightness (grayscale conversion)
        const avg = (r + g + b) / 3;
        
        // Map brightness to ASCII character
        asciiString += toAscii(avg);

        // Add a newline character at the end of each row
        if ((i / 4 + 1) % currentWidth === 0) {
            asciiString += '\n';
        }
    }

    // 4. Update the display element
    output.textContent = asciiString;

    // 5. Loop: Request the next frame.
    requestAnimationFrame(frameToAscii);
}

// --- Toggle Function ---

/**
 * Toggles the video and the ASCII processing loop on and off.
 */
function togglePause() {
    isPaused = !isPaused; // Flip the state

    if (isPaused) {
        // PAUSE: Stop the video stream from updating frames
        video.pause();
        toggleButton.textContent = 'Play';
        
    } else {
        // PLAY: Start the video stream and restart the processing loop
        video.play();
        toggleButton.textContent = 'Pause';
        // Crucial: Call frameToAscii() once to restart the requestAnimationFrame loop
        frameToAscii(); 
    }
}
