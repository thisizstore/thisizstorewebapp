import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
// import { JasaPosting, JasaCari } from '../types'; // Removing unused types
import { formatCurrency } from '../utils/validation';
import { Check, X, Trash2, MessageSquare, Search, Filter, Clock, CheckCircle, XCircle, BarChart3, RefreshCw, AlertTriangle } from 'lucide-react';
import { useAdminDataStore, refreshMarketData } from '../hooks/useDataStore';

type TabType = 'posting' | 'cari';
type FilterStatus = 'all' | 'pending' | 'approved' | 'rejected';

// Inline ConfirmModal component
interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  type?: 'danger' | 'warning' | 'success';
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
}

function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = 'danger',
  confirmText = 'Konfirmasi',
  cancelText = 'Batal',
  loading = false,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const typeStyles = {
    danger: {
      icon: Trash2,
      iconBg: 'bg-red-500/20',
      iconColor: 'text-red-400',
      confirmBg: 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-400 hover:to-red-500',
      confirmShadow: 'shadow-red-500/30 hover:shadow-red-500/50',
      borderColor: 'border-red-500/30',
      glowColor: 'shadow-red-500/20',
    },
    warning: {
      icon: AlertTriangle,
      iconBg: 'bg-yellow-500/20',
      iconColor: 'text-yellow-400',
      confirmBg: 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400',
      confirmShadow: 'shadow-yellow-500/30 hover:shadow-yellow-500/50',
      borderColor: 'border-yellow-500/30',
      glowColor: 'shadow-yellow-500/20',
    },
    success: {
      icon: Check,
      iconBg: 'bg-green-500/20',
      iconColor: 'text-green-400',
      confirmBg: 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400',
      confirmShadow: 'shadow-green-500/30 hover:shadow-green-500/50',
      borderColor: 'border-green-500/30',
      glowColor: 'shadow-green-500/20',
    },
  };

  const styles = typeStyles[type];
  const Icon = styles.icon;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={!loading ? onClose : undefined}
      />

      {/* Modal */}
      <div className={`relative bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border ${styles.borderColor} rounded-2xl shadow-2xl ${styles.glowColor} w-full max-w-md animate-in fade-in zoom-in duration-200`}>
        {/* Header */}
        <div className="relative p-6 pb-0">
          {/* Close button */}
          <button
            onClick={onClose}
            disabled={loading}
            className="absolute top-4 right-4 p-2 hover:bg-slate-800/50 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-slate-400 hover:text-white" />
          </button>

          {/* Icon */}
          <div className="flex justify-center mb-4">
            <div className={`p-4 ${styles.iconBg} rounded-2xl`}>
              <Icon className={`w-10 h-10 ${styles.iconColor}`} />
            </div>
          </div>

          {/* Title */}
          <h3 className="text-xl font-bold text-white text-center mb-2">
            {title}
          </h3>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          <p className="text-slate-300 text-center leading-relaxed">
            {message}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-6 pt-2">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-3 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-600/50 text-slate-300 hover:text-white rounded-xl transition-all duration-200 font-medium disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 px-4 py-3 ${styles.confirmBg} text-white rounded-xl transition-all duration-300 font-medium shadow-lg ${styles.confirmShadow} flex items-center justify-center gap-2 disabled:opacity-70`}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Memproses...
              </>
            ) : (
              <>
                <Icon className="w-4 h-4" />
                {confirmText}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}


export function Admin() {
  const { isAdmin, loading: authLoading } = useAuth();
  // Use data directly from store (initialized from cache)
  const { postings, caris, loading, refresh } = useAdminDataStore();

  // Initialize state
  const [activeTab, setActiveTab] = useState<TabType>('posting');
  // const [postings, setPostings] removed - used from store
  // const [caris, setCaris] removed - used from store
  // const [loading, setLoading] removed - used from store
  const [refreshing, setRefreshing] = useState(false);

  // Search and Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');

  // Delete confirmation modal state
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    table: 'jasa_posting' | 'jasa_cari';
    id: string;
    itemName: string;
  }>({ isOpen: false, table: 'jasa_posting', id: '', itemName: '' });
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Action loading state - track which item is being processed
  const [actionLoading, setActionLoading] = useState<{ id: string; action: 'approve' | 'reject' } | null>(null);

  // Initial fetch logic
  useEffect(() => {
    if (authLoading || !isAdmin) return;

    // Refresh if store is empty
    if (postings.length === 0 && caris.length === 0) {
      refresh();
    }

    // Subscribe to changes
    const subscription = supabase
      .channel('admin_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'jasa_posting' }, () => refresh())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'jasa_cari' }, () => refresh())
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [authLoading, isAdmin, refresh, postings.length, caris.length]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  // Filtered data based on search and filter
  const filteredPostings = useMemo(() => {
    return postings.filter(posting => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery ||
        posting.code?.toLowerCase().includes(searchLower) ||
        posting.owner_name?.toLowerCase().includes(searchLower) ||
        posting.game?.name?.toLowerCase().includes(searchLower) ||
        posting.phone_number?.includes(searchQuery);

      // Status filter
      let matchesStatus = true;
      if (filterStatus === 'pending') matchesStatus = !posting.is_approved;
      else if (filterStatus === 'approved') matchesStatus = posting.is_approved;

      return matchesSearch && matchesStatus;
    });
  }, [postings, searchQuery, filterStatus]);

  const filteredCaris = useMemo(() => {
    return caris.filter(cari => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery ||
        cari.code?.toLowerCase().includes(searchLower) ||
        cari.requester_name?.toLowerCase().includes(searchLower) ||
        cari.game?.name?.toLowerCase().includes(searchLower) ||
        cari.phone_number?.includes(searchQuery);

      // Status filter
      let matchesStatus = true;
      if (filterStatus === 'pending') matchesStatus = !cari.is_approved;
      else if (filterStatus === 'approved') matchesStatus = cari.is_approved;

      return matchesSearch && matchesStatus;
    });
  }, [caris, searchQuery, filterStatus]);

  // Statistics
  const stats = useMemo(() => {
    const postingPending = postings.filter(p => !p.is_approved).length;
    const postingApproved = postings.filter(p => p.is_approved).length;
    const cariPending = caris.filter(c => !c.is_approved).length;
    const cariApproved = caris.filter(c => c.is_approved).length;

    return {
      totalPosting: postings.length,
      postingPending,
      postingApproved,
      totalCari: caris.length,
      cariPending,
      cariApproved,
      totalPending: postingPending + cariPending,
      totalApproved: postingApproved + cariApproved,
    };
  }, [postings, caris]);

  const handleApprove = async (table: 'jasa_posting' | 'jasa_cari', id: string) => {
    setActionLoading({ id, action: 'approve' });
    try {
      const { error } = await supabase
        .from(table)
        .update({ is_approved: true })
        .eq('id', id);

      if (error) throw error;
      await refresh();
      // Sync Market cache so approved items appear in Market page
      refreshMarketData();
    } catch (error) {
      console.error('Error approving:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (table: 'jasa_posting' | 'jasa_cari', id: string) => {
    setActionLoading({ id, action: 'reject' });
    try {
      const { error } = await supabase
        .from(table)
        .update({ is_approved: false })
        .eq('id', id);

      if (error) throw error;
      await refresh();
      // Sync Market cache so rejected items are removed from Market page
      refreshMarketData();
    } catch (error) {
      console.error('Error rejecting:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const openDeleteModal = (table: 'jasa_posting' | 'jasa_cari', id: string, itemName: string) => {
    setDeleteModal({ isOpen: true, table, id, itemName });
  };

  const closeDeleteModal = () => {
    setDeleteModal({ isOpen: false, table: 'jasa_posting', id: '', itemName: '' });
  };

  const handleDelete = async () => {
    if (!deleteModal.id) return;

    setDeleteLoading(true);
    try {
      const { error } = await supabase
        .from(deleteModal.table)
        .delete()
        .eq('id', deleteModal.id);

      if (error) throw error;
      refresh();
      // Sync Market cache so deleted items are removed from Market page
      refreshMarketData();
      closeDeleteModal();
    } catch (error) {
      console.error('Error deleting:', error);
    } finally {
      setDeleteLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 to-black pt-24 pb-20 px-4 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-cyan-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 to-black pt-24 pb-20 px-4 flex items-center justify-center">
        <div className="text-center bg-slate-900/50 border border-red-500/30 rounded-xl p-8 max-w-md">
          <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-red-400 mb-2">Akses Ditolak</h2>
          <p className="text-slate-300">Anda tidak memiliki akses ke halaman admin</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-black pt-24 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
              Admin Dashboard
            </h1>
            <p className="text-slate-400 mt-1">Kelola posting dan permintaan pencarian akun</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="mt-4 md:mt-0 flex items-center gap-2 px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/50 text-cyan-300 rounded-lg transition-all duration-200"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-slate-800/70 to-slate-900/70 border border-cyan-500/20 rounded-xl p-4 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cyan-500/20 rounded-lg">
                <BarChart3 className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.totalPosting + stats.totalCari}</p>
                <p className="text-xs text-slate-400">Total Data</p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-slate-800/70 to-slate-900/70 border border-yellow-500/20 rounded-xl p-4 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-500/20 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.totalPending}</p>
                <p className="text-xs text-slate-400">Pending</p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-slate-800/70 to-slate-900/70 border border-green-500/20 rounded-xl p-4 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.totalApproved}</p>
                <p className="text-xs text-slate-400">Disetujui</p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-slate-800/70 to-slate-900/70 border border-purple-500/20 rounded-xl p-4 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <BarChart3 className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.totalPosting}</p>
                <p className="text-xs text-slate-400">Posting</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-slate-800/50 border border-cyan-500/20 rounded-xl p-4 mb-6 backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari kode, nama, game, atau nomor telepon..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-cyan-500/30 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/20 transition-colors"
              />
            </div>

            {/* Filter Dropdown */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
                className="pl-10 pr-8 py-2.5 bg-slate-900/80 border border-cyan-500/30 rounded-lg text-white focus:outline-none focus:border-cyan-400 appearance-none cursor-pointer min-w-[160px]"
              >
                <option value="all">Semua Status</option>
                <option value="pending">⏳ Pending</option>
                <option value="approved">✓ Disetujui</option>
              </select>
            </div>
          </div>

          {/* Active filters indicator */}
          {(searchQuery || filterStatus !== 'all') && (
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-700">
              <span className="text-xs text-slate-400">Filter aktif:</span>
              {searchQuery && (
                <span className="px-2 py-1 bg-cyan-500/20 text-cyan-300 text-xs rounded-full flex items-center gap-1">
                  "{searchQuery}"
                  <button onClick={() => setSearchQuery('')} className="hover:text-white">×</button>
                </span>
              )}
              {filterStatus !== 'all' && (
                <span className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-full flex items-center gap-1">
                  {filterStatus === 'pending' ? '⏳ Pending' : '✓ Disetujui'}
                  <button onClick={() => setFilterStatus('all')} className="hover:text-white">×</button>
                </span>
              )}
              <button
                onClick={() => { setSearchQuery(''); setFilterStatus('all'); }}
                className="text-xs text-slate-400 hover:text-cyan-400 ml-auto"
              >
                Reset semua
              </button>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 bg-slate-800/30 p-1 rounded-xl border border-cyan-500/20">
          <button
            onClick={() => setActiveTab('posting')}
            className={`flex-1 px-6 py-3 font-semibold rounded-lg transition-all duration-300 ${activeTab === 'posting'
              ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 text-white shadow-lg shadow-cyan-500/30'
              : 'text-slate-400 hover:text-cyan-300 hover:bg-slate-800/50'
              }`}
          >
            <span className="flex items-center justify-center gap-2">
              Jasa Posting
              <span className={`px-2 py-0.5 text-xs rounded-full ${activeTab === 'posting' ? 'bg-white/20' : 'bg-cyan-500/20 text-cyan-300'
                }`}>
                {filteredPostings.length}
              </span>
            </span>
          </button>
          <button
            onClick={() => setActiveTab('cari')}
            className={`flex-1 px-6 py-3 font-semibold rounded-lg transition-all duration-300 ${activeTab === 'cari'
              ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-500/30'
              : 'text-slate-400 hover:text-purple-300 hover:bg-slate-800/50'
              }`}
          >
            <span className="flex items-center justify-center gap-2">
              Jasa Cari
              <span className={`px-2 py-0.5 text-xs rounded-full ${activeTab === 'cari' ? 'bg-white/20' : 'bg-purple-500/20 text-purple-300'
                }`}>
                {filteredCaris.length}
              </span>
            </span>
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-20">
            <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-cyan-400">Loading data...</p>
          </div>
        )}

        {/* Postings */}
        {!loading && activeTab === 'posting' && (
          <div className="space-y-4">
            {filteredPostings.length === 0 ? (
              <div className="text-center py-20 bg-slate-800/30 rounded-xl border border-cyan-500/10">
                <Search className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400 text-lg">Tidak ada data yang cocok</p>
                <p className="text-slate-500 text-sm mt-1">Coba ubah kata kunci pencarian atau filter</p>
              </div>
            ) : (
              filteredPostings.map((posting) => (
                <div
                  key={posting.id}
                  className={`border rounded-xl p-4 backdrop-blur-sm transition-all duration-300 hover:shadow-lg ${posting.is_approved
                    ? 'bg-gradient-to-r from-green-900/20 to-slate-900/50 border-green-500/30 hover:border-green-400/50 hover:shadow-green-500/10'
                    : 'bg-gradient-to-r from-yellow-900/10 to-slate-900/50 border-yellow-500/30 hover:border-yellow-400/50 hover:shadow-yellow-500/10'
                    }`}
                >
                  {/* Status Badge */}
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${posting.is_approved
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                        }`}
                    >
                      {posting.is_approved ? (
                        <><CheckCircle className="w-3 h-3" /> Disetujui</>
                      ) : (
                        <><Clock className="w-3 h-3" /> Pending</>
                      )}
                    </span>
                    <span className="text-xs text-slate-500">
                      {new Date(posting.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 mb-3">
                    <div className="bg-slate-800/50 rounded-lg p-2">
                      <p className="text-xs text-slate-500">Kode</p>
                      <p className="text-purple-300 font-mono font-bold text-xs truncate">{posting.code}</p>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-2">
                      <p className="text-xs text-slate-500">Pemilik</p>
                      <p className="text-cyan-300 font-semibold text-xs truncate">{posting.owner_name}</p>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-2">
                      <p className="text-xs text-slate-500">Game</p>
                      <p className="text-cyan-300 font-semibold text-xs truncate">{posting.game?.name}</p>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-2">
                      <p className="text-xs text-slate-500">Harga</p>
                      <p className="text-lime-400 font-bold text-xs">{formatCurrency(posting.price)}</p>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-2">
                      <p className="text-xs text-slate-500">WhatsApp</p>
                      <a
                        href={`https://wa.me/${posting.phone_number}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-400 hover:text-green-300 font-medium flex items-center gap-1 text-xs"
                      >
                        <MessageSquare className="w-3 h-3" />
                        <span className="truncate">{posting.phone_number}</span>
                      </a>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-2">
                      <p className="text-xs text-slate-500">Keamanan</p>
                      <span className={`text-xs font-semibold ${posting.is_safe ? 'text-green-400' : 'text-yellow-400'
                        }`}>
                        {posting.is_safe ? '✓ Aman' : '⚠ Kurang'}
                      </span>
                    </div>
                  </div>

                  {posting.photos && posting.photos.length > 0 && (
                    <div className="mb-3 grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 gap-1">
                      {posting.photos.slice(0, 5).map((photo, idx) => (
                        <img
                          key={idx}
                          src={photo}
                          alt={`Photo ${idx + 1}`}
                          className="w-full h-10 object-cover rounded border border-cyan-500/20 hover:border-cyan-400/50 transition-colors cursor-pointer"
                        />
                      ))}
                      {posting.photos.length > 5 && (
                        <div className="w-full h-10 bg-slate-800 rounded border border-cyan-500/20 flex items-center justify-center text-xs text-slate-400">
                          +{posting.photos.length - 5}
                        </div>
                      )}
                    </div>
                  )}

                  {posting.additional_spec && (
                    <div className="mb-3 p-2 bg-slate-900/50 rounded-lg border border-slate-700">
                      <p className="text-xs text-slate-500">Spesifikasi</p>
                      <p className="text-slate-300 text-xs line-clamp-2">{posting.additional_spec}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-700/50">
                    {!posting.is_approved && (
                      <button
                        onClick={() => handleApprove('jasa_posting', posting.id)}
                        disabled={actionLoading?.id === posting.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/20 hover:bg-green-500/30 border border-green-500/50 text-green-400 rounded-lg transition-all duration-200 text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {actionLoading?.id === posting.id && actionLoading?.action === 'approve' ? (
                          <><div className="w-3 h-3 border-2 border-green-400/30 border-t-green-400 rounded-full animate-spin" /> Memproses...</>
                        ) : (
                          <><Check className="w-3.5 h-3.5" /> Setujui</>
                        )}
                      </button>
                    )}
                    {posting.is_approved && (
                      <button
                        onClick={() => handleReject('jasa_posting', posting.id)}
                        disabled={actionLoading?.id === posting.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/50 text-yellow-400 rounded-lg transition-all duration-200 text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {actionLoading?.id === posting.id && actionLoading?.action === 'reject' ? (
                          <><div className="w-3 h-3 border-2 border-yellow-400/30 border-t-yellow-400 rounded-full animate-spin" /> Memproses...</>
                        ) : (
                          <><X className="w-3.5 h-3.5" /> Batalkan</>
                        )}
                      </button>
                    )}
                    <button
                      onClick={() => openDeleteModal('jasa_posting', posting.id, posting.owner_name || posting.code)}
                      disabled={actionLoading?.id === posting.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-400 rounded-lg transition-all duration-200 text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
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
            {filteredCaris.length === 0 ? (
              <div className="text-center py-20 bg-slate-800/30 rounded-xl border border-purple-500/10">
                <Search className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400 text-lg">Tidak ada data yang cocok</p>
                <p className="text-slate-500 text-sm mt-1">Coba ubah kata kunci pencarian atau filter</p>
              </div>
            ) : (
              filteredCaris.map((cari) => (
                <div
                  key={cari.id}
                  className={`border rounded-xl p-4 backdrop-blur-sm transition-all duration-300 hover:shadow-lg ${cari.is_approved
                    ? 'bg-gradient-to-r from-green-900/20 to-slate-900/50 border-green-500/30 hover:border-green-400/50 hover:shadow-green-500/10'
                    : 'bg-gradient-to-r from-purple-900/10 to-slate-900/50 border-purple-500/30 hover:border-purple-400/50 hover:shadow-purple-500/10'
                    }`}
                >
                  {/* Status Badge */}
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${cari.is_approved
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                        }`}
                    >
                      {cari.is_approved ? (
                        <><CheckCircle className="w-3 h-3" /> Disetujui</>
                      ) : (
                        <><Clock className="w-3 h-3" /> Pending</>
                      )}
                    </span>
                    <span className="text-xs text-slate-500">
                      {new Date(cari.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 md:grid-cols-5 gap-2 mb-3">
                    <div className="bg-slate-800/50 rounded-lg p-2">
                      <p className="text-xs text-slate-500">Kode</p>
                      <p className="text-purple-300 font-mono font-bold text-xs truncate">{cari.code}</p>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-2">
                      <p className="text-xs text-slate-500">Pencari</p>
                      <p className="text-purple-300 font-semibold text-xs truncate">{cari.requester_name}</p>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-2">
                      <p className="text-xs text-slate-500">Game</p>
                      <p className="text-purple-300 font-semibold text-xs truncate">{cari.game?.name}</p>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-2">
                      <p className="text-xs text-slate-500">Harga</p>
                      <p className="text-lime-400 font-bold text-xs truncate">
                        {formatCurrency(cari.price_min)} - {formatCurrency(cari.price_max)}
                      </p>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-2">
                      <p className="text-xs text-slate-500">WhatsApp</p>
                      <a
                        href={`https://wa.me/${cari.phone_number}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-400 hover:text-green-300 font-medium flex items-center gap-1 text-xs"
                      >
                        <MessageSquare className="w-3 h-3" />
                        <span className="truncate">{cari.phone_number}</span>
                      </a>
                    </div>
                  </div>

                  <div className="mb-3 p-2 bg-slate-900/50 rounded-lg border border-slate-700">
                    <p className="text-xs text-slate-500">Spesifikasi Dicari</p>
                    <p className="text-slate-300 text-xs line-clamp-2">{cari.account_spec}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-700/50">
                    {!cari.is_approved && (
                      <button
                        onClick={() => handleApprove('jasa_cari', cari.id)}
                        disabled={actionLoading?.id === cari.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/20 hover:bg-green-500/30 border border-green-500/50 text-green-400 rounded-lg transition-all duration-200 text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {actionLoading?.id === cari.id && actionLoading?.action === 'approve' ? (
                          <><div className="w-3 h-3 border-2 border-green-400/30 border-t-green-400 rounded-full animate-spin" /> Memproses...</>
                        ) : (
                          <><Check className="w-3.5 h-3.5" /> Setujui</>
                        )}
                      </button>
                    )}
                    {cari.is_approved && (
                      <button
                        onClick={() => handleReject('jasa_cari', cari.id)}
                        disabled={actionLoading?.id === cari.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/50 text-yellow-400 rounded-lg transition-all duration-200 text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {actionLoading?.id === cari.id && actionLoading?.action === 'reject' ? (
                          <><div className="w-3 h-3 border-2 border-yellow-400/30 border-t-yellow-400 rounded-full animate-spin" /> Memproses...</>
                        ) : (
                          <><X className="w-3.5 h-3.5" /> Batalkan</>
                        )}
                      </button>
                    )}
                    <button
                      onClick={() => openDeleteModal('jasa_cari', cari.id, cari.requester_name || cari.code)}
                      disabled={actionLoading?.id === cari.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-400 rounded-lg transition-all duration-200 text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Hapus
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={closeDeleteModal}
        onConfirm={handleDelete}
        title="Hapus Data"
        message={`Apakah Anda yakin ingin menghapus data "${deleteModal.itemName}"? Tindakan ini tidak dapat dibatalkan.`}
        type="danger"
        confirmText="Ya, Hapus"
        cancelText="Batal"
        loading={deleteLoading}
      />
    </div>
  );
}
