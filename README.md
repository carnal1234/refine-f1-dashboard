# 🏎️ Formula 1 Dashboard

A modern, interactive dashboard for visualizing Formula 1 racing data with real-time analytics and comprehensive race insights.

![Formula 1 Dashboard](https://img.shields.io/badge/Formula%201-Dashboard-blue?style=for-the-badge&logo=formula1)
![React](https://img.shields.io/badge/React-18.0.0-blue?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.4.2-blue?style=for-the-badge&logo=typescript)
![Ant Design](https://img.shields.io/badge/Ant%20Design-5.17.0-blue?style=for-the-badge&logo=ant-design)

## 🎯 Overview

This Formula 1 Dashboard is a comprehensive web application that brings Formula 1 racing data to life through interactive visualizations and real-time analytics. Built with modern web technologies, it provides fans, analysts, and enthusiasts with deep insights into race performance, driver statistics, and race strategies.

### 🌟 Key Features

- **🏁 Race Pace Analysis**: Interactive lap time visualization with outlier detection
- **📊 Driver Performance**: Comprehensive driver statistics and comparisons
- **🔄 Race Strategy**: Stint analysis and pit stop tracking
- **📈 Position Changes**: Real-time position tracking throughout races
- **🏆 Championship Standings**: Current season standings and historical data
- **📅 Race Calendar**: Upcoming races with countdown timers
- **🎨 Modern UI**: Beautiful, responsive design with dark theme
- **📱 Mobile Friendly**: Optimized for all device sizes

## 🚀 Live Demo

**[View Live Dashboard](https://refine-f1-dashboard.vercel.app/)**

> **Note**: OpenF1 API is under development and race data is currently available for 2023-2024 seasons.

## 🛠️ Technology Stack

- **Frontend**: React 18 + TypeScript
- **UI Framework**: Ant Design 5.17.0
- **Charts**: Ant Design Charts & Plots
- **Routing**: React Router v6
- **State Management**: React Context + Hooks
- **Styling**: SCSS + Tailwind CSS
- **Build Tool**: Vite
- **Data Provider**: Refine Framework
- **Icons**: Lucide React + Ant Design Icons

## 📦 Installation

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn package manager

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd auth-antd
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:8080`

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run refine       # Run Refine CLI commands
```

## 📊 Data Sources

This dashboard integrates with multiple Formula 1 data APIs:

- **[OpenF1 API](https://openf1.org/)**: Primary data source for race telemetry, lap times, and session data
- **[Ergast API](http://ergast.com/mrd/)**: Supplementary data for race schedules and historical information

## 🎮 Usage

### Dashboard Navigation

1. **Home**: Overview with upcoming race countdown and season highlights
2. **Races**: Browse race sessions and view detailed race analytics
3. **Drivers**: Explore driver profiles and performance statistics
4. **Standings**: Current championship standings and points

### Race Analysis Features

- **Race Pace Graph**: Interactive lap time visualization with:
  - Outlier detection and filtering
  - Driver comparison tools
  - Stint analysis overlays
  - Pit stop indicators

- **Position Tracking**: Real-time position changes throughout the race
- **Strategy Analysis**: Stint duration and tire compound tracking
- **Event Logging**: Safety car periods, weather changes, and incidents

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
VITE_API_URL=https://api.openf1.org/v1
VITE_ERGAST_API_URL=http://ergast.com/api/f1
```

### API Configuration

The dashboard is configured to work with the OpenF1 API by default. You can modify the API endpoints in:

- `src/services/openF1Api.ts` - OpenF1 API configuration
- `src/services/ergastApi.ts` - Ergast API configuration

## 🏗️ Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── common/         # Shared components
│   ├── graph/          # Chart and visualization components
│   └── races/          # Race-specific components
├── context/            # React context providers
├── data/               # Static data and mock files
├── interfaces/         # TypeScript type definitions
├── pages/              # Page components
│   ├── dashboard/      # Dashboard pages
│   ├── drivers/        # Driver-related pages
│   ├── races/          # Race-related pages
│   └── standing/       # Standings pages
├── services/           # API service functions
├── style/              # SCSS stylesheets
└── utilities/          # Helper functions and utilities
```

## 🎨 Customization

### Themes

The dashboard uses Ant Design's theming system. You can customize the theme in `src/App.tsx`:

```typescript
<ConfigProvider theme={{ algorithm: theme.darkAlgorithm }}>
  {/* Your app content */}
</ConfigProvider>
```

### Charts

Charts are built using Ant Design Charts. You can customize chart configurations in the respective component files under `src/components/graph/`.

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit your changes**: `git commit -m 'Add amazing feature'`
4. **Push to the branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### Development Guidelines

- Follow TypeScript best practices
- Use functional components with hooks
- Maintain consistent code formatting
- Add proper error handling
- Include TypeScript types for all functions

## 📋 Roadmap

### Planned Features

- [ ] **Advanced Analytics**: Machine learning-powered performance predictions
- [ ] **Historical Comparisons**: Compare drivers across different seasons
- [ ] **Weather Integration**: Weather data correlation with performance
- [ ] **Social Features**: User comments and race discussions
- [ ] **Mobile App**: React Native version for mobile devices
- [ ] **Real-time Updates**: WebSocket integration for live race data
- [ ] **Export Functionality**: PDF/Excel export of race data
- [ ] **Custom Dashboards**: User-configurable dashboard layouts

### Current Development

- [x] Race pace visualization
- [x] Driver performance tracking
- [x] Stint analysis
- [x] Position changes tracking
- [x] Championship standings
- [x] Race calendar integration

## 🐛 Known Issues

- OpenF1 API has limited historical data (2023-2024 only)
- Some race sessions may have incomplete telemetry data
- Mobile performance optimization in progress

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **[OpenF1](https://openf1.org/)** - For providing comprehensive F1 data APIs
- **[Ergast](http://ergast.com/mrd/)** - For historical F1 data
- **[Ant Design](https://ant.design/)** - For the beautiful UI components
- **[Refine](https://refine.dev/)** - For the powerful admin framework

## 📞 Support

If you have any questions or need help:

- **Issues**: [GitHub Issues](https://github.com/your-repo/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-repo/discussions)
- **Email**: [your-email@example.com]

---

**Made with ❤️ for Formula 1 fans around the world**

