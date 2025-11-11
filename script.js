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
let isPaused = false; 

// --- Helper Functions ---

/**
 * Maps a grayscale value (0-255) to an ASCII character.
 */
function toAscii(g) {
    const index = Math.floor(g / 256 * ASCII_CHARS.length);
    return ASCII_CHARS[ASCII_CHARS.length - 1 - index];
}

/**
 * Converts a video frame into an ASCII string. This function runs in a continuous loop.
 */
function frameToAscii() {
    if (isPaused) {
        return;
    }

    // Use current dynamic size for drawing and getting image data
    ctx.drawImage(video, 0, 0, currentWidth, currentHeight); 
    const imageData = ctx.getImageData(0, 0, currentWidth, currentHeight); 
    const data = imageData.data;

    let asciiString = '';
    
    for (let i = 0; i < data.length; i += 4) {
        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
        asciiString += toAscii(avg);

        if ((i / 4 + 1) % currentWidth === 0) {
            asciiString += '\n';
        }
    }

    output.textContent = asciiString;
    requestAnimationFrame(frameToAscii);
}

// --- Toggle Function ---

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
    // Attach event listeners
    if (toggleButton) toggleButton.addEventListener('click', togglePause); 
    if (applyButton) applyButton.addEventListener('click', changeResolution); 

    // CRITICAL FIX: Set initial canvas/video sizes BEFORE requesting stream 
    canvas.width = currentWidth;
    canvas.height = currentHeight;
    video.width = currentWidth;
    video.height = currentHeight;

    // Request access to the user's media devices (camera)
    // IMPORTANT: Request stream with the dimensions matching the current state
    navigator.mediaDevices.getUserMedia({ video: { width: currentWidth, height: currentHeight } })
        .then(stream => {
            video.srcObject = stream;
            
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
