// --- Configuration Variables ---
// Note: The CANVAS_WIDTH and CANVAS_HEIGHT must match the dimensions in the HTML
const CANVAS_WIDTH = 160;
const CANVAS_HEIGHT = 120;
// NEW, longer, more detailed character set (darkest/most dense to lightest/least dense)
const ASCII_CHARS = '@&$#BWM80Q%OCJUXLIYTV1FPASZ/?cxyrjuvxznli()<>1{}*+=-~^":,. '; 

// --- DOM Element References ---
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
// Set { willReadFrequently: true } for better performance when reading pixel data constantly
const ctx = canvas.getContext('2d', { willReadFrequently: true });
const output = document.getElementById('ascii-output');
const toggleButton = document.getElementById('toggle-button'); // Reference to the new button

// --- State Management ---
let isPaused = false; // Tracks the pause state
let animationFrameId = null; // Stores the ID returned by requestAnimationFrame

// --- Helper Functions ---

/**
 * Maps a grayscale value (0-255) to an ASCII character.
 * 0 (black/darkest) maps to the first character in ASCII_CHARS.
 * 255 (white/lightest) maps to the last character.
 */
function toAscii(g) {
    // The index is calculated as the grayscale value (0-255) divided by 256, 
    // multiplied by the length of the character set, then floored.
    // We reverse the index (ASCII_CHARS.length - 1 - index) so darker pixels get denser chars.
    const index = Math.floor(g / 256 * ASCII_CHARS.length);
    return ASCII_CHARS[ASCII_CHARS.length - 1 - index];
}

/**
 * Converts a video frame into an ASCII string. This function runs in a loop.
 */
function frameToAscii() {
    if (isPaused) {
        // If paused, stop the loop immediately.
        return;
    }

    // 1. Draw the current video frame onto the hidden canvas
    ctx.drawImage(video, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // 2. Get the raw pixel data
    const imageData = ctx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    const data = imageData.data; // [R, G, B, A, R, G, B, A, ...]

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
        if ((i / 4 + 1) % CANVAS_WIDTH === 0) {
            asciiString += '\n';
        }
    }

    // 4. Update the display element
    output.textContent = asciiString;

    // 5. Loop: Request the next frame. Store the ID for potential pausing.
    animationFrameId = requestAnimationFrame(frameToAscii);
}

// --- New Toggle Function ---

/**
 * Toggles the video and the ASCII processing loop on and off.
 */
function togglePause() {
    isPaused = !isPaused; // Flip the state

    if (isPaused) {
        // PAUSE: Stop the video and update the button text
        video.pause();
        toggleButton.textContent = 'Play';
        // Note: The loop stops because frameToAscii() checks the isPaused flag.
        
    } else {
        // PLAY: Start the video and restart the processing loop
        video.play();
        toggleButton.textContent = 'Pause';
        // Restart the frame processing loop
        frameToAscii(); 
    }
}

// --- Initialization ---

/**
 * Initializes the video stream and starts the processing loop.
 */
function initVideo() {
    // Attach the toggle function to the button click event
    toggleButton.addEventListener('click', togglePause); 

    // Request access to the user's media devices (camera)
    navigator.mediaDevices.getUserMedia({ video: { width: CANVAS_WIDTH, height: CANVAS_HEIGHT } })
        .then(stream => {
            // Attach the stream to the hidden video element
            video.srcObject = stream;
            
            // When the video starts playing, begin the frame processing
            video.onloadedmetadata = () => {
                video.play();
                // Start the loop and save the ID
                animationFrameId = requestAnimationFrame(frameToAscii); 
            };
        })
        .catch(err => {
            console.error("Error accessing video stream: ", err);
            output.textContent = "Error: Could not access your camera. Please check permissions.";
        });
}

// Start the application
initVideo();
