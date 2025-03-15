# HiveApp - Smart Beekeeping Management

HiveApp is a React Native mobile application designed for beekeepers to monitor and manage their hives. The app provides real-time data visualization, AI-powered insights, and notifications for critical hive events.

## Features

- **Dashboard**: Overview of key hive metrics (temperature, humidity, pest status, honey production)
- **Hive Detail View**: Detailed graphs showing sensor data trends
- **AI Insights**: AI-generated recommendations based on sensor readings
- **Notifications Center**: In-app notifications with timestamps and action buttons
- **Settings**: Configure notification thresholds and test different notification types
- **User Authentication**: Support for both hobbyist and commercial beekeepers

## Demo Credentials

For testing purposes, you can use the following demo accounts:

- **Hobby Beekeeper**:
  - Email: hobbyist@example.com
  - Password: password

- **Commercial Beekeeper**:
  - Email: commercial@example.com
  - Password: password

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm or yarn
- Expo CLI

### Installation

1. Clone the repository
```
git clone https://github.com/yourusername/hiveapp.git
cd hiveapp
```

2. Install dependencies
```
npm install
# or
yarn install
```

3. Start the development server
```
npm start
# or
yarn start
```

4. Open the app on your device using the Expo Go app or run it in a simulator

## Project Structure

```
hiveapp/
├── assets/              # Images, fonts, and other static assets
├── src/
│   ├── components/      # Reusable UI components
│   ├── redux/           # Redux store, slices, and actions
│   ├── screens/         # App screens
│   └── utils/           # Helper functions and theme
├── App.js               # Main app component
└── app.json             # Expo configuration
```

## Technologies Used

- React Native
- Expo
- Redux Toolkit
- React Navigation
- React Native Chart Kit
- React Native Vector Icons

## Simulated Features

Since this is a demo application without a real backend or hardware integration, the following features are simulated:

- Sensor data is generated and updated at regular intervals
- Notifications are triggered by simulated events
- AI insights are generated based on predefined rules
- User authentication uses mock data

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Icons provided by Ionicons
- Color scheme inspired by honey and beehive colors 