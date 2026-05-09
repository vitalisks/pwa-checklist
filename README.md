# CheckFlow - Modern Checklist PWA

CheckFlow is a beautifully designed, offline-capable Progressive Web Application (PWA) for managing checklists and templates. Built with performance and user experience in mind, it features a sleek glassmorphism UI, robust state management, and multi-language support.

![CheckFlow Project](https://via.placeholder.com/800x400?text=CheckFlow+Preview)

## ✨ key Features

*   **📱 Progressive Web App**: Installable on mobile and desktop, works fully offline.
*   **🎨 Premium UI/UX**: Modern glassmorphism design with smooth animations and transitions.
*   **⚡ Fast & Reliable**: Uses **IndexedDB** for virtually unlimited offline storage and instant loading.
*   **🌍 Multi-language Support**: Fully localized in **English**, **Spanish**, **Latvian**, and **Russian** with auto-detection.
*   **📋 Template System**: Create reusable templates with categories and items to quickly spin up new checklists.
*   **🔄 Smart State**: Checklists track progress automatically, supporting "Skip" logic for flexible workflows.
*   **📸 Photo Support**: Attach guide photos to template items and capture your own photos per checklist item. Full-screen lightbox with swipe navigation.
*   **✏️ Inline Editing**: Edit checklist titles in-place directly from the checklist view.
*   **↕️ Drag & Drop**: Reorder categories and items in the template editor via drag and drop.
*   **🔒 Privacy Focused**: All data stored locally on your device. Zero tracking.

## 🛠️ Technology Stack

*   **Core**: [React 19](https://reactjs.org/), [TypeScript](https://www.typescriptlang.org/)
*   **Build**: [Vite](https://vitejs.dev/)
*   **Styling**: CSS Modules + CSS custom properties (design tokens) — no Tailwind
*   **State & Storage**: React Hooks + IndexedDB (Custom implementation)
*   **Icons**: [Lucide React](https://lucide.dev/)
*   **Animations**: [Framer Motion](https://www.framer.com/motion/)
*   **Drag & Drop**: [@dnd-kit](https://dndkit.com/)

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

## 🌍 Language Support

CheckFlow automatically detects your browser's language. You can also manually switch languages in the **Settings** tab.

*   🇺🇸 English (Default)
*   🇪🇸 Spanish
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
