import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useGames } from '../hooks/useGames';
import { generateJPCode } from '../utils/codeGenerator';
import { validatePhoneNumber, formatCurrency } from '../utils/validation';
import { Check, AlertCircle, X, Upload } from 'lucide-react';

interface FormData {
  owner_name: string;
  game_id: string;
  price: string;
  phone_number: string;
  is_safe: boolean | null;
  additional_spec: string;
  photos: string[];
}

export function JasaPosting() {
  const { user, profile } = useAuth();
  const { games } = useGames();
  const [formData, setFormData] = useState<FormData>({
    owner_name: profile?.phone_number || '',
    game_id: '',
    price: '',
    phone_number: profile?.phone_number || '',
    is_safe: null,
    additional_spec: '',
    photos: [],
  });

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [successType, setSuccessType] = useState<'success' | 'error'>('success');
  const [gameSearch, setGameSearch] = useState('');
  const [showGameSuggestions, setShowGameSuggestions] = useState(false);

  useEffect(() => {
    if (formData.owner_name && formData.game_id) {
      setCode(generateJPCode());
    }
  }, [formData.owner_name, formData.game_id]);

  const filteredGames = gameSearch
    ? games.filter((game) => game.name.toLowerCase().includes(gameSearch.toLowerCase()))
    : [];

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (!files) return;

    if (formData.photos.length + files.length > 5) {
      alert('Maksimal 5 foto');
      return;
    }

    const newPhotos = [...formData.photos];

    for (let i = 0; i < files.length && newPhotos.length < 5; i++) {
      const file = files[i];
      const reader = new FileReader();

      reader.onloadend = () => {
        newPhotos.push(reader.result as string);
        setFormData({ ...formData, photos: newPhotos });
      };

      reader.readAsDataURL(file);
    }
  };

  const removePhoto = (index: number) => {
    const newPhotos = formData.photos.filter((_, i) => i !== index);
    setFormData({ ...formData, photos: newPhotos });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!formData.owner_name.trim()) {
        throw new Error('Nama pemilik akun harus diisi');
      }
      if (!formData.game_id) {
        throw new Error('Game harus dipilih');
      }
      if (!formData.price || parseInt(formData.price) < 10000) {
        throw new Error('Harga minimal Rp 10.000');
      }
      if (!validatePhoneNumber(formData.phone_number)) {
        throw new Error('Nomor WhatsApp tidak valid');
      }
      if (formData.is_safe === null) {
        throw new Error('Status keamanan akun harus dipilih');
      }
      if (formData.photos.length === 0) {
        throw new Error('Minimal 1 foto akun harus diupload');
      }

      const { error } = await supabase.from('jasa_posting').insert({
        code: code,
        owner_name: formData.owner_name,
        game_id: formData.game_id,
        price: parseInt(formData.price),
        phone_number: formData.phone_number,
        is_safe: formData.is_safe,
        additional_spec: formData.additional_spec || null,
        photos: formData.photos,
        user_id: user?.id || '00000000-0000-0000-0000-000000000000',
        is_approved: false,
      });

      if (error) throw error;

      setSuccessType('success');
      setSuccessMessage('Akun Anda Berhasil DiPosting! Menunggu persetujuan admin...');
      setShowSuccess(true);

      setTimeout(() => {
        setShowSuccess(false);
        setFormData({
          owner_name: profile?.phone_number || '',
          game_id: '',
          price: '',
          phone_number: profile?.phone_number || '',
          is_safe: null,
          additional_spec: '',
          photos: [],
        });
        setCode('');
        setGameSearch('');
      }, 3000);
    } catch (error: any) {
      setSuccessType('error');
      setSuccessMessage(error.message || 'Gagal posting akun');
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
          Jasa Posting Akun
        </h1>
        <p className="text-center text-slate-400 mb-12">
          Posting akun game Anda dan mulai dapatkan pembeli
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Owner Name */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              Nama Pemilik Akun *
            </label>
            <input
              type="text"
              value={formData.owner_name}
              onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })}
              placeholder="Masukkan nama pemilik"
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

          {/* Price */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              Harga (Minimal Rp 10.000) *
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">Rp</span>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="50000"
                className="w-full pl-12 pr-4 py-2.5 bg-slate-800 border border-cyan-500/20 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/20 transition-colors"
                disabled={loading}
              />
            </div>
            {formData.price && (
              <p className="text-sm text-cyan-400 mt-1 font-medium">
                {formatCurrency(parseInt(formData.price))}
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

          {/* Account Safety */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-3">
              Status Akun *
            </label>
            <div className="space-y-2">
              <label className="flex items-center p-3 bg-slate-800 border border-cyan-500/20 rounded-lg cursor-pointer hover:bg-slate-800/80 hover:border-cyan-400/40 transition-colors">
                <input
                  type="radio"
                  name="safety"
                  checked={formData.is_safe === true}
                  onChange={() => setFormData({ ...formData, is_safe: true })}
                  disabled={loading}
                  className="w-4 h-4 accent-cyan-500"
                />
                <div className="ml-3">
                  <p className="font-medium text-slate-200 text-sm">Data Aman</p>
                  <p className="text-xs text-slate-500">Allkos, Gmail tidak lengket, dll</p>
                </div>
              </label>

              <label className="flex items-center p-3 bg-slate-800 border border-cyan-500/20 rounded-lg cursor-pointer hover:bg-slate-800/80 hover:border-cyan-400/40 transition-colors">
                <input
                  type="radio"
                  name="safety"
                  checked={formData.is_safe === false}
                  onChange={() => setFormData({ ...formData, is_safe: false })}
                  disabled={loading}
                  className="w-4 h-4 accent-cyan-500"
                />
                <div className="ml-3">
                  <p className="font-medium text-slate-200 text-sm">Data Kurang Aman</p>
                  <p className="text-xs text-slate-500">Lengket, Bind hilang, Tidak allkos</p>
                </div>
              </label>
            </div>
          </div>

          {/* Photos Upload */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              Upload Foto Akun (Max 5 Foto) *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
              {formData.photos.map((photo, index) => (
                <div key={index} className="relative group">
                  <img
                    src={photo}
                    alt={`Photo ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg border border-cyan-500/20"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(index)}
                    className="absolute top-1 right-1 p-1 bg-red-500/80 hover:bg-red-600 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              ))}

              {formData.photos.length < 5 && (
                <label className="flex flex-col items-center justify-center h-24 bg-slate-800 border-2 border-dashed border-cyan-500/30 rounded-lg cursor-pointer hover:border-cyan-400 hover:bg-slate-800/80 transition-colors">
                  <Upload className="w-6 h-6 text-cyan-400 mb-1" />
                  <span className="text-xs text-slate-400 text-center">Upload</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoUpload}
                    className="hidden"
                    disabled={loading || formData.photos.length >= 5}
                  />
                </label>
              )}
            </div>
            <p className="text-xs text-slate-500">{formData.photos.length}/5 foto</p>
          </div>

          {/* Additional Spec */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              Spesifikasi Tambahan (Opsional)
            </label>
            <textarea
              value={formData.additional_spec}
              onChange={(e) => setFormData({ ...formData, additional_spec: e.target.value })}
              placeholder="Deskripsikan spesifikasi akun lebih detail..."
              rows={4}
              className="w-full px-4 py-2.5 bg-slate-800 border border-cyan-500/20 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/20 transition-colors resize-none text-sm"
              disabled={loading}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all duration-200 text-sm"
          >
            {loading ? 'Posting...' : 'Post Akun'}
          </button>
        </form>
      </div>

      {/* Success Modal */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`bg-slate-900 border rounded-lg p-8 text-center max-w-sm ${
            successType === 'success' ? 'border-green-500/30' : 'border-red-500/30'
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
