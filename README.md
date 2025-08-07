# Couples Connect 💕

A Progressive Web App (PWA) for couples to stay connected throughout the day with mood tracking, shared notes, and mini-features.

## Features

- 😊 **Mood Tracking** - Share your daily emotions with your partner
- 📝 **Shared Notes** - Leave love notes and messages for each other
- 💖 **Connection Status** - See when you last synced with your partner
- 🔄 **Real-time Sync** - Data syncs across devices via Firebase
- 📱 **PWA Support** - Install on your phone like a native app
- 🌙 **Offline Mode** - Works even when you're offline

## Live Demo

The app is automatically deployed to GitHub Pages: [https://foobar404.github.io/couples-app/](https://foobar404.github.io/couples-app/)

## Technologies Used

- **React** - Frontend framework
- **Vite** - Build tool and development server
- **Firebase** - Authentication and real-time database
- **Tailwind CSS** - Utility-first CSS framework
- **Vite PWA Plugin** - Progressive Web App functionality
- **React Router** - Client-side routing

## Development

### Prerequisites

- Node.js 18+ 
- npm

### Installation

1. Clone the repository:
```bash
git clone https://github.com/foobar404/couples-app.git
cd couples-app
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:5173](http://localhost:5173) in your browser.

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

### Preview Production Build

```bash
npm run preview
```

## Deployment

The app is automatically deployed to GitHub Pages using GitHub Actions whenever code is pushed to the `main` branch.

### Manual Deployment

If you want to deploy manually:

1. Build the project:
```bash
npm run build
```

2. Deploy the `dist` folder to your hosting service.

## Firebase Setup

To set up your own Firebase instance:

1. Create a new Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable Authentication with Google provider
3. Enable Realtime Database
4. Update the Firebase configuration in `src/utils/firebase.js`

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── UI.jsx          # Basic UI components (Button, Card, etc.)
│   ├── widgets/        # Dashboard widget components
│   ├── Calendar.jsx    # Calendar component
│   └── MoodSelector.jsx # Mood selection component
├── pages/              # Page components
│   ├── Dashboard.jsx   # Main dashboard
│   ├── MoodPage.jsx    # Mood tracking page
│   ├── NotesPage.jsx   # Notes and shared content
│   ├── GamesPage.jsx   # Mini games
│   └── SettingsPage.jsx # App settings
├── utils/              # Utilities and hooks
│   ├── AppContext.jsx  # Global state management
│   ├── hooks.js        # Custom React hooks
│   └── firebase.js     # Firebase integration
└── index.css          # Main stylesheet with BEM components
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).

## PWA Features

- 📱 **Installable** - Add to home screen on mobile devices
- 🔄 **Auto-updates** - Automatically updates when new versions are available
- 📶 **Offline support** - Works without internet connection
- 🎨 **Native feel** - Looks and feels like a native app
- 🚀 **Fast loading** - Cached assets for instant startup

---

Made with ❤️ for couples everywhere
