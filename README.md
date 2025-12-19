# 🎁 Giftify - Secure Physical Gifting for Content Creators

> **The safest way for fans to send physical gifts to their favorite creators without ever exchanging addresses.**

![Giftify Banner](https://via.placeholder.com/1200x400?text=Giftify+Dashboard+Preview)

## 🚀 Overview
**Giftify** is a comprehensive logistics platform designed to bridge the gap between digital content creators and their communities. Unlike digital tips or wishlist links, Giftify handles the **physical logistics** of gifting. 

*   **For Fans:** Send real, physical items (tech, art, letters) to creators safely.
*   **For Creators:** Receive gifts without ever revealing your home address.
*   **For Logistics:** A complete admin dashboard to manage inspections, pickups, and deliveries.

---

## ✨ Key Features

### 🦁 For Creators
*   **Privacy First:** Your address is hidden. Fans only see your profile and wishlist.
*   **Gift Approval:** Review gift offers before they are even picked up. Accept or decline based on the item description.
*   **Dashboard:** specialized view to manage incoming requests and track what's coming.

![Creator Dashboard](https://via.placeholder.com/800x450?text=Creator+Dashboard+Screenshot)

### 🦄 For Fans
*   **Discovery:** Browse top creators (featuring rich seeded data for Indian creators like Samay Raina, Tech Burner, etc.).
*   **Seamless Gifting:** Send a gift request in seconds.
*   **Pickup Scheduling:** Interactive modal to schedule a courier pickup from your home (or a saved address).
*   **Live Tracking:** Track your gift's journey from "Picked Up" to "Safety Inspection" to "Delivered".

![Fan Dashboard](https://via.placeholder.com/800x450?text=Fan+Dashboard+Screenshot)

### 🚚 For Logistics (Admin)
*   **Control Center:** A powerful settings panel to manage operations.
    *   Toggle Pickups/Deliveries globally.
    *   Set Prohibited Items lists.
    *   **Emergency Pause:** One-click system lockdown.
*   **Order Management:**
    *   **Pickup Queue:** Manage pending pickups.
    *   **Inspection:** Mark items as "Inspected" or "Rejected" (if they contain prohibited items).
    *   **Transit:** Update status to "In Transit" and "Delivered".
*   **Safety Overrides:** Bypass or flag suspicious accounts.

![Logistics Dashboard](https://via.placeholder.com/800x450?text=Logistics+Dashboard+Screenshot)

---

## 🛠️ Technology Stack
*   **Frontend:** React (Vite)
*   **Styling:** Tailwind CSS + Custom "Glassmorphism" UI Theme
*   **Backend:** Firebase (Firestore, Auth)
*   **Icons:** Lucide React
*   **Animations:** Framer Motion

---

## 📸 Usage & Workflows

### 1. The Secure Gifting Flow
1.  **Fan** selects a creator and submits a gift request (e.g., "Antique Chess Set").
2.  **Creator** receives a notification and **Accepts** the request.
3.  **Fan** is notified and schedules a **Pickup** via the app.
4.  **Logistics Team** picks up the item -> **Inspects it** (Safety Check) -> **Delivers it**.

### 2. Smart Address Masking
*   The Creator never sees the Fan's address.
*   The Fan never sees the Creator's destination address.
*   Only the **Logistics Admin** has access to the full routing data.

---

## 🔐 Demo Credentials
The project comes seeded with rich fake data (Indian Creator Community). You can use the following accounts to test the full flow:

| Role | Email | Password | Description |
| :--- | :--- | :--- | :--- |
| **Admin** | `logistics@giftify.com` | `logistics123` | Full access to Logistics Control Center. |
| **Creator** | `samay@giftify.com` | `samay123` | See incoming gift requests. |
| **Creator** | `shlok@giftify.com` | `creator123` | Tech Burner styling. |
| **Fan** | `fan@giftify.com` | `fan123` | **Prince Tagadiya** (Main test account). |
| **Universal** | *Any seeded email* | `password123` | Works for all demo accounts. |

---

## ⚡ Quick Start

### Prerequisites
*   Node.js (v18+)
*   npm

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/yourusername/giftify.git
    cd giftify
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Setup Environment:**
    Create a `.env` file with your Firebase credentials:
    ```env
    VITE_FIREBASE_API_KEY=your_api_key
    VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
    VITE_FIREBASE_PROJECT_ID=your_project_id
    ...
    ```

4.  **Run Development Server:**
    ```bash
    npm run dev
    ```

5.  **Reset & Seed Database (Optional):**
    Visit `http://localhost:5174/reset` to wipe the database and reload the demo dataset (Indian creators).

---

## 🎨 UI Highlights
*   **Modern Glass Aesthetics:** Translucent cards, subtle gradients, and rounded interfaces.
*   **Micro-Interactions:** Smooth hover effects, animated modals, and toast notifications.
*   **Responsive:** Fully optimized for Mobile and Desktop views.

---

## 📄 License
MIT License - Copyright (c) 2025 Giftify
