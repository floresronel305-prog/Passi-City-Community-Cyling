# PASSI CITY COMMUNITY CYCLING

This project is a community cycling app with route tracking, memberships, bike registration, admin management and real-time direct messaging.

## Features
- Live route map with GPS tracking
- User and admin roles
- Real-time messaging between users and admin
- Membership plans and admin approvals
- Photo uploads and ride sharing
- Professional UI with smoother motion and layout polish

## Firebase real-time chat setup
This version supports real-time chat using Firebase Firestore.

1. Create a Firebase project at https://console.firebase.google.com
2. Enable Firestore Database
3. Open `app.js` and replace the placeholder values in `FIREBASE_CONFIG`
4. Keep the project public or use the same static hosting method for GitHub Pages

Example:

```js
const FIREBASE_CONFIG = {
  apiKey: "YOUR_FIREBASE_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef123456"
};
```

## Local fallback
If Firebase is not configured yet, the app keeps working with browser localStorage so the project still runs without a backend.

## Run locally
```bash
npm install
npm start
```

## Notes
- The default admin user is configured in `app.js`
- You can customize the routes and membership plans in the same file
- When deployed to GitHub Pages or Netlify, the app will still work as a static frontend with Firebase support
