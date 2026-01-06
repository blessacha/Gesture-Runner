# Gesture Runner

## Project Overview
Gesture Runner is a browser-based runner game controlled using fingers.  
The game uses AI hand tracking to detect position of fingers through the user’s webcam and then map them to gameplay actions such jumping, as running, bedding down, and changing lanes.

All processing happens directly in the browser without requiring a backend server.

---

## Features
- Gesture based game controls
- Real time hand tracking using AI
- The application screens are:
  - Home screen with instructions and animation
  - Game screen with live camera input and gameplay
  - About screen describing the project
- Stable gesture detection to reduce flickering and false triggers
- Different Lane runner gameplay with obstacles and scoring by collect8kg coins 
-  Pause and resume action when no hand is detected

---

## How the Game Works
The application uses Hand MediaPipe to detect 21 hand landmarks through the webcam.  
The fingers position are analysed and stabilised over multiple frames to determine the user’s exact gesture.  
Each recognised gesture is mapped to a specific game action.

---

## Gesture Controls

| Gesture | Action |
|------|------|
| 5 fingers | Run / Start game |
| 2 fingers | Jump Up |
| 1 finger | Duck/Bend down |
| 3 fingers | Move left |
| 4 fingers | Move right |
| No hand detected | Pause the game |

---

## Technologies Used
- HTML5
- CSS3
- JavaScript (ES6)
- Canvas API
- MediaPipe Hands (AI hand tracking)
- Web browser APIs (camera access)

---

## How to Run the Project
1. Download or clone the project files.
2. Open the project folder in Visual Studio Code.
3. Use a local development server (for example, Live Server).
4. Open the application in a advance browser such as: Google Chrome.
5. Allow camera access when asked.
6. Click **Start Game** and control the runner using hand gestures.

---

## Project Structure

/index.html
/css
└── style.css
/js
├── handTracking.js
├── gestures.js
├── game.js
└── ui.js


---

## Innovation and Learning Outcomes
The project clearly demonstrates how AI powered computer vision can be added directly into a web application to create natural and user interaction.  
Its a combination of real-time hand tracking, gesture recognition, game development, and user interface that is design into a single interactive experience.

Key learning outcomes include:
- Understanding browser-based AI processing
- Working with real-time video input
- Mapping physical gestures to digital actions
- Designing user friendly interactive systems

---

## Author
Computer Science Student  
Web Innovation Project

---

## Notes
- The game works best in a well-lit environment.
- A single hand should be visible to the camera for accurate detection.
