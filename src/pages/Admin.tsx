import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { JasaPosting, JasaCari } from '../types';
import { formatCurrency } from '../utils/validation';
import { Check, X, Trash2, MessageSquare } from 'lucide-react';

type TabType = 'posting' | 'cari';

export function Admin() {
  const { user, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('posting');
  const [postings, setPostings] = useState<JasaPosting[]>([]);
  const [caris, setCaris] = useState<JasaCari[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin) return;
    fetchData();

    const subscription = supabase
      .channel('admin_updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'jasa_posting' },
        fetchData
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'jasa_cari' },
        fetchData
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [isAdmin]);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [postingRes, cariRes] = await Promise.all([
        supabase
          .from('jasa_posting')
          .select('*, game:games(*)')
          .order('created_at', { ascending: false }),
        supabase
          .from('jasa_cari')
          .select('*, game:games(*)')
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

  const handleApprove = async (table: 'jasa_posting' | 'jasa_cari', id: string) => {
    try {
      const { error } = await supabase
        .from(table)
        .update({ is_approved: true })
        .eq('id', id);

      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error('Error approving:', error);
    }
  };

  const handleReject = async (table: 'jasa_posting' | 'jasa_cari', id: string) => {
    try {
      const { error } = await supabase
        .from(table)
        .update({ is_approved: false })
        .eq('id', id);

      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error('Error rejecting:', error);
    }
  };

  const handleDelete = async (table: 'jasa_posting' | 'jasa_cari', id: string) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus data ini?')) return;

    try {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error('Error deleting:', error);
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 to-black pt-24 pb-20 px-4 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-400 mb-4">Akses Ditolak</h2>
          <p className="text-slate-300">Anda tidak memiliki akses ke halaman admin</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-black pt-24 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-12 text-center text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
          Admin - Posting Management
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
            Jasa Posting ({postings.length})
          </button>
          <button
            onClick={() => setActiveTab('cari')}
            className={`px-6 py-3 font-semibold transition-all duration-200 border-b-2 ${
              activeTab === 'cari'
                ? 'text-cyan-400 border-cyan-400'
                : 'text-slate-400 border-transparent hover:text-cyan-300'
            }`}
          >
            Jasa Cari ({caris.length})
          </button>
        </div>

        {/* Loading */}
        {loading && <p className="text-cyan-400 text-center py-10">Loading...</p>}

        {/* Postings */}
        {!loading && activeTab === 'posting' && (
          <div className="space-y-4">
            {postings.length === 0 ? (
              <p className="text-slate-400 text-center py-10">Tidak ada data</p>
            ) : (
              postings.map((posting) => (
                <div
                  key={posting.id}
                  className={`border rounded-lg p-6 backdrop-blur-sm ${
                    posting.is_approved
                      ? 'bg-slate-800/30 border-green-500/30'
                      : 'bg-slate-800/50 border-cyan-500/30'
                  }`}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Pemilik</p>
                      <p className="text-cyan-300 font-semibold">{posting.owner_name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Game</p>
                      <p className="text-cyan-300 font-semibold">{posting.game?.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Kode</p>
                      <p className="text-purple-300 font-mono font-bold">{posting.code}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Harga</p>
                      <p className="text-lime-400 font-bold">{formatCurrency(posting.price)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-1">WhatsApp</p>
                      <a
                        href={`https://wa.me/${posting.phone_number}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-400 hover:text-green-300 font-medium flex items-center gap-1"
                      >
                        <MessageSquare className="w-4 h-4" />
                        {posting.phone_number}
                      </a>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Status</p>
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs font-bold ${
                          posting.is_approved
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-yellow-500/20 text-yellow-400'
                        }`}
                      >
                        {posting.is_approved ? '✓ Disetujui' : '⏳ Pending'}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Keamanan</p>
                      <span className={`text-sm font-semibold ${
                        posting.is_safe ? 'text-green-400' : 'text-yellow-400'
                      }`}>
                        {posting.is_safe ? '✓ Aman' : '⚠ Kurang Aman'}
                      </span>
                    </div>
                  </div>

                  {posting.photos && posting.photos.length > 0 && (
                    <div className="mb-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      {posting.photos.map((photo, idx) => (
                        <img
                          key={idx}
                          src={photo}
                          alt={`Photo ${idx + 1}`}
                          className="w-full h-20 object-cover rounded border border-cyan-500/20"
                        />
                      ))}
                    </div>
                  )}

                  {posting.additional_spec && (
                    <div className="mb-4 p-3 bg-slate-900/50 rounded border border-slate-700">
                      <p className="text-xs text-slate-400 mb-1">Spesifikasi</p>
                      <p className="text-slate-300 text-sm">{posting.additional_spec}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2">
                    {!posting.is_approved && (
                      <button
                        onClick={() => handleApprove('jasa_posting', posting.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500/50 text-green-400 rounded-lg transition-colors"
                      >
                        <Check className="w-4 h-4" />
                        Setujui
                      </button>
                    )}
                    {posting.is_approved && (
                      <button
                        onClick={() => handleReject('jasa_posting', posting.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/50 text-yellow-400 rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4" />
                        Tolak
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete('jasa_posting', posting.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-400 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Hapus
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Caris */}
        {!loading && activeTab === 'cari' && (
          <div className="space-y-4">
            {caris.length === 0 ? (
              <p className="text-slate-400 text-center py-10">Tidak ada data</p>
            ) : (
              caris.map((cari) => (
                <div
                  key={cari.id}
                  className={`border rounded-lg p-6 backdrop-blur-sm ${
                    cari.is_approved
                      ? 'bg-slate-800/30 border-green-500/30'
                      : 'bg-slate-800/50 border-purple-500/30'
                  }`}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Pencari</p>
                      <p className="text-purple-300 font-semibold">{cari.requester_name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Game</p>
                      <p className="text-purple-300 font-semibold">{cari.game?.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Kode</p>
                      <p className="text-purple-300 font-mono font-bold">{cari.code}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Harga</p>
                      <p className="text-lime-400 font-bold">
                        {formatCurrency(cari.price_min)} - {formatCurrency(cari.price_max)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-1">WhatsApp</p>
                      <a
                        href={`https://wa.me/${cari.phone_number}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-400 hover:text-green-300 font-medium flex items-center gap-1"
                      >
                        <MessageSquare className="w-4 h-4" />
                        {cari.phone_number}
                      </a>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Status</p>
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs font-bold ${
                          cari.is_approved
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-yellow-500/20 text-yellow-400'
                        }`}
                      >
                        {cari.is_approved ? '✓ Disetujui' : '⏳ Pending'}
                      </span>
                    </div>
                  </div>

                  <div className="mb-4 p-3 bg-slate-900/50 rounded border border-slate-700">
                    <p className="text-xs text-slate-400 mb-1">Spesifikasi Dicari</p>
                    <p className="text-slate-300 text-sm">{cari.account_spec}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2">
                    {!cari.is_approved && (
                      <button
                        onClick={() => handleApprove('jasa_cari', cari.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500/50 text-green-400 rounded-lg transition-colors"
                      >
                        <Check className="w-4 h-4" />
                        Setujui
                      </button>
                    )}
                    {cari.is_approved && (
                      <button
                        onClick={() => handleReject('jasa_cari', cari.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/50 text-yellow-400 rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4" />
                        Tolak
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete('jasa_cari', cari.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-400 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Hapus
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
