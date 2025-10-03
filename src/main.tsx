/* src/main.tsx */

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import { MantineProvider, createTheme } from '@mantine/core';
// ▲▲▲ ここまで ▲▲▲

const theme = createTheme({
  fontFamily: '"Noto Sans JP", sans-serif',
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* ▼▼▼ MantineProviderでAppコンポーネント全体を囲みます ▼▼▼ */}
    <MantineProvider defaultColorScheme="dark" theme={theme}>
      <App />
    </MantineProvider>
    {/* ▲▲▲ ここまで ▲▲▲ */}
  </React.StrictMode>,
)
