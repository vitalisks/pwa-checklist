# Moirai — Modern Checklist App

Moirai is a beautifully designed, offline-capable Progressive Web Application for managing checklists and templates. Built with performance and user experience in mind, it features a sleek glassmorphism UI, robust state management, multi-language support, AI-powered template generation, and optional real-time collaboration.

## Features

*   **📱 Progressive Web App**: Installable on mobile and desktop, works fully offline with service worker caching.
*   **🎨 Premium UI/UX**: Modern glassmorphism design with smooth animations, transitions, and dark/light theme support.
*   **⚡ Fast & Reliable**: Uses **IndexedDB** for unlimited offline storage and instant loading.
*   **🌍 Multi-language Support**: Fully localized in **English**, **Estonian**, **Lithuanian**, **Latvian**, and **Russian** with browser auto-detection.
*   **📋 Template System**: Create reusable templates with categories and items to quickly spin up new checklists.
*   **✅ Checklist Execution**: Track progress per item, toggle checked/skipped, auto-completion logic.
*   **🤖 AI-Powered Idea Flow**: Generate checklists from a voice or text prompt using an LLM — parse structured responses into ready-to-use templates.
*   **📸 Photo Support**: Attach guide photos to template items, capture photos during checklist execution, and AI-generated image links. Full-screen lightbox.
*   **💬 Item Comments**: Add comments to individual checklist items for notes or observations.
*   **✏️ Inline Editing**: Edit checklist titles and items in-place directly from the checklist view.
*   **↕️ Drag & Drop**: Reorder categories and items in the template editor and checklist view via drag and drop.
*   **🔗 Sharing (Firebase)**: Send templates and checklists to other devices via Firestore (24h TTL, no accounts needed).
*   **👥 Real-Time Collaboration (Firebase)**: Collaborative editing of checklists with real-time sync, invite system, and conflict resolution.
*   **🖼️ Export as Image**: Export checklists as JPEG images with optional comment — download or share via the Web Share API.
*   **📦 Data Import/Export**: Full JSON export and import of all data for backup or transfer.
*   **📥 Inbox**: Centralized view for received shares and collaboration invites.
*   **🔒 Privacy Focused**: All data stored locally on your device by default. Zero tracking. Sharing is opt-in.

## Technology Stack

*   **Core**: [React 19](https://reactjs.org/), [TypeScript](https://www.typescriptlang.org/)
*   **Build**: [Vite](https://vitejs.dev/)
*   **Routing**: [React Router](https://reactrouter.com/) v7
*   **Styling**: CSS Modules + CSS custom properties (design tokens) — no Tailwind
*   **State & Storage**: React Context + IndexedDB (Custom `StoragePort` interface)
*   **Icons**: [Lucide React](https://lucide.dev/)
*   **Animations**: [Framer Motion](https://www.framer.com/motion/)
*   **Drag & Drop**: [@dnd-kit](https://dndkit.com/)
*   **Backend (optional)**: [Firebase](https://firebase.google.com/) (Firestore) for sharing and collaboration

## 🚀 Getting Started

### Prerequisites

*   Node.js 16+
*   npm or yarn

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/yourusername/checklist-app.git
    cd checklist-app
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Start the development server:
    ```bash
    npm run dev
    ```

4.  Build for production:
    ```bash
    npm run build
    ```

### Optional: Firebase Setup (Sharing)

To enable sharing checklists and templates between devices, you'll need a Firebase project:

1. Go to [Firebase Console](https://console.firebase.google.com/), create a project (or use an existing one).
2. **Firestore** — enable Cloud Firestore (choose a region, start in test mode).
3. **Web app** — in Project Settings → General → Your apps, click "Add app" → Web. Copy the `apiKey`, `projectId`, and `appId`.
4. **Env vars** — copy `.env.example` to `.env` and fill in the values:
   ```env
   VITE_FIREBASE_ENABLED=true
   VITE_FIREBASE_API_KEY=AIzaSy...
   VITE_FIREBASE_PROJECT_ID=my-project
   VITE_FIREBASE_APP_ID=1:123:web:abc
   ```
5. **Deploy rules** — this project includes `firestore.rules`. Deploy them:
   ```bash
   npx firebase-tools deploy --only firestore
   ```
   (First run `npx firebase-tools login` if needed.)

Once set, the app will show a "My Code" section in Settings and a share icon on every template/checklist card. All data stays in the `shared_payloads` collection with a 24h TTL — no user accounts needed.

### Optional: OIDC Authentication (Sign-In)

OIDC authentication protects shared/collaborative documents behind a sign-in wall. It requires Firebase to be enabled (the OIDC ID token is exchanged for a Firebase custom token).

1. Set up an **OIDC provider** (e.g., Cloudflare Workers, Auth0, Keycloak) that issues ID tokens.
2. Configure a **token exchange endpoint** (a serverless function) that accepts the OIDC ID token and returns a Firebase custom token. The endpoint receives `POST {"idToken": "<oidc_id_token>"}` and responds with `{"customToken": "<firebase_custom_token>"}`.
3. Add these env vars to your `.env`:

   ```env
   VITE_OIDC_ENABLED=true
   VITE_OIDC_AUTHORITY=https://your-oidc-issuer
   VITE_OIDC_CLIENT_ID=your-client-id
   VITE_OIDC_SCOPE=openid profile email
   VITE_OIDC_REDIRECT_URI=https://your-app.com/auth/callback
   VITE_CUSTOM_TOKEN_ENDPOINT=https://your-token-exchange-endpoint
   ```

The sign-in flow: user clicks Sign In → redirect to OIDC provider → callback to `/auth/callback` → ID token exchanged for Firebase custom token → user signed in to Firebase. OIDC profile claims (`name`, `email`, `picture`) are synced to the Firebase user profile.

## 🌍 Language Support

Moirai automatically detects your browser's language. You can also manually switch languages in the **Settings** tab.

*   🇺🇸 English (Default)
*   🇪🇪 Estonian
*   🇱🇹 Lithuanian
*   🇱🇻 Latvian
*   🇷🇺 Russian

## 📱 Mobile Installation (iOS/Android)

1.  Open the app in your browser (Safari on iOS, Chrome on Android).
2.  Tap the **Share** button (iOS) or **Menu** (Android).
3.  Select **"Add to Home Screen"**.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1.  Fork the project
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
