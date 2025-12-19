import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useGames } from '../hooks/useGames';
import { generateJCCode } from '../utils/codeGenerator';
import { validatePhoneNumber, formatCurrency, validateAccountSpec } from '../utils/validation';
import { Check, AlertCircle } from 'lucide-react';

interface FormData {
  requester_name: string;
  game_id: string;
  price_min: string;
  price_max: string;
  phone_number: string;
  account_spec: string;
}

export function JasaCari() {
  const { user, profile } = useAuth();
  const { games } = useGames();
  const [formData, setFormData] = useState<FormData>({
    requester_name: profile?.username || '',
    game_id: '',
    price_min: '',
    price_max: '',
    phone_number: profile?.phone_number || '',
    account_spec: '',
  });

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [successType, setSuccessType] = useState<'success' | 'error'>('success');
  const [gameSearch, setGameSearch] = useState('');
  const [showGameSuggestions, setShowGameSuggestions] = useState(false);

  useEffect(() => {
    if (formData.requester_name && formData.game_id) {
      setCode(generateJCCode());
    }
  }, [formData.requester_name, formData.game_id]);

  const filteredGames = gameSearch
    ? games.filter((game) => game.name.toLowerCase().includes(gameSearch.toLowerCase()))
    : [];

  const handleSubmit = async () => {
    setLoading(true);

    try {
      // Validasi input form (login TIDAK wajib - bisa anonymous)
      if (!formData.requester_name.trim()) {
        throw new Error('Nama harus diisi');
      }
      if (!formData.game_id) {
        throw new Error('Game harus dipilih');
      }
      if (!formData.price_min || parseInt(formData.price_min) < 10000) {
        throw new Error('Harga minimal Rp 10.000');
      }
      if (!formData.price_max || parseInt(formData.price_max) < 10000) {
        throw new Error('Harga maksimal Rp 10.000');
      }
      if (parseInt(formData.price_max) < parseInt(formData.price_min)) {
        throw new Error('Harga maksimal harus lebih besar dari harga minimal');
      }
      if (!validatePhoneNumber(formData.phone_number)) {
        throw new Error('Nomor WhatsApp tidak valid');
      }
      if (!validateAccountSpec(formData.account_spec)) {
        throw new Error('Spesifikasi akun minimal 5 kata');
      }

      // Insert dengan user_id opsional (null jika anonymous)
      const { error } = await supabase.from('jasa_cari').insert({
        code: code,
        requester_name: formData.requester_name,
        game_id: formData.game_id,
        price_min: parseInt(formData.price_min),
        price_max: parseInt(formData.price_max),
        phone_number: formData.phone_number,
        account_spec: formData.account_spec,
        user_id: user?.id || null, // Opsional: null jika user tidak login
        is_approved: false,
      });

      if (error) throw error;

      setSuccessType('success');
      setSuccessMessage('Pencarian Akun Anda Berhasil Dibuat! Menunggu persetujuan admin...');
      setShowSuccess(true);

      setTimeout(() => {
        setShowSuccess(false);
        setFormData({
          requester_name: profile?.username || '',
          game_id: '',
          price_min: '',
          price_max: '',
          phone_number: profile?.phone_number || '',
          account_spec: '',
        });
        setCode('');
        setGameSearch('');
      }, 3000);
    } catch (error: any) {
      setSuccessType('error');
      setSuccessMessage(error.message || 'Gagal membuat pencarian');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 4000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-black to-black pt-24 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold mb-2 text-center text-white">
          Jasa Cari Akun
        </h1>
        <p className="text-center text-slate-400 mb-12">
          Cari akun game yang Anda inginkan dengan harga terjangkau
        </p>

        <div className="space-y-6">
          {/* Requester Name */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              Nama Pencari *
            </label>
            <input
              type="text"
              value={formData.requester_name}
              onChange={(e) => setFormData({ ...formData, requester_name: e.target.value })}
              placeholder="Masukkan nama Anda"
              className="w-full px-4 py-2.5 bg-slate-800 border border-cyan-500/20 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/20 transition-colors"
              disabled={loading}
            />
          </div>

          {/* Game Selection */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              Game *
            </label>
            <div className="relative">
              <input
                type="text"
                value={gameSearch || (formData.game_id ? games.find(g => g.id === formData.game_id)?.name : '')}
                onChange={(e) => {
                  setGameSearch(e.target.value);
                  setShowGameSuggestions(true);
                }}
                onFocus={() => setShowGameSuggestions(true)}
                placeholder="Cari atau ketik nama game"
                className="w-full px-4 py-2.5 bg-slate-800 border border-cyan-500/20 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/20 transition-colors"
                disabled={loading}
              />

              {showGameSuggestions && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-cyan-500/20 rounded-lg z-10 max-h-40 overflow-y-auto">
                  {filteredGames.length > 0 ? (
                    filteredGames.map((game) => (
                      <button
                        key={game.id}
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, game_id: game.id });
                          setGameSearch('');
                          setShowGameSuggestions(false);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-cyan-500/10 text-slate-200 transition-colors text-sm"
                      >
                        {game.name}
                      </button>
                    ))
                  ) : gameSearch ? (
                    <div className="px-4 py-2 text-slate-400 text-sm">Tidak ada game yang cocok</div>
                  ) : (
                    games.map((game) => (
                      <button
                        key={game.id}
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, game_id: game.id });
                          setGameSearch('');
                          setShowGameSuggestions(false);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-cyan-500/10 text-slate-200 transition-colors text-sm"
                      >
                        {game.name}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Code */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              Kode (Otomatis)
            </label>
            <input
              type="text"
              value={code}
              placeholder="Isi nama dan game terlebih dahulu"
              readOnly
              className="w-full px-4 py-2.5 bg-slate-700 border border-cyan-500/10 rounded-lg text-cyan-300 font-mono text-sm font-semibold"
            />
          </div>

          {/* Price Range */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              Kisaran Harga (Minimal Rp 10.000) *
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">Rp</span>
                <input
                  type="number"
                  value={formData.price_min}
                  onChange={(e) => setFormData({ ...formData, price_min: e.target.value })}
                  placeholder="Min"
                  className="w-full pl-12 pr-4 py-2.5 bg-slate-800 border border-cyan-500/20 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/20 transition-colors text-sm"
                  disabled={loading}
                />
              </div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">Rp</span>
                <input
                  type="number"
                  value={formData.price_max}
                  onChange={(e) => setFormData({ ...formData, price_max: e.target.value })}
                  placeholder="Max"
                  className="w-full pl-12 pr-4 py-2.5 bg-slate-800 border border-cyan-500/20 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/20 transition-colors text-sm"
                  disabled={loading}
                />
              </div>
            </div>
            {formData.price_min && formData.price_max && (
              <p className="text-sm text-cyan-400 mt-2 font-medium">
                {formatCurrency(parseInt(formData.price_min))} - {formatCurrency(parseInt(formData.price_max))}
              </p>
            )}
          </div>

          {/* WhatsApp Number */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              Nomor WhatsApp *
            </label>
            <input
              type="tel"
              value={formData.phone_number}
              onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
              placeholder="0812345678"
              className="w-full px-4 py-2.5 bg-slate-800 border border-cyan-500/20 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/20 transition-colors"
              disabled={loading}
            />
          </div>

          {/* Account Specification */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              Spesifikasi Akun Yang Dicari (Minimal 5 Kata) *
            </label>
            <textarea
              value={formData.account_spec}
              onChange={(e) => setFormData({ ...formData, account_spec: e.target.value })}
              placeholder="Deskripsikan spesifikasi akun yang Anda cari..."
              rows={4}
              className="w-full px-4 py-2.5 bg-slate-800 border border-cyan-500/20 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/20 transition-colors resize-none text-sm"
              disabled={loading}
            />
            <p className="text-xs text-slate-500 mt-1">
              {formData.account_spec.trim().split(' ').filter(w => w).length} / 5 kata
            </p>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all duration-200 text-sm"
          >
            {loading ? 'Membuat...' : 'Buat Pencarian'}
          </button>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`bg-slate-900 border rounded-lg p-8 text-center max-w-sm ${successType === 'success' ? 'border-green-500/30' : 'border-red-500/30'
            }`}>
            {successType === 'success' ? (
              <>
                <Check className="w-16 h-16 text-green-400 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-green-400 mb-2">Berhasil!</h3>
              </>
            ) : (
              <>
                <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-red-400 mb-2">Gagal!</h3>
              </>
            )}
            <p className="text-slate-300 text-sm">{successMessage}</p>
          </div>
        </div>
      )}
    </div>
  );
}