import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { JasaPosting, JasaCari } from '../types';
import { formatCurrency } from '../utils/validation';
import { Eye, MessageSquare, ChevronLeft, ChevronRight } from 'lucide-react';

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

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [postingRes, cariRes] = await Promise.all([
        supabase
          .from('jasa_posting')
          .select('*, game:games(*)')
          .eq('is_approved', true)
          .order('created_at', { ascending: false }),
        supabase
          .from('jasa_cari')
          .select('*, game:games(*)')
          .eq('is_approved', true)
          .order('created_at', { ascending: false }),
      ]);

      if (postingRes.error) throw postingRes.error;
      if (cariRes.error) throw cariRes.error;

      setPostings(postingRes.data || []);
      setCaris(cariRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = (type: TabType, data: JasaPosting | JasaCari) => {
    setDetail({ isOpen: true, type, data });
    setCurrentPhotoIndex(0);
  };

  const getWhatsAppUrl = (code: string) => {
    const message = `Minat+${code}`;
    return `https://wa.me/6283136224221?text=${message}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-black pt-24 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-12 text-center text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
          Market
        </h1>

        {/* Tabs */}
        <div className="flex gap-4 mb-12 border-b border-cyan-500/20">
          <button
            onClick={() => setActiveTab('posting')}
            className={`px-6 py-3 font-semibold transition-all duration-200 border-b-2 ${
              activeTab === 'posting'
                ? 'text-cyan-400 border-cyan-400'
                : 'text-slate-400 border-transparent hover:text-cyan-300'
            }`}
          >
            Akun Yang Diposting ({postings.length})
          </button>
          <button
            onClick={() => setActiveTab('cari')}
            className={`px-6 py-3 font-semibold transition-all duration-200 border-b-2 ${
              activeTab === 'cari'
                ? 'text-cyan-400 border-cyan-400'
                : 'text-slate-400 border-transparent hover:text-cyan-300'
            }`}
          >
            Orang Yang Cari Akun ({caris.length})
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-20">
            <p className="text-cyan-400 text-lg">Loading...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && activeTab === 'posting' && postings.length === 0 && (
          <div className="text-center py-20">
            <p className="text-slate-400 text-lg">Belum ada akun yang diposting</p>
          </div>
        )}

        {!loading && activeTab === 'cari' && caris.length === 0 && (
          <div className="text-center py-20">
            <p className="text-slate-400 text-lg">Belum ada yang mencari akun</p>
          </div>
        )}

        {/* Postings Grid */}
        {!loading && activeTab === 'posting' && postings.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {postings.map((posting) => (
              <div
                key={posting.id}
                className="group bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-cyan-500/30 rounded-lg overflow-hidden hover:border-cyan-400 hover:shadow-2xl hover:shadow-cyan-500/20 transition-all duration-300"
              >
                {/* Image */}
                <div className="relative h-40 bg-slate-900 overflow-hidden">
                  {posting.photos && posting.photos.length > 0 ? (
                    <img
                      src={posting.photos[0]}
                      alt="Account"
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                      No Image
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                  <div>
                    <p className="text-xs text-purple-400 font-semibold mb-1">
                      {posting.game?.name || 'Unknown Game'}
                    </p>
                    <p className="text-lg font-bold text-cyan-300 truncate">
                      {posting.owner_name}
                    </p>
                  </div>

                  <div className="flex items-baseline justify-between">
                    <p className="text-2xl font-bold text-lime-400">
                      {formatCurrency(posting.price)}
                    </p>
                    <p className="text-xs px-2 py-1 bg-cyan-500/20 border border-cyan-500/50 rounded text-cyan-300">
                      {posting.is_safe ? '✓ Aman' : '⚠ Kurang Aman'}
                    </p>
                  </div>

                  <button
                    onClick={() => handleViewDetail('posting', posting)}
                    className="w-full px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/50 text-cyan-300 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
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
        {!loading && activeTab === 'cari' && caris.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {caris.map((cari) => (
              <div
                key={cari.id}
                className="group bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-purple-500/30 rounded-lg overflow-hidden hover:border-purple-400 hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-300 p-6 flex flex-col"
              >
                <div className="space-y-4 flex-1">
                  <div>
                    <p className="text-xs text-cyan-400 font-semibold mb-1">
                      {cari.game?.name || 'Unknown Game'}
                    </p>
                    <p className="text-lg font-bold text-purple-300 truncate">
                      {cari.requester_name}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-slate-400 mb-1">Kisaran Harga:</p>
                    <p className="text-2xl font-bold text-lime-400">
                      {formatCurrency(cari.price_min)} - {formatCurrency(cari.price_max)}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-slate-400 mb-2">Spesifikasi Dicari:</p>
                    <p className="text-sm text-slate-300 line-clamp-3">
                      {cari.account_spec}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleViewDetail('cari', cari)}
                  className="w-full mt-4 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/50 text-purple-300 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
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
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-slate-900 to-black border border-cyan-500/30 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border-b border-cyan-500/30 p-6 flex justify-between items-center z-10">
              <h2 className="text-2xl font-bold text-cyan-400">Detail</h2>
              <button
                onClick={() => setDetail({ ...detail, isOpen: false })}
                className="text-slate-400 hover:text-red-400 text-2xl font-bold"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {detail.type === 'posting' && detail.data && 'owner_name' in detail.data && (
                <>
                  {/* Photos Carousel */}
                  {detail.data.photos && detail.data.photos.length > 0 && (
                    <div className="space-y-4">
                      <div className="relative bg-slate-800 rounded-lg overflow-hidden h-64">
                        <img
                          src={detail.data.photos[currentPhotoIndex]}
                          alt={`Photo ${currentPhotoIndex + 1}`}
                          className="w-full h-full object-cover"
                        />

                        {detail.data.photos.length > 1 && (
                          <>
                            <button
                              onClick={() =>
                                setCurrentPhotoIndex((prev) =>
                                  prev === 0 ? detail.data.photos.length - 1 : prev - 1
                                )
                              }
                              className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 rounded-lg text-white"
                            >
                              <ChevronLeft className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() =>
                                setCurrentPhotoIndex((prev) =>
                                  prev === detail.data.photos.length - 1 ? 0 : prev + 1
                                )
                              }
                              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 rounded-lg text-white"
                            >
                              <ChevronRight className="w-5 h-5" />
                            </button>
                            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                              {detail.data.photos.map((_, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => setCurrentPhotoIndex(idx)}
                                  className={`h-2 rounded-full transition-all ${
                                    idx === currentPhotoIndex
                                      ? 'w-6 bg-cyan-400'
                                      : 'w-2 bg-cyan-400/50'
                                  }`}
                                />
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                      <p className="text-sm text-slate-400 text-center">
                        {currentPhotoIndex + 1} / {detail.data.photos.length}
                      </p>
                    </div>
                  )}

                  {/* Details */}
                  <div className="space-y-3 bg-slate-800/30 border border-cyan-500/20 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <span className="text-slate-400">Pemilik Akun:</span>
                      <span className="text-cyan-300 font-semibold">{detail.data.owner_name}</span>
                    </div>
                    <div className="flex justify-between items-start">
                      <span className="text-slate-400">Game:</span>
                      <span className="text-cyan-300 font-semibold">
                        {detail.data.game?.name}
                      </span>
                    </div>
                    <div className="flex justify-between items-start">
                      <span className="text-slate-400">Kode:</span>
                      <span className="text-purple-300 font-mono font-bold">{detail.data.code}</span>
                    </div>
                    <div className="flex justify-between items-start">
                      <span className="text-slate-400">Harga:</span>
                      <span className="text-lime-400 font-bold">
                        {formatCurrency(detail.data.price)}
                      </span>
                    </div>
                    <div className="flex justify-between items-start">
                      <span className="text-slate-400">Status:</span>
                      <span className={`font-semibold ${
                        detail.data.is_safe ? 'text-green-400' : 'text-yellow-400'
                      }`}>
                        {detail.data.is_safe ? '✓ Data Aman' : '⚠ Data Kurang Aman'}
                      </span>
                    </div>
                    {detail.data.additional_spec && (
                      <div className="flex justify-between items-start">
                        <span className="text-slate-400">Spesifikasi:</span>
                        <span className="text-cyan-300 text-right max-w-xs">
                          {detail.data.additional_spec}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* CTA Button */}
                  <a
                    href={getWhatsAppUrl(detail.data.code)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white font-bold rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <MessageSquare className="w-5 h-5" />
                    Minat Membeli Akun
                  </a>
                </>
              )}

              {detail.type === 'cari' && detail.data && 'requester_name' in detail.data && (
                <>
                  {/* Details */}
                  <div className="space-y-3 bg-slate-800/30 border border-purple-500/20 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <span className="text-slate-400">Nama Pencari:</span>
                      <span className="text-purple-300 font-semibold">
                        {detail.data.requester_name}
                      </span>
                    </div>
                    <div className="flex justify-between items-start">
                      <span className="text-slate-400">Game:</span>
                      <span className="text-purple-300 font-semibold">
                        {detail.data.game?.name}
                      </span>
                    </div>
                    <div className="flex justify-between items-start">
                      <span className="text-slate-400">Kode:</span>
                      <span className="text-purple-300 font-mono font-bold">{detail.data.code}</span>
                    </div>
                    <div className="flex justify-between items-start">
                      <span className="text-slate-400">Kisaran Harga:</span>
                      <span className="text-lime-400 font-bold text-right">
                        {formatCurrency(detail.data.price_min)} -<br/>
                        {formatCurrency(detail.data.price_max)}
                      </span>
                    </div>
                    <div className="flex justify-between items-start">
                      <span className="text-slate-400">Spesifikasi:</span>
                      <span className="text-purple-300 text-right max-w-xs">
                        {detail.data.account_spec}
                      </span>
                    </div>
                  </div>

                  {/* CTA Button */}
                  <a
                    href={getWhatsAppUrl(detail.data.code)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white font-bold rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <MessageSquare className="w-5 h-5" />
                    Mau Menawarkan Akun
                  </a>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
