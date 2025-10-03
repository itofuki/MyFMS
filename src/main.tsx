/* src/main.tsx */

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import { MantineProvider } from '@mantine/core';
// ▲▲▲ ここまで ▲▲▲

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* ▼▼▼ MantineProviderでAppコンポーネント全体を囲みます ▼▼▼ */}
    <MantineProvider defaultColorScheme="dark">
      <App />
    </MantineProvider>
    {/* ▲▲▲ ここまで ▲▲▲ */}
  </React.StrictMode>,
)
