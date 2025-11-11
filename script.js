// --- Configuration Variables ---
// Note: The CANVAS_WIDTH and CANVAS_HEIGHT must match the dimensions in the HTML
const CANVAS_WIDTH = 160;
const CANVAS_HEIGHT = 120;
// Longer, more detailed character set (darkest/most dense to lightest/least dense)
const ASCII_CHARS = '@&$#BWM80Q%OCJUXLIYTV1FPASZ/?cxyrjuvxznli()<>1{}*+=-~^":,. '; 

// --- DOM Element References ---
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d', { willReadFrequently: true });
const output = document.getElementById('ascii-output');
const toggleButton = document.getElementById('toggle-button'); 

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
 * Converts a video frame into an ASCII string. This function runs in a loop.
 */
function frameToAscii() {
    if (isPaused) {
        // If paused, just exit the function and don't request the next frame.
        return;
    }

    // 1. Draw the current video frame onto the hidden canvas
    // Since video.play() is running, this gets the current frame.
    ctx.drawImage(video, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // 2. Get the raw pixel data
    const imageData = ctx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
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
        if ((i / 4 + 1) % CANVAS_WIDTH === 0) {
            asciiString += '\n';
        }
    }

    // 4. Update the display element
    output.textContent = asciiString;

    // 5. Loop: Request the next frame only if not paused.
    // This is the correct way to keep the animation running continuously.
    requestAnimationFrame(frameToAscii);
}

// --- New Toggle Function ---

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
                // Start the loop initially
                frameToAscii(); 
            };
        })
        .catch(err => {
            console.error("Error accessing video stream: ", err);
            output.textContent = "Error: Could not access your camera. Please check permissions.";
        });
}

// Start the application
initVideo();
