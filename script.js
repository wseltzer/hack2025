// --- Configuration Variables ---
// Note: The CANVAS_WIDTH and CANVAS_HEIGHT must match the dimensions in the HTML and CSS
const CANVAS_WIDTH = 160;
const CANVAS_HEIGHT = 120;
// A string of characters ordered from darkest (denser) to lightest (sparser)
// const ASCII_CHARS = '@%#*+=-:. ';
// Old set: '@%#*+=-:. '
const ASCII_CHARS = '@&$#BWM80Q%OCJUXLIYTV1FPASZ/?cxyrjuvxznli()<>1{}*+=-~^":,. ';

// --- DOM Element References ---
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d', { willReadFrequently: true });
const output = document.getElementById('ascii-output');

// --- Helper Functions ---

/**
 * Maps a grayscale value (0-255) to an ASCII character.
 * 0 (black/darkest) maps to the first character in ASCII_CHARS.
 * 255 (white/lightest) maps to the last character.
 */
function toAscii(g) {
    // The index is calculated as the grayscale value (0-255) divided by 256, 
    // multiplied by the length of the character set, then floored.
    const index = Math.floor(g / 256 * ASCII_CHARS.length);
    // Reverse the order so the darkest characters map to the densest ones (index 0)
    return ASCII_CHARS[ASCII_CHARS.length - 1 - index];
}

/**
 * Converts a video frame into an ASCII string.
 */
function frameToAscii() {
    // 1. Draw the current video frame onto the hidden canvas
    ctx.drawImage(video, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // 2. Get the raw pixel data
    const imageData = ctx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    const data = imageData.data; // This is a Uint8ClampedArray: [R, G, B, A, R, G, B, A, ...]

    let asciiString = '';
    
    // 3. Iterate over the pixels
    // We step by 4 (R, G, B, A) to get to the next pixel
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        // Calculate the average brightness (a simple grayscale conversion)
        const avg = (r + g + b) / 3;
        
        // Append the corresponding ASCII character to the string
        asciiString += toAscii(avg);

        // Add a newline character at the end of each row
        if ((i / 4 + 1) % CANVAS_WIDTH === 0) {
            asciiString += '\n';
        }
    }

    // 4. Update the display element with the new ASCII art
    output.textContent = asciiString;

    // 5. Loop: Request the browser to call this function again before the next repaint
    requestAnimationFrame(frameToAscii);
}

// --- Initialization ---

/**
 * Initializes the video stream and starts the processing loop.
 */
function initVideo() {
    // Request access to the user's media devices (camera)
    navigator.mediaDevices.getUserMedia({ video: { width: CANVAS_WIDTH, height: CANVAS_HEIGHT } })
        .then(stream => {
            // Attach the stream to the hidden video element
            video.srcObject = stream;
            // When the video starts playing, begin the frame processing
            video.onloadedmetadata = () => {
                video.play();
                frameToAscii(); // Start the loop
            };
        })
        .catch(err => {
            console.error("Error accessing video stream: ", err);
            output.textContent = "Error: Could not access your camera. Please check permissions.";
        });
}

// Start the application
initVideo();
