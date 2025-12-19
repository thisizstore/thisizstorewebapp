import { useEffect, useRef, useState, useCallback } from 'react';
import {
  ChevronRight,
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
  { name: 'Free Fire', image: '/game-icons/free-fire.png' },
  { name: 'Mobile Legend', image: '/game-icons/mobile-legends.png' },
  { name: 'Efootball', image: '/game-icons/efootball.png' },
  { name: 'FC Mobile', image: '/game-icons/fc-mobile.png' },
  { name: 'Roblox', image: '/game-icons/roblox.png' },
  { name: 'PUBG', image: '/game-icons/pubg.png' },
  { name: 'Genshin Impact', image: '/game-icons/genshin-impact.png' },
  { name: 'Clash of Clans', image: '/game-icons/clash-of-clans.png' },
];

const COLLISION_PADDING = 15;

// Get responsive icon size based on screen width
const getIconSize = () => {
  if (typeof window === 'undefined') return 70;
  return window.innerWidth < 640 ? 50 : 70;
};

interface GameIcon {
  id: number;
  game: typeof games[0];
  x: number;
  y: number;
  rotation: number;
  isDragging: boolean;
  zIndex: number;
}

export function Home({ onNavigate }: { onNavigate: (page: string) => void }) {
  const [testimonialIndex, setTestimonialIndex] = useState(0);
  const [gameIcons, setGameIcons] = useState<GameIcon[]>([]);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState<number | null>(null);
  const [iconSize, setIconSize] = useState(getIconSize());
  const containerRef = useRef<HTMLDivElement>(null);

  // Update icon size on resize
  useEffect(() => {
    const handleResize = () => {
      setIconSize(getIconSize());
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Check if two icons would collide
  const wouldCollide = useCallback((x1: number, y1: number, x2: number, y2: number, currentIconSize: number) => {
    const distance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    return distance < currentIconSize + COLLISION_PADDING;
  }, []);

  // Check if position is in center zone (where text/buttons are) - larger zone on mobile
  const isInCenterZone = useCallback((x: number, y: number, containerWidth: number, containerHeight: number, currentIconSize: number) => {
    const centerX = containerWidth / 2;
    const centerY = containerHeight / 2;
    // Larger protection zone on mobile to prevent icon overlap with text
    const isMobile = containerWidth < 640;
    const zoneWidth = isMobile ? containerWidth * 0.85 : 280;
    const zoneHeight = isMobile ? 280 : 200;
    return Math.abs(x + currentIconSize / 2 - centerX) < zoneWidth / 2 && Math.abs(y + currentIconSize / 2 - centerY) < zoneHeight / 2;
  }, []);

  // Find valid position that doesn't collide with other icons
  const findValidPosition = useCallback((
    targetX: number,
    targetY: number,
    currentId: number,
    icons: GameIcon[],
    containerWidth: number,
    containerHeight: number,
    currentIconSize: number
  ): { x: number, y: number } => {
    for (const icon of icons) {
      if (icon.id === currentId) continue;

      if (wouldCollide(targetX, targetY, icon.x, icon.y, currentIconSize)) {
        const angle = Math.atan2(targetY - icon.y, targetX - icon.x);
        const pushDistance = currentIconSize + COLLISION_PADDING + 5;

        let newX = icon.x + Math.cos(angle) * pushDistance;
        let newY = icon.y + Math.sin(angle) * pushDistance;

        newX = Math.max(10, Math.min(newX, containerWidth - currentIconSize - 10));
        newY = Math.max(10, Math.min(newY, containerHeight - currentIconSize - 10));

        return { x: newX, y: newY };
      }
    }

    return { x: targetX, y: targetY };
  }, [wouldCollide]);

  // Initialize icon positions around the edges (avoiding center)
  useEffect(() => {
    if (containerRef.current && gameIcons.length === 0) {
      const rect = containerRef.current.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      const isMobile = w < 640;
      const currentIconSize = isMobile ? 50 : 70;

      // Safe positions around edges - different for mobile vs desktop
      // On mobile, icons are placed in corners and edges only to avoid center text
      const safePositions = isMobile ? [
        // Mobile: 4 corners and 4 edge positions
        { x: 10, y: 30, rotation: -8 },   // Top-left
        { x: w - currentIconSize - 10, y: 30, rotation: 6 },    // Top-right
        { x: 10, y: h - currentIconSize - 100, rotation: -5 },  // Bottom-left (above buttons)
        { x: w - currentIconSize - 10, y: h - currentIconSize - 100, rotation: 10 }, // Bottom-right (above buttons)
        { x: 10, y: h - currentIconSize - 30, rotation: 8 },    // Far bottom-left
        { x: w - currentIconSize - 10, y: h - currentIconSize - 30, rotation: -6 }, // Far bottom-right
        { x: w / 2 - currentIconSize - 50, y: 30, rotation: 4 },  // Top-center-left
        { x: w / 2 + 50, y: h - currentIconSize - 30, rotation: -10 },  // Bottom-center-right
      ] : [
        // Desktop: wider spread positions
        { x: 40, y: 50, rotation: -8 },
        { x: w - 120, y: 40, rotation: 6 },
        { x: 30, y: h / 2 - 40, rotation: -5 },
        { x: w - 110, y: h / 2 - 30, rotation: 10 },
        { x: 60, y: h - 130, rotation: 8 },
        { x: w - 130, y: h - 140, rotation: -6 },
        { x: w / 2 - 220, y: 60, rotation: 4 },
        { x: w / 2 + 150, y: h - 120, rotation: -10 },
      ];

      const newIcons: GameIcon[] = [];

      games.forEach((game, index) => {
        const pos = safePositions[index] || { x: 100, y: 100, rotation: 0 };

        let finalX = Math.max(10, Math.min(pos.x, w - currentIconSize - 10));
        let finalY = Math.max(10, Math.min(pos.y, h - currentIconSize - 10));

        // Ensure no collision with existing icons
        for (const existing of newIcons) {
          if (wouldCollide(finalX, finalY, existing.x, existing.y, currentIconSize)) {
            finalX = finalX + currentIconSize + COLLISION_PADDING;
            if (finalX > w - currentIconSize - 10) {
              finalX = 10;
              finalY = finalY + currentIconSize + COLLISION_PADDING;
            }
          }
        }

        newIcons.push({
          id: index,
          game,
          x: finalX,
          y: finalY,
          rotation: pos.rotation,
          isDragging: false,
          zIndex: 10 + index,
        });
      });

      setGameIcons(newIcons);
    }
  }, [wouldCollide]);

  const handleMouseDown = (id: number, e: React.MouseEvent) => {
    e.preventDefault();
    setDraggingId(id);

    // Bring to front while dragging
    setGameIcons(prev => prev.map(icon =>
      icon.id === id
        ? { ...icon, isDragging: true, zIndex: 1000 }
        : icon
    ));

    const icon = gameIcons.find(i => i.id === id);
    if (icon && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setOffset({
        x: e.clientX - rect.left - icon.x,
        y: e.clientY - rect.top - icon.y,
      });
    }
  };

  const handleTouchStart = (id: number, e: React.TouchEvent) => {
    setDraggingId(id);

    setGameIcons(prev => prev.map(icon =>
      icon.id === id
        ? { ...icon, isDragging: true, zIndex: 1000 }
        : icon
    ));

    const icon = gameIcons.find(i => i.id === id);
    if (icon && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const touch = e.touches[0];
      setOffset({
        x: touch.clientX - rect.left - icon.x,
        y: touch.clientY - rect.top - icon.y,
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggingId !== null && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      let targetX = e.clientX - rect.left - offset.x;
      let targetY = e.clientY - rect.top - offset.y;

      targetX = Math.max(0, Math.min(targetX, rect.width - iconSize));
      targetY = Math.max(0, Math.min(targetY, rect.height - iconSize));

      // Check for collisions and find valid position
      const validPos = findValidPosition(targetX, targetY, draggingId, gameIcons, rect.width, rect.height, iconSize);

      setGameIcons(prev =>
        prev.map(icon =>
          icon.id === draggingId ? { ...icon, x: validPos.x, y: validPos.y } : icon
        )
      );
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (draggingId !== null && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const touch = e.touches[0];
      let targetX = touch.clientX - rect.left - offset.x;
      let targetY = touch.clientY - rect.top - offset.y;

      targetX = Math.max(0, Math.min(targetX, rect.width - iconSize));
      targetY = Math.max(0, Math.min(targetY, rect.height - iconSize));

      const validPos = findValidPosition(targetX, targetY, draggingId, gameIcons, rect.width, rect.height, iconSize);

      setGameIcons(prev =>
        prev.map(icon =>
          icon.id === draggingId ? { ...icon, x: validPos.x, y: validPos.y } : icon
        )
      );
    }
  };

  const handleMouseUp = () => {
    if (draggingId !== null && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const icon = gameIcons.find(i => i.id === draggingId);

      if (icon) {
        // Check if dropped in center zone -> drop z-index to behind text
        const isInCenter = isInCenterZone(icon.x, icon.y, rect.width, rect.height, iconSize);
        const newZIndex = isInCenter ? 1 : 10;

        setGameIcons(prev => prev.map(i =>
          i.id === draggingId
            ? { ...i, isDragging: false, zIndex: newZIndex }
            : i
        ));
      }
    }
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
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900/30 via-black to-black pointer-events-none" />

      {/* Background orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

      {/* Hero Section */}
      <div className="relative z-10 pt-24 pb-16 px-4 sm:px-6 lg:px-8 min-h-screen flex flex-col items-center justify-center">
        <div className="max-w-6xl mx-auto w-full">

          {/* Interactive Game Icons Container */}
          <div
            ref={containerRef}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleMouseUp}
            className="relative h-[500px] sm:h-[600px] lg:h-[700px] w-full"
            style={{ touchAction: 'none' }}
          >
            {/* Floating Game Icons */}
            {gameIcons.map((icon) => (
              <div
                key={icon.id}
                onMouseDown={(e) => handleMouseDown(icon.id, e)}
                onTouchStart={(e) => handleTouchStart(icon.id, e)}
                onMouseEnter={() => setIsHovering(icon.id)}
                onMouseLeave={() => setIsHovering(null)}
                className={`absolute group cursor-grab active:cursor-grabbing select-none ${icon.isDragging ? 'scale-110' : ''
                  }`}
                style={{
                  left: `${icon.x}px`,
                  top: `${icon.y}px`,
                  width: `${iconSize}px`,
                  height: `${iconSize}px`,
                  zIndex: icon.isDragging ? 1000 : icon.zIndex,
                  transform: `rotate(${icon.rotation}deg) scale(${isHovering === icon.id && !icon.isDragging ? 1.15 : 1})`,
                  transition: icon.isDragging ? 'transform 0.1s' : 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                {/* Game Image Icon */}
                <div
                  className={`w-full h-full rounded-xl shadow-lg overflow-hidden transition-all duration-300 border-2 border-white/20 ${isHovering === icon.id || icon.isDragging ? 'shadow-2xl shadow-cyan-500/30 border-cyan-400/50' : ''
                    }`}
                >
                  <img
                    src={icon.game.image}
                    alt={icon.game.name}
                    className="w-full h-full object-cover"
                    draggable={false}
                  />
                </div>

                {/* Tooltip */}
                <div className={`absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap px-3 py-1 bg-slate-900/95 border border-cyan-500/40 rounded-lg text-xs text-cyan-300 font-medium shadow-lg transition-all duration-300 ${isHovering === icon.id && !icon.isDragging ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'
                  }`}>
                  {icon.game.name}
                </div>
              </div>
            ))}

            {/* Center Content - THIS IZ STORE (z-index 50 to be above dropped icons) */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 50 }}>
              <div className="text-center px-4">
                <p className="text-slate-400 text-sm sm:text-base mb-2 tracking-widest uppercase">
                  Tempat Jual Beli Akun Game
                </p>

                <h1 className="text-4xl sm:text-6xl lg:text-8xl font-black mb-4 tracking-tight">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-500">
                    THIS IZ
                  </span>
                  <br />
                  <span className="text-white">STORE</span>
                </h1>

                <p className="text-slate-400 text-sm sm:text-lg max-w-md mx-auto mb-8">
                  Murah • Aman • Terpercaya
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pointer-events-auto">
                  <button
                    onClick={() => onNavigate('market')}
                    className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-bold rounded-xl shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-all duration-300 flex items-center gap-2 hover:scale-105"
                  >
                    Lihat Market
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => onNavigate('tutorial')}
                    className="px-8 py-3 bg-slate-800/50 hover:bg-slate-700/50 border border-cyan-500/30 hover:border-cyan-400/50 text-cyan-300 font-semibold rounded-xl transition-all duration-300 hover:scale-105"
                  >
                    Tutorial
                  </button>
                </div>
              </div>
            </div>

            {/* Drag hint */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-slate-500/50 text-xs sm:text-sm pointer-events-none" style={{ zIndex: 5 }}>
            </div>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="relative z-10 border-t border-cyan-500/10" />

      {/* Testimonials Section */}
      <div className="relative z-10 py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-black via-slate-950/50 to-black">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
            Kepuasan Pelanggan
          </h2>
          <p className="text-slate-400 text-center mb-12">Apa kata mereka tentang layanan kami</p>

          <div className="flex items-center justify-center gap-6">
            <button
              onClick={prevTestimonial}
              className="p-3 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 rounded-xl transition-all duration-200 hidden sm:flex border border-cyan-500/20 hover:border-cyan-500/40"
            >
              <ChevronRight className="w-6 h-6 rotate-180" />
            </button>

            <div className="flex-1 max-w-2xl">
              <div className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 border border-cyan-500/10 rounded-2xl p-8 sm:p-10 backdrop-blur-sm shadow-2xl shadow-cyan-500/5">
                <div className="space-y-6">
                  <div className="flex gap-1 justify-center">
                    {[...Array(testimonials[testimonialIndex].rating)].map((_, i) => (
                      <Star key={i} className="w-6 h-6 fill-amber-400 text-amber-400" />
                    ))}
                  </div>

                  <p className="text-lg sm:text-xl text-slate-200 italic text-center min-h-16 leading-relaxed">
                    "{testimonials[testimonialIndex].text}"
                  </p>

                  <p className="text-cyan-400 font-semibold text-center text-lg">
                    — {testimonials[testimonialIndex].author}
                  </p>
                </div>

                <div className="flex justify-center gap-2 mt-8">
                  {testimonials.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setTestimonialIndex(index)}
                      className={`h-2 rounded-full transition-all duration-300 ${index === testimonialIndex
                        ? 'w-10 bg-gradient-to-r from-cyan-500 to-purple-500'
                        : 'w-2 bg-cyan-500/30 hover:bg-cyan-500/50'
                        }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={nextTestimonial}
              className="p-3 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 rounded-xl transition-all duration-200 hidden sm:flex border border-cyan-500/20 hover:border-cyan-500/40"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
