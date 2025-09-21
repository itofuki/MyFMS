/* src/pages/HomePage.tsx */

import { useCallback } from "react";
import { loadSlim } from "tsparticles-slim";
import type { Container, Engine } from "tsparticles-engine";
import Particles from "react-tsparticles";
import { Link } from "react-router-dom";

export default function HomePage() {
  const particlesInit = useCallback(async (engine: Engine) => {
    await loadSlim(engine);
  }, []);

  const particlesLoaded = useCallback(async (_container: Container | undefined) => {
    // パーティクルがロードされた後に実行する処理があればここに書く
    // console.log("Particles container loaded");
  }, []);

  return (
    <div className="relative min-h-screen text-white flex flex-col items-center justify-center p-4">
      {/* tsParticlesコンポーネントを背景として配置 */}
      <Particles
        id="tsparticles-homepage"
        init={particlesInit}
        loaded={particlesLoaded}
        options={{
          background: {
            color: {
              value: "#0a0a0e", // 背景色をさらに暗く
            },
          },
          fpsLimit: 120,
          interactivity: {
            events: {
              onClick: {
                enable: true,
                mode: "push",
              },
              onHover: {
                enable: true,
                mode: "repulse",
              },
              resize: true,
            },
            modes: {
              push: {
                quantity: 4,
              },
              repulse: {
                distance: 100,
                duration: 0.4,
              },
            },
          },
          particles: {
            color: {
              value: ["#00c6ff", "#92fe9d", "#ff0077"], // ネオンカラーのパーティクル
            },
            links: {
              color: "#4d4d4d", // リンクの色を控えめに
              distance: 150,
              enable: true,
              opacity: 0.5,
              width: 1,
            },
            collisions: {
              enable: true,
            },
            move: {
              direction: "none",
              enable: true,
              outModes: {
                default: "bounce",
              },
              random: false,
              speed: 2,
              straight: false,
            },
            number: {
              density: {
                enable: true,
                area: 800,
              },
              value: 80,
            },
            opacity: {
              value: 0.5,
            },
            shape: {
              type: "circle",
            },
            size: {
              value: { min: 1, max: 5 },
            },
          },
          detectRetina: true,
        }}
        className="absolute inset-0 z-0" // 背景として全画面に配置
      />

      {/* コンテンツをz-indexで前面に配置 */}
      <div className="relative z-10 text-center max-w-4xl mx-auto space-y-6">
        <h1 className="text-6xl md:text-8xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 drop-shadow-lg animate-pulse-light">
          FMS
        </h1>
        <p className="text-xl md:text-2xl text-gray-200 font-light leading-relaxed max-w-2xl mx-auto opacity-90">
          IPUT生向けの学習プラットフォーム。データを集約し、よりスマートな学習環境を支援します。
        </p>
        
        <div className="mt-8 flex justify-center space-x-4">
          <Link 
            to="/login" 
            className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-full shadow-lg hover:shadow-cyan-400/50 hover:scale-105 transition-all duration-300"
          >
            ログイン
          </Link>
          <Link 
            to="/register"
            className="px-8 py-3 border border-cyan-500 text-cyan-400 font-semibold rounded-full shadow-lg hover:shadow-cyan-400/50 hover:bg-cyan-500 hover:text-white hover:scale-105 transition-all duration-300"
          >
            新規登録
          </Link>
        </div>
      </div>
    </div>
  );
}