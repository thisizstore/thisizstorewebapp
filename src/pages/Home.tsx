import { useEffect, useRef, useState } from 'react';
import {
  Flame,
  Sword,
  Trophy,
  Box,
  Target,
  Sparkles,
  Shield,
  ChevronRight,
  ChevronLeft,
  Star,
} from 'lucide-react';

interface Testimonial {
  author: string;
  text: string;
  rating: number;
}

const testimonials: Testimonial[] = [
  { author: 'Ahmad Fajri', text: 'Transaksi lancar dan aman. Akun original, sesuai deskripsi.', rating: 5 },
  { author: 'Budi Santoso', text: 'Admin sangat responsif dan membantu. Proses verifikasi mudah.', rating: 5 },
  { author: 'Siti Nurhaliza', text: 'Harga sangat kompetitif dibanding tempat lain.', rating: 5 },
  { author: 'Eka Wijaya', text: 'Daftar akun cepat dan pembayaran fleksibel.', rating: 5 },
  { author: 'Randi Pratama', text: 'Akun aman dan tidak ada masalah hingga sekarang.', rating: 5 },
];

const games = [
  { name: 'Free Fire', Icon: Flame, color: 'from-orange-500 to-red-500' },
  { name: 'Mobile Legend', Icon: Sword, color: 'from-purple-500 to-blue-500' },
  { name: 'Efootball', Icon: Trophy, color: 'from-yellow-500 to-amber-500' },
  { name: 'FC Mobile', Icon: Trophy, color: 'from-blue-500 to-cyan-500' },
  { name: 'Roblox', Icon: Box, color: 'from-pink-500 to-rose-500' },
  { name: 'PUBG', Icon: Target, color: 'from-green-500 to-emerald-500' },
  { name: 'Genshin Impact', Icon: Sparkles, color: 'from-amber-500 to-yellow-500' },
  { name: 'Clash of Clans', Icon: Shield, color: 'from-red-500 to-orange-500' },
];

interface GameIcon {
  id: number;
  game: typeof games[0];
  x: number;
  y: number;
}

export function Home({ onNavigate }: { onNavigate: (page: string) => void }) {
  const [testimonialIndex, setTestimonialIndex] = useState(0);
  const [gameIcons, setGameIcons] = useState<GameIcon[]>([]);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current && gameIcons.length === 0) {
      const rect = containerRef.current.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;

      const newIcons = games.map((game, index) => ({
        id: index,
        game,
        x: Math.random() * (w - 100) + 50,
        y: Math.random() * (h - 100) + 50,
      }));
      setGameIcons(newIcons);
    }
  }, []);

  const handleMouseDown = (id: number, e: React.MouseEvent) => {
    setDraggingId(id);
    const icon = gameIcons.find(i => i.id === id);
    if (icon) {
      setOffset({
        x: e.clientX - icon.x,
        y: e.clientY - icon.y,
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggingId !== null && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      let x = e.clientX - rect.left - offset.x;
      let y = e.clientY - rect.top - offset.y;

      x = Math.max(0, Math.min(x, rect.width - 80));
      y = Math.max(0, Math.min(y, rect.height - 80));

      setGameIcons(prev =>
        prev.map(icon =>
          icon.id === draggingId ? { ...icon, x, y } : icon
        )
      );
    }
  };

  const handleMouseUp = () => {
    setDraggingId(null);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setTestimonialIndex((prev) => (prev + 1) % testimonials.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const nextTestimonial = () => {
    setTestimonialIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setTestimonialIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900/50 via-black to-black pointer-events-none" />

      {/* Hero Section */}
      <div className="relative z-10 pt-24 pb-16 px-4 sm:px-6 lg:px-8 min-h-screen flex flex-col items-center justify-center">
        <div className="max-w-5xl mx-auto w-full">
          {/* Title */}
          <div className="text-center mb-24">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-4 text-white tracking-tight leading-tight">
              THIS IZ STORE
            </h1>
            <p className="text-lg sm:text-xl text-slate-400 font-light tracking-wide max-w-2xl mx-auto">
              Tempat Jual Beli Akun Murah Aman Amanah
            </p>
          </div>

          {/* Floating Game Icons */}
          <div
            ref={containerRef}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className="relative h-80 sm:h-96 mb-24 rounded-xl border border-cyan-500/10 bg-gradient-to-b from-slate-900/20 to-transparent backdrop-blur-sm cursor-grab active:cursor-grabbing"
          >
            {gameIcons.map((icon) => (
              <div
                key={icon.id}
                onMouseDown={(e) => handleMouseDown(icon.id, e)}
                className="absolute group cursor-grab active:cursor-grabbing transition-all duration-200 hover:scale-110"
                style={{
                  left: `${icon.x}px`,
                  top: `${icon.y}px`,
                  width: '80px',
                  height: '80px',
                }}
              >
                <div
                  className={`w-full h-full bg-gradient-to-br ${icon.game.color} rounded-xl shadow-lg flex items-center justify-center transform group-hover:shadow-2xl group-hover:shadow-cyan-500/20 transition-all duration-300 border border-white/10`}
                >
                  <icon.game.Icon className="w-10 h-10 text-white" />
                </div>
                <p className="absolute top-full mt-2 text-xs text-center text-slate-300 whitespace-nowrap w-24 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                  {icon.game.name}
                </p>
              </div>
            ))}

            {/* Center hint */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center text-slate-500/20">
                <p className="text-sm">Drag untuk menggeser icon</p>
              </div>
            </div>
          </div>

          {/* CTA Button */}
          <div className="flex justify-center">
            <button
              onClick={() => onNavigate('tutorial')}
              className="px-8 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-lg shadow-lg transition-all duration-200 hover:shadow-cyan-500/50 hover:shadow-xl flex items-center gap-2"
            >
              Tutorial Website
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="relative z-10 border-t border-cyan-500/10" />

      {/* Testimonials Section */}
      <div className="relative z-10 py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-16 text-white">
            Kepuasan Pelanggan
          </h2>

          <div className="flex items-center justify-center gap-6">
            <button
              onClick={prevTestimonial}
              className="p-2 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 rounded-lg transition-all duration-200 hidden sm:flex"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <div className="flex-1 max-w-2xl">
              <div className="bg-gradient-to-br from-slate-800/30 to-slate-900/30 border border-cyan-500/10 rounded-xl p-8 sm:p-10 backdrop-blur-sm">
                <div className="space-y-4">
                  {/* Stars */}
                  <div className="flex gap-1">
                    {[...Array(testimonials[testimonialIndex].rating)].map((_, i) => (
                      <Star
                        key={i}
                        className="w-5 h-5 fill-amber-400 text-amber-400"
                      />
                    ))}
                  </div>

                  {/* Comment */}
                  <p className="text-lg text-slate-200 italic min-h-16">
                    "{testimonials[testimonialIndex].text}"
                  </p>

                  {/* Author */}
                  <p className="text-cyan-400 font-semibold">
                    — {testimonials[testimonialIndex].author}
                  </p>
                </div>

                {/* Indicators */}
                <div className="flex justify-center gap-2 mt-8">
                  {testimonials.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setTestimonialIndex(index)}
                      className={`h-2 rounded-full transition-all duration-300 ${
                        index === testimonialIndex
                          ? 'w-8 bg-cyan-500'
                          : 'w-2 bg-cyan-500/30 hover:bg-cyan-500/50'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={nextTestimonial}
              className="p-2 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 rounded-lg transition-all duration-200 hidden sm:flex"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
