# Claude Developer Certification Study Environment

A comprehensive React-based study application for interactive exam preparation featuring quizzes, podcasts, research materials, and teach-back exercises.

## Features

### 🏠 Home Dashboard
- Overview of all study modes with progress tracking
- Quick stats on topics, questions, and episodes
- Direct navigation to all study tools

### 📚 Research Browser
- Browse comprehensive study materials organized by topic
- Rich markdown rendering with syntax highlighting
- 10 main topic areas covering all certification content
- Responsive layout with topic navigation

### 🎧 Podcast Player
- 44 audio episodes grouped by topic
- HTML5 audio player with custom controls
- Playback speed control (1x, 1.5x, 2x)
- Seek bar and time display
- Episodes cover all certification topics

### ❓ Quiz Practice
- 50 scenario-based certification questions
- Filter by topic and difficulty (easy, medium, hard)
- Write rationale before revealing answers
- Instant feedback with detailed explanations
- Coaching panel with personalized study tips
- Track progress across all questions

### 💬 Teach-Back
- Practice explaining concepts in your own words
- AI evaluation placeholder (ready for agent integration)
- Follow-up questions to deepen understanding
- Active recall and knowledge reinforcement
- Voice input placeholder (coming soon)

## Technology Stack

- **React 19** - Modern UI framework
- **Vite 7** - Fast build tool and dev server
- **React Router 6** - Client-side routing
- **Tailwind CSS v4** - Utility-first styling
- **ShadCN/ui** - High-quality component library
- **React Markdown** - Markdown rendering
- **Lucide React** - Beautiful icon library

## Project Structure

```
harness-v2-test/
├── src/
│   ├── components/
│   │   ├── ui/              # ShadCN/ui components
│   │   ├── Layout.jsx       # Main layout with nav and sidebar
│   │   ├── TopicSidebar.jsx # Collapsible topic navigation
│   │   ├── PodcastPlayer.jsx # Audio player component
│   │   ├── QuizCard.jsx     # Question display with rationale
│   │   ├── CoachingPanel.jsx # AI coaching feedback
│   │   ├── TeachBackInput.jsx # Teach-back exercise component
│   │   └── ResearchViewer.jsx # Markdown content renderer
│   ├── pages/
│   │   ├── Home.jsx         # Dashboard
│   │   ├── Podcast.jsx      # Podcast episodes
│   │   ├── Quiz.jsx         # Quiz interface
│   │   ├── TeachBack.jsx    # Teach-back exercises
│   │   └── Research.jsx     # Research materials
│   ├── hooks/
│   │   └── useTheme.jsx     # Dark/light mode theme hook
│   ├── lib/
│   │   └── utils.js         # Utility functions
│   ├── App.jsx              # Main app component
│   ├── main.jsx             # Entry point
│   └── index.css            # Global styles
├── public/
│   ├── manifest.json        # Study content manifest
│   ├── quizzes.json         # Quiz questions
│   ├── research/            # Markdown study materials
│   └── podcasts/            # Audio episodes
├── index.html               # HTML template
├── vite.config.js           # Vite configuration
├── tailwind.config.js       # Tailwind configuration
└── package.json             # Dependencies

```

## Getting Started

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Development

The app runs on `http://localhost:5173` by default. Hot module replacement is enabled for instant updates during development.

## Data Files

### manifest.json
Contains metadata about the study environment including:
- Title and exam information
- Paths to data files
- Podcast episode list with topics and durations

### quizzes.json
50 quiz questions with:
- Scenarios and questions
- Multiple choice options
- Correct answers and detailed rationales
- Topic tags and difficulty levels
- Reference materials

### research/topic-tree.json
Hierarchical topic structure with:
- Main topics and subtopics
- Descriptions and complexity estimates
- 38 leaf topics across 10 main areas

### research/*.md
Comprehensive study materials:
- Detailed explanations of concepts
- Code examples and best practices
- API documentation
- Real-world use cases

### podcasts/audio/*.mp3
Audio episodes covering all topics:
- Organized by topic ID
- Multiple parts per topic
- ~15 minutes per episode

## Features in Detail

### Dark Mode
- Default dark theme
- Toggle between light and dark modes
- Persistent theme preference in localStorage
- Smooth transitions

### Responsive Design
- Mobile-first approach
- Collapsible sidebar on mobile
- Touch-friendly controls
- Optimized for all screen sizes

### Accessibility
- Semantic HTML structure
- ARIA labels for interactive elements
- Keyboard navigation support
- Screen reader friendly

### Quiz Flow
1. Read scenario and question
2. Select an answer option
3. Write your rationale
4. Submit to see results
5. Review official explanation
6. Get coaching feedback
7. Navigate between questions

### Audio Player Features
- Standard HTML5 audio controls
- Custom seek bar
- Time display (current/total)
- Playback speed selector
- Skip forward/backward 10 seconds
- Episode playlist by topic

### Research Viewer
- Syntax-highlighted code blocks
- Responsive tables
- Styled blockquotes and lists
- External link handling
- Print-friendly layout

## Future Enhancements

### Agent Integration Points
- **Coaching Panel**: Connect to AI agent for personalized feedback based on quiz answers
- **Teach-Back Evaluation**: AI agent to evaluate explanations and provide targeted feedback
- **Voice Input**: Speech-to-text for teach-back exercises
- **Progress Tracking**: Real-time study analytics and recommendations
- **Adaptive Learning**: AI-suggested next topics based on performance

### Planned Features
- Study session timer
- Bookmark favorite questions/topics
- Custom study plans
- Flashcard mode
- Practice exam mode
- Progress export/import

## Build Output

The production build generates:
- Optimized JavaScript bundle (~420KB, gzipped: ~131KB)
- Minified CSS bundle (~27KB, gzipped: ~5.4KB)
- Static HTML entry point
- All assets copied to dist/

## Browser Support

- Modern browsers with ES2020+ support
- Chrome, Firefox, Safari, Edge (latest versions)
- Mobile browsers on iOS and Android

## License

ISC

## Acknowledgments

Built for the Claude Developer Certification Study Environment using modern web technologies and best practices.
