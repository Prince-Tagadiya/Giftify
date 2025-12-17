# Giftify Landing Page

A high-end 3D landing page for Giftify, built with React, Three.js (React Three Fiber), and Vite.

## Setup

The project scaffolding is complete. However, your local environment was missing `npm`/`node` during setup.

1.  **Install Node.js**: Ensure you have Node.js installed.
    *   *Note*: Your system uses `nvm`. You may need to run `source ~/.nvm/nvm.sh` before running npm commands if they are not found.
2.  **Install Dependencies**:
    ```bash
    source ~/.nvm/nvm.sh
    npm install
    ```
3.  **Run Development Server**:
    ```bash
    source ~/.nvm/nvm.sh
    npm run dev
    ```

## Project Structure

-   `src/App.jsx`: Main entry point with Canvas setup.
-   `src/components/Experience.jsx`: Handles the 3D scroll timeline and scene management.
-   `src/components/Overlay.jsx`: HTML overlay for text and UI.
-   `src/components/scenes/`: Individual 3D components for each scroll section.
-   `src/index.css`: Global styles and Light Theme variables.

## Tech Stack

-   **Frontend**: React, Vite
-   **3D**: Three.js, React Three Fiber, @react-three/drei
-   **Animation**: Framer Motion (ready to use), ScrollControls (Drei)
-   **Styling**: Vanilla CSS (Variables)

## Design Notes

-   **Light Theme**: Strict adherence to light colors (White, Sky Blue, Mint).
-   **Performance**: Scene components manage their own visibility (lazy rendering logic) based on scroll offset.
