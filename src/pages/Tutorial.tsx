import { MessageCircle } from 'lucide-react';

export function Tutorial() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-black pt-24 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl sm:text-5xl font-bold mb-16 text-center text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
          Tutorial Website
        </h1>

        {/* Jasa Posting Tutorials */}
        <div className="mb-20 space-y-8">
          <div className="border-t border-cyan-500/30 pt-12">
            <h2 className="text-3xl font-bold text-cyan-400 mb-8">Jasa Posting (JasPost)</h2>

            {/* Tutorial 1 */}
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-cyan-500/30 rounded-lg p-8 mb-8 backdrop-blur-sm">
              <h3 className="text-xl font-bold text-purple-400 mb-4">Cara Posting Akun</h3>
              <p className="text-slate-300 mb-6">
                Pelajari langkah-langkah untuk memposting akun game Anda di platform kami:
              </p>
              <div className="relative w-full bg-black rounded-lg overflow-hidden">
                <div className="aspect-video bg-slate-800 flex items-center justify-center">
                  <iframe
                    width="100%"
                    height="100%"
                    src="https://www.youtube.com/embed/Fyr37Y7JZ8s?si=WPqC9hq7sOnRy69o"
                    title="Tutorial Jasa Posting"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full"
                  />
                </div>
              </div>
            </div>

            {/* Tutorial 2 */}
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-cyan-500/30 rounded-lg p-8 backdrop-blur-sm">
              <h3 className="text-xl font-bold text-purple-400 mb-4">Cara Membeli Akun</h3>
              <p className="text-slate-300 mb-6">
                Ikuti panduan ini untuk membeli akun game yang Anda inginkan:
              </p>
              <div className="relative w-full bg-black rounded-lg overflow-hidden">
                <div className="aspect-video bg-slate-800 flex items-center justify-center">
                  <iframe
                    width="100%"
                    height="100%"
                    src="https://www.youtube.com/embed/gO6dCSo50Ho?si=wracE2MdNt1Crn61"
                    title="Tutorial Membeli Akun"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-cyan-500/30 py-12" />

        {/* Jasa Cari Tutorials */}
        <div className="space-y-8">
          <div>
            <h2 className="text-3xl font-bold text-cyan-400 mb-8">Jasa Cari (JasCar)</h2>

            {/* Tutorial 3 */}
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-cyan-500/30 rounded-lg p-8 mb-8 backdrop-blur-sm">
              <h3 className="text-xl font-bold text-purple-400 mb-4">Cara Mencari Akun</h3>
              <p className="text-slate-300 mb-6">
                Temukan cara terbaik untuk mencari akun game sesuai spesifikasi yang Anda inginkan:
              </p>
              <div className="relative w-full bg-black rounded-lg overflow-hidden">
                <div className="aspect-video bg-slate-800 flex items-center justify-center">
                  <iframe
                    width="100%"
                    height="100%"
                    src="https://www.youtube.com/embed/yc1Wx31-pIU?si=ipx4aa4yTnUd6oFv"
                    title="Tutorial Jasa Cari"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full"
                  />
                </div>
              </div>
            </div>

            {/* Tutorial 4 */}
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-cyan-500/30 rounded-lg p-8 backdrop-blur-sm">
              <h3 className="text-xl font-bold text-purple-400 mb-4">Menawarkan Akun ke Pencari</h3>
              <p className="text-slate-300 mb-6">
                Panduan lengkap untuk menawarkan akun game Anda kepada pembeli yang sedang mencari:
              </p>
              <div className="relative w-full bg-black rounded-lg overflow-hidden">
                <div className="aspect-video bg-slate-800 flex items-center justify-center">
                  <iframe
                    width="100%"
                    height="100%"
                    src="https://www.youtube.com/embed/gO6dCSo50Ho?si=wracE2MdNt1Crn61"
                    title="Tutorial Menawarkan Akun"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* WhatsApp Support Button */}
        <div className="mt-20 flex justify-center">
          <a
            href="https://wa.me/6283136224221?text=Saya%20ada%20kendala%20dengan%20website"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white font-bold rounded-lg shadow-2xl transition-all duration-300 hover:scale-105"
          >
            <MessageCircle className="w-6 h-6" />
            Chat Jika Ada Kendala
          </a>
        </div>
      </div>
    </div>
  );
}
