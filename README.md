# Study Environment - Interactive Learning Platform

A comprehensive React application for interactive exam preparation, featuring quizzes, podcast episodes, teach-back exercises, and research materials.

## Features

### 🏠 Home Dashboard
- Topic overview with progress tracking
- Quick access to all learning activities
- Study progress visualization

### 🎧 Podcast Player
- HTML5 audio player with custom controls
- Playback speed control (1x, 1.5x, 2x)
- Episodes organized by topic
- Auto-play next episode

### 📝 Practice Quiz
- Scenario-based questions
- Multiple difficulty levels (Easy, Medium, Hard)
- Rationale input before answer submission
- AI coaching feedback panel (agent-ready)
- Detailed explanations and references

### 💬 Teach-Back Exercise
- Explain concepts in your own words
- AI evaluation and feedback (agent-ready)
- Follow-up questions for deeper learning
- Voice input placeholder (coming soon)

### 📚 Research Browser
- Browse 55+ markdown documents
- Organized by topic categories
- Full-text search
- Rich markdown rendering

## Tech Stack

- **Framework**: React 18 with Vite
- **Routing**: React Router v6
- **Styling**: Tailwind CSS v3
- **UI Components**: Custom ShadCN/ui implementation
- **Markdown**: react-markdown
- **Icons**: Lucide React

## Getting Started

### Prerequisites
- Node.js 18+ and npm

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Build for production:
```bash
npm run build
```

4. Preview production build:
```bash
npm run preview
```

## Project Structure

```
├── public/
│   ├── manifest.json        # App configuration and topic tree
│   ├── quizzes.json         # Quiz questions database
│   ├── podcasts/            # Audio files
│   └── research/            # Markdown documentation
├── src/
│   ├── components/
│   │   ├── ui/              # ShadCN UI components
│   │   ├── Layout.jsx       # Main layout with nav and sidebar
│   │   ├── TopicSidebar.jsx # Collapsible topic navigation
│   │   ├── PodcastPlayer.jsx
│   │   ├── QuizCard.jsx
│   │   ├── CoachingPanel.jsx
│   │   └── ResearchViewer.jsx
│   ├── pages/
│   │   ├── Home.jsx
│   │   ├── Podcast.jsx
│   │   ├── Quiz.jsx
│   │   ├── TeachBack.jsx
│   │   └── Research.jsx
│   ├── hooks/
│   │   ├── useManifest.js
│   │   └── useQuizData.js
│   ├── lib/
│   │   └── utils.js
│   └── App.jsx
└── manifest.json            # Source manifest
```

## Configuration

### Manifest Structure

The `manifest.json` file drives the entire application:

```json
{
  "title": "Study Environment Title",
  "topics": [...],              // Hierarchical topic tree
  "quizPath": "quizzes.json",
  "researchDir": "research",
  "podcastEpisodes": [...]      // Episode metadata
}
```

### Adding Content

**Quizzes**: Add questions to `public/quizzes.json`

**Podcasts**: Place MP3 files in `public/podcasts/audio/` and add metadata to manifest

**Research**: Add markdown files to `public/research/` directory

## Features for AI Agent Integration

### Coaching Panel (Quiz)
The `CoachingPanel` component is designed to receive personalized feedback from an external AI agent. It displays:
- Assessment of correctness
- Key learning points
- Next steps
- Context-aware coaching

### Evaluation Display (Teach-Back)
The teach-back evaluation system can receive:
- Detailed scoring
- Strengths and weaknesses analysis
- Follow-up questions
- Personalized recommendations

Both features include placeholder data but are structured to accept real-time agent responses.

## Dark Mode

Dark mode is enabled by default and can be toggled via the sun/moon icon in the top navigation bar. The theme is managed through Tailwind CSS custom properties and the `dark` class.

## Responsive Design

- **Mobile**: Sidebar collapses with hamburger menu
- **Tablet**: Optimized layouts for medium screens
- **Desktop**: Full sidebar and multi-column layouts

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## Development

### Run in Development
```bash
npm run dev
```
The app will be available at `http://localhost:5173`

### Build for Production
```bash
npm run build
```
Output will be in the `dist/` directory

## License

This project is for educational purposes.
