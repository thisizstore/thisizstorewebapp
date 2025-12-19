import { useState, useEffect, useMemo } from 'react';

import { JasaPosting, JasaCari } from '../types';
import { formatCurrency } from '../utils/validation';
import { Eye, MessageSquare, ChevronLeft, ChevronRight, Search, Filter, X, ShoppingBag, Users, Sparkles, Maximize2 } from 'lucide-react';

import { useDataStore } from '../hooks/useDataStore';

type TabType = 'posting' | 'cari';

interface DetailState {
  isOpen: boolean;
  type: TabType;
  data: JasaPosting | JasaCari | null;
}

export function Market() {
  const [activeTab, setActiveTab] = useState<TabType>('posting');
  const [postings, setPostings] = useState<JasaPosting[]>([]);
  const [caris, setCaris] = useState<JasaCari[]>([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<DetailState>({
    isOpen: false,
    type: 'posting',
    data: null,
  });
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);

  // Search and Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGame, setSelectedGame] = useState<string>('all');

  // Use prefetched data if available - initialized from localStorage cache in useDataStore
  const { postings: storePostings, caris: storeCaris, hasPrefetchedData, loading: storeLoading, refresh } = useDataStore();

  useEffect(() => {
    // If store has data, use it directly
    if (hasPrefetchedData) {
      console.log('[Market] Using store data:', storePostings.length, storeCaris.length);
      setPostings(storePostings);
      setCaris(storeCaris);
      setLoading(false);
    } else if (!storeLoading) {
      // No cache and not loading, fetch fresh data
      console.log('[Market] No cache, triggering refresh...');
      refresh();
    }
  }, [hasPrefetchedData, storeLoading, refresh]);

  // Sync local state when store data changes (important for admin actions)
  useEffect(() => {
    if (storePostings.length > 0 || storeCaris.length > 0) {
      setPostings(storePostings);
      setCaris(storeCaris);
      setLoading(false);
    }
  }, [storePostings, storeCaris]);



  // Get unique games for filter
  const availableGames = useMemo(() => {
    const gameSet = new Set<string>();
    postings.forEach(p => p.game?.name && gameSet.add(p.game.name));
    caris.forEach(c => c.game?.name && gameSet.add(c.game.name));
    return Array.from(gameSet).sort();
  }, [postings, caris]);

  // Filtered data
  const filteredPostings = useMemo(() => {
    return postings.filter(posting => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery ||
        posting.owner_name?.toLowerCase().includes(searchLower) ||
        posting.game?.name?.toLowerCase().includes(searchLower) ||
        posting.code?.toLowerCase().includes(searchLower);

      const matchesGame = selectedGame === 'all' || posting.game?.name === selectedGame;

      return matchesSearch && matchesGame;
    });
  }, [postings, searchQuery, selectedGame]);

  const filteredCaris = useMemo(() => {
    return caris.filter(cari => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery ||
        cari.requester_name?.toLowerCase().includes(searchLower) ||
        cari.game?.name?.toLowerCase().includes(searchLower) ||
        cari.code?.toLowerCase().includes(searchLower);

      const matchesGame = selectedGame === 'all' || cari.game?.name === selectedGame;

      return matchesSearch && matchesGame;
    });
  }, [caris, searchQuery, selectedGame]);

  const handleViewDetail = (type: TabType, data: JasaPosting | JasaCari) => {
    setDetail({ isOpen: true, type, data });
    setCurrentPhotoIndex(0);
  };

  const getWhatsAppUrl = (code: string, type: 'posting' | 'cari') => {
    const message = type === 'cari'
      ? `Mau Nawarin Akun ${code}`
      : `Minat Beli Akun ${code}`;
    return `https://wa.me/6283136224221?text=${encodeURIComponent(message)}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-black pt-24 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400">
            Market
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Temukan akun game impian Anda atau tawarkan akun yang Anda miliki
          </p>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 border border-cyan-500/20 rounded-xl p-4 text-center">
            <ShoppingBag className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{postings.length}</p>
            <p className="text-xs text-slate-400">Akun Tersedia</p>
          </div>
          <div className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20 rounded-xl p-4 text-center">
            <Users className="w-6 h-6 text-purple-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{caris.length}</p>
            <p className="text-xs text-slate-400">Pencari Akun</p>
          </div>
          <div className="bg-gradient-to-br from-pink-500/10 to-pink-500/5 border border-pink-500/20 rounded-xl p-4 text-center">
            <Sparkles className="w-6 h-6 text-pink-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{availableGames.length}</p>
            <p className="text-xs text-slate-400">Game Tersedia</p>
          </div>
          <div className="bg-gradient-to-br from-lime-500/10 to-lime-500/5 border border-lime-500/20 rounded-xl p-4 text-center">
            <MessageSquare className="w-6 h-6 text-lime-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">24/7</p>
            <p className="text-xs text-slate-400">Support</p>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-slate-800/50 border border-cyan-500/20 rounded-xl p-4 mb-8 backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama, game, atau kode..."
                className="w-full pl-10 pr-4 py-3 bg-slate-900/80 border border-cyan-500/30 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="relative min-w-[180px]">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
              <select
                value={selectedGame}
                onChange={(e) => setSelectedGame(e.target.value)}
                className="w-full pl-10 pr-8 py-3 bg-slate-900/80 border border-cyan-500/30 rounded-xl text-white focus:outline-none focus:border-cyan-400 appearance-none cursor-pointer"
              >
                <option value="all">Semua Game</option>
                {availableGames.map(game => (
                  <option key={game} value={game}>{game}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 bg-slate-800/30 p-1.5 rounded-2xl border border-cyan-500/20">
          <button
            onClick={() => setActiveTab('posting')}
            className={`flex-1 px-6 py-3.5 font-semibold rounded-xl transition-all duration-300 ${activeTab === 'posting'
              ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/30'
              : 'text-slate-400 hover:text-cyan-300 hover:bg-slate-800/50'
              }`}
          >
            <span className="flex items-center justify-center gap-2">
              <ShoppingBag className="w-4 h-4" />
              Akun Dijual
              <span className={`px-2 py-0.5 text-xs rounded-full ${activeTab === 'posting' ? 'bg-white/20' : 'bg-cyan-500/20 text-cyan-300'
                }`}>
                {filteredPostings.length}
              </span>
            </span>
          </button>
          <button
            onClick={() => setActiveTab('cari')}
            className={`flex-1 px-6 py-3.5 font-semibold rounded-xl transition-all duration-300 ${activeTab === 'cari'
              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30'
              : 'text-slate-400 hover:text-purple-300 hover:bg-slate-800/50'
              }`}
          >
            <span className="flex items-center justify-center gap-2">
              <Users className="w-4 h-4" />
              Pencarian Akun
              <span className={`px-2 py-0.5 text-xs rounded-full ${activeTab === 'cari' ? 'bg-white/20' : 'bg-purple-500/20 text-purple-300'
                }`}>
                {filteredCaris.length}
              </span>
            </span>
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-20">
            <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-cyan-400 text-lg">Memuat data...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && activeTab === 'posting' && filteredPostings.length === 0 && (
          <div className="text-center py-20 bg-slate-800/30 rounded-2xl border border-cyan-500/10">
            <ShoppingBag className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 text-lg mb-2">Tidak ada akun yang cocok</p>
            <p className="text-slate-500 text-sm">Coba ubah kata kunci pencarian atau filter game</p>
          </div>
        )}

        {!loading && activeTab === 'cari' && filteredCaris.length === 0 && (
          <div className="text-center py-20 bg-slate-800/30 rounded-2xl border border-purple-500/10">
            <Users className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 text-lg mb-2">Tidak ada pencarian yang cocok</p>
            <p className="text-slate-500 text-sm">Coba ubah kata kunci pencarian atau filter game</p>
          </div>
        )}

        {/* Postings Grid */}
        {!loading && activeTab === 'posting' && filteredPostings.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredPostings.map((posting) => (
              <div
                key={posting.id}
                className="group bg-gradient-to-br from-slate-800/60 to-slate-900/60 border border-cyan-500/20 rounded-2xl overflow-hidden hover:border-cyan-400/50 hover:shadow-2xl hover:shadow-cyan-500/20 transition-all duration-500 hover:-translate-y-1"
              >
                {/* Image */}
                <div className="relative h-44 bg-slate-900 overflow-hidden">
                  {posting.photos && posting.photos.length > 0 ? (
                    <img
                      src={posting.photos[0]}
                      alt="Account"
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 bg-gradient-to-br from-slate-800 to-slate-900">
                      <ShoppingBag className="w-12 h-12 opacity-30" />
                    </div>
                  )}

                  {/* Photo count badge */}
                  {posting.photos && posting.photos.length > 1 && (
                    <div className="absolute top-3 right-3 px-2 py-1 bg-black/60 backdrop-blur-sm rounded-lg text-xs text-white">
                      📷 {posting.photos.length}
                    </div>
                  )}

                  {/* Safety badge */}
                  <div className={`absolute top-3 left-3 px-2 py-1 backdrop-blur-sm rounded-lg text-xs font-medium ${posting.is_safe
                    ? 'bg-green-500/80 text-white'
                    : 'bg-yellow-500/80 text-white'
                    }`}>
                    {posting.is_safe ? '✓ Aman' : '⚠ Kurang Aman'}
                  </div>

                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
                </div>

                {/* Content */}
                <div className="p-5 space-y-4">
                  {/* Game badge */}
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 bg-purple-500/20 border border-purple-500/30 rounded-lg text-xs text-purple-300 font-medium">
                      {posting.game?.name || 'Unknown Game'}
                    </span>
                  </div>

                  {/* Owner name */}
                  <p className="text-lg font-bold text-white truncate group-hover:text-cyan-300 transition-colors">
                    {posting.owner_name}
                  </p>

                  {/* Price */}
                  <div className="flex items-baseline justify-between">
                    <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-lime-400 to-green-400">
                      {formatCurrency(posting.price)}
                    </p>
                  </div>

                  {/* View button */}
                  <button
                    onClick={() => handleViewDetail('posting', posting)}
                    className="w-full px-4 py-3 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 border border-cyan-500/30 text-cyan-300 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 font-medium"
                  >
                    <Eye className="w-4 h-4" />
                    Lihat Detail
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Cari Grid */}
        {!loading && activeTab === 'cari' && filteredCaris.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCaris.map((cari) => (
              <div
                key={cari.id}
                className="group bg-gradient-to-br from-slate-800/60 to-slate-900/60 border border-purple-500/20 rounded-2xl overflow-hidden hover:border-purple-400/50 hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-500 hover:-translate-y-1 p-6 flex flex-col"
              >
                <div className="space-y-4 flex-1">
                  {/* Game badge */}
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 bg-cyan-500/20 border border-cyan-500/30 rounded-lg text-xs text-cyan-300 font-medium">
                      {cari.game?.name || 'Unknown Game'}
                    </span>
                  </div>

                  {/* Requester name */}
                  <p className="text-lg font-bold text-white truncate group-hover:text-purple-300 transition-colors">
                    {cari.requester_name}
                  </p>

                  {/* Price range */}
                  <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                    <p className="text-xs text-slate-400 mb-1">Kisaran Harga</p>
                    <p className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-lime-400 to-green-400">
                      {formatCurrency(cari.price_min)} - {formatCurrency(cari.price_max)}
                    </p>
                  </div>

                  {/* Spec */}
                  <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                    <p className="text-xs text-slate-400 mb-2">Spesifikasi Dicari</p>
                    <p className="text-sm text-slate-300 line-clamp-3">
                      {cari.account_spec}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleViewDetail('cari', cari)}
                  className="w-full mt-4 px-4 py-3 bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 border border-purple-500/30 text-purple-300 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 font-medium"
                >
                  <Eye className="w-4 h-4" />
                  Lihat Detail
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {detail.isOpen && detail.data && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div
            className="bg-gradient-to-br from-slate-900 via-slate-900 to-black border border-cyan-500/30 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl shadow-cyan-500/10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-slate-900/95 to-slate-900/95 backdrop-blur-xl border-b border-cyan-500/20 p-6 flex justify-between items-center z-10">
              <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
                Detail {detail.type === 'posting' ? 'Akun' : 'Pencarian'}
              </h2>
              <button
                onClick={() => setDetail({ ...detail, isOpen: false })}
                className="p-2 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-lg transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {detail.type === 'posting' && detail.data && 'owner_name' in detail.data && (
                <>
                  {/* Photos Carousel */}
                  {detail.data.photos && detail.data.photos.length > 0 && (
                    <div className="space-y-4">
                      <div className="relative bg-slate-800 rounded-xl overflow-hidden h-72 group/image">
                        <img
                          src={detail.data.photos[currentPhotoIndex]}
                          alt={`Photo ${currentPhotoIndex + 1}`}
                          className="w-full h-full object-cover cursor-pointer"
                          onClick={() => setPreviewPhoto((detail.data as JasaPosting).photos[currentPhotoIndex])}
                        />

                        {/* Preview Indicator */}
                        <div className="absolute top-3 right-3 opacity-0 group-hover/image:opacity-100 transition-opacity">
                          <button
                            onClick={() => setPreviewPhoto((detail.data as JasaPosting).photos[currentPhotoIndex])}
                            className="p-2 bg-black/60 hover:bg-black/80 rounded-lg text-white backdrop-blur-sm"
                          >
                            <Maximize2 className="w-5 h-5" />
                          </button>
                        </div>

                        {detail.data.photos.length > 1 && (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setCurrentPhotoIndex((prev) =>
                                  prev === 0 ? (detail.data as JasaPosting).photos.length - 1 : prev - 1
                                );
                              }}
                              className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-black/60 hover:bg-black/80 rounded-xl text-white backdrop-blur-sm transition-all"
                            >
                              <ChevronLeft className="w-5 h-5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setCurrentPhotoIndex((prev) =>
                                  prev === (detail.data as JasaPosting).photos.length - 1 ? 0 : prev + 1
                                );
                              }}
                              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-black/60 hover:bg-black/80 rounded-xl text-white backdrop-blur-sm transition-all"
                            >
                              <ChevronRight className="w-5 h-5" />
                            </button>
                            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
                              {(detail.data as JasaPosting).photos.map((_, idx) => (
                                <button
                                  key={idx}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setCurrentPhotoIndex(idx);
                                  }}
                                  className={`h-2 rounded-full transition-all ${idx === currentPhotoIndex
                                    ? 'w-8 bg-cyan-400'
                                    : 'w-2 bg-white/50 hover:bg-white/70'
                                    }`}
                                />
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Details */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-800/50 rounded-xl p-4 border border-cyan-500/10">
                      <p className="text-xs text-slate-500 mb-1">Pemilik Akun</p>
                      <p className="text-cyan-300 font-semibold">{detail.data.owner_name}</p>
                    </div>
                    <div className="bg-slate-800/50 rounded-xl p-4 border border-cyan-500/10">
                      <p className="text-xs text-slate-500 mb-1">Game</p>
                      <p className="text-cyan-300 font-semibold">{detail.data.game?.name}</p>
                    </div>
                    <div className="bg-slate-800/50 rounded-xl p-4 border border-cyan-500/10">
                      <p className="text-xs text-slate-500 mb-1">Kode</p>
                      <p className="text-purple-300 font-mono font-bold">{detail.data.code}</p>
                    </div>
                    <div className="bg-slate-800/50 rounded-xl p-4 border border-cyan-500/10">
                      <p className="text-xs text-slate-500 mb-1">Harga</p>
                      <p className="text-lime-400 font-bold text-lg">{formatCurrency(detail.data.price)}</p>
                    </div>
                    <div className="col-span-2 bg-slate-800/50 rounded-xl p-4 border border-cyan-500/10">
                      <p className="text-xs text-slate-500 mb-1">Status Keamanan</p>
                      <p className={`font-semibold ${detail.data.is_safe ? 'text-green-400' : 'text-yellow-400'}`}>
                        {detail.data.is_safe ? '✓ Data Aman (Allkos, Gmail tidak lengket)' : '⚠ Data Kurang Aman (Lengket, Bind hilang)'}
                      </p>
                    </div>
                    {detail.data.additional_spec && (
                      <div className="col-span-2 bg-slate-800/50 rounded-xl p-4 border border-cyan-500/10">
                        <p className="text-xs text-slate-500 mb-1">Spesifikasi Tambahan</p>
                        <p className="text-slate-300">{detail.data.additional_spec}</p>
                      </div>
                    )}
                  </div>

                  {/* CTA Button */}
                  <a
                    href={getWhatsAppUrl(detail.data.code, 'posting')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-3 shadow-lg shadow-green-500/30 hover:shadow-green-500/50"
                  >
                    <MessageSquare className="w-5 h-5" />
                    Minat Beli Hubungi via WhatsApp
                  </a>
                </>
              )}

              {detail.type === 'cari' && detail.data && 'requester_name' in detail.data && (
                <>
                  {/* Details */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-800/50 rounded-xl p-4 border border-purple-500/10">
                      <p className="text-xs text-slate-500 mb-1">Nama Pencari</p>
                      <p className="text-purple-300 font-semibold">{detail.data.requester_name}</p>
                    </div>
                    <div className="bg-slate-800/50 rounded-xl p-4 border border-purple-500/10">
                      <p className="text-xs text-slate-500 mb-1">Game</p>
                      <p className="text-purple-300 font-semibold">{detail.data.game?.name}</p>
                    </div>
                    <div className="bg-slate-800/50 rounded-xl p-4 border border-purple-500/10">
                      <p className="text-xs text-slate-500 mb-1">Kode</p>
                      <p className="text-purple-300 font-mono font-bold">{detail.data.code}</p>
                    </div>
                    <div className="bg-slate-800/50 rounded-xl p-4 border border-purple-500/10">
                      <p className="text-xs text-slate-500 mb-1">Kisaran Harga</p>
                      <p className="text-lime-400 font-bold">
                        {formatCurrency(detail.data.price_min)} - {formatCurrency(detail.data.price_max)}
                      </p>
                    </div>
                    <div className="col-span-2 bg-slate-800/50 rounded-xl p-4 border border-purple-500/10">
                      <p className="text-xs text-slate-500 mb-2">Spesifikasi yang Dicari</p>
                      <p className="text-slate-300">{detail.data.account_spec}</p>
                    </div>
                  </div>

                  {/* CTA Button */}
                  <a
                    href={getWhatsAppUrl(detail.data.code, 'cari')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-3 shadow-lg shadow-green-500/30 hover:shadow-green-500/50"
                  >
                    <MessageSquare className="w-5 h-5" />
                    Tawarkan Akun via WhatsApp
                  </a>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Photo Preview */}
      {previewPhoto && (
        <div
          onClick={() => setPreviewPhoto(null)}
          className="fixed inset-0 bg-black/95 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div
            className="relative max-w-7xl w-full max-h-screen flex items-center justify-center animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={previewPhoto}
              alt="Fullscreen Preview"
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
            />
            <button
              onClick={() => setPreviewPhoto(null)}
              className="absolute top-4 right-4 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all backdrop-blur-md"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
