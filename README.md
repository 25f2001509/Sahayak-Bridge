# SahayakBridge (सहायक ब्रिज) 🌉
*Bridging Informal Campus Vendors & Digital-Native Students*

Built solo for **Devlympics @ NSUT Dwarka** under the theme "Bridge the Gap".

### 🚀 Live Demo
* [**Live App**](https://shiny-creponne-520bdd.netlify.app/)

### 💡 What It Does
* **Side A (Vendor Mode):** Zero-typing Hinglish voice input and touch-friendly icon grid for local tiffin and laundry vendors around NSUT.
* **Live Bridge Engine:** Custom bilingual NLP parser that extracts room numbers, quantities, and Hindi number words (`ek`, `teen`, `panch sau`).
* **Side B (Student Dashboard):** Auto-splits monthly hostel bills among 1, 2, or 3 roommates, speaks verified Hindi audio receipts aloud for vendor trust, and generates 1-click WhatsApp QR Khata summaries.

### 🛠️ Tech Stack
* 100% Vanilla HTML5, Tailwind CSS, JavaScript (Zero-backend, 100% offline-proof via `localStorage`).
* Web Speech API (`SpeechRecognition` & `speechSynthesis`) for bilingual voice interaction.
* `QRCode.js` for instant dynamic UPI settlement generation.
