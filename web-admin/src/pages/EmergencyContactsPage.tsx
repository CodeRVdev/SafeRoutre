import React, { useState, useEffect } from 'react';
import type { EmergencyContact, CreateContactPayload } from '../api/contacts';
import {
  getEmergencyContactsApi,
  createEmergencyContactApi,
  updateEmergencyContactApi,
  deleteEmergencyContactApi,
} from '../api/contacts';
import {
  PhoneCall,
  Plus,
  Search,
  Edit2,
  Trash2,
  Flame,
  Stethoscope,
  Shield,
  Waves,
  School,
  CheckCircle2,
  XCircle,
  Building2,
  Phone,
  RefreshCw,
  X,
} from 'lucide-react';

export const EmergencyContactsPage: React.FC = () => {
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<EmergencyContact | null>(null);
  const [deletingContact, setDeletingContact] = useState<EmergencyContact | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Fields State
  const [formData, setFormData] = useState<CreateContactPayload>({
    name: '',
    organization: '',
    phone: '',
    category: 'disaster',
    is_active: true,
    sort_order: 0,
  });

  const fetchContacts = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getEmergencyContactsApi(true);
      setContacts(res.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load emergency contacts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  const handleOpenAddModal = () => {
    setEditingContact(null);
    setFormData({
      name: '',
      organization: '',
      phone: '',
      category: 'disaster',
      is_active: true,
      sort_order: (contacts.length + 1) * 10,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (contact: EmergencyContact) => {
    setEditingContact(contact);
    setFormData({
      name: contact.name,
      organization: contact.organization || '',
      phone: contact.phone,
      category: contact.category,
      is_active: contact.is_active,
      sort_order: contact.sort_order,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) {
      alert('Name and Phone number are required.');
      return;
    }

    try {
      setIsSubmitting(true);
      if (editingContact) {
        await updateEmergencyContactApi(editingContact.contact_id, formData);
      } else {
        await createEmergencyContactApi(formData);
      }
      setIsModalOpen(false);
      fetchContacts();
    } catch (err: any) {
      alert(err.message || 'Failed to save emergency contact.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingContact) return;
    try {
      setIsSubmitting(true);
      await deleteEmergencyContactApi(deletingContact.contact_id);
      setDeletingContact(null);
      fetchContacts();
    } catch (err: any) {
      alert(err.message || 'Failed to delete emergency contact.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'fire':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <Flame className="w-3 h-3 text-rose-400" /> Fire (BFP)
          </span>
        );
      case 'medical':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Stethoscope className="w-3 h-3 text-cyan-400" /> Medical
          </span>
        );
      case 'police':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Shield className="w-3 h-3 text-amber-400" /> Police (PNP)
          </span>
        );
      case 'school':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <School className="w-3 h-3 text-emerald-400" /> School / Local
          </span>
        );
      case 'disaster':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-500/10 text-orange-400 border border-orange-500/20">
            <Waves className="w-3 h-3 text-orange-400" /> Disaster / MDRRMO
          </span>
        );
    }
  };

  const filteredContacts = contacts.filter((c) => {
    const matchesCat = selectedCategory === 'all' || c.category === selectedCategory;
    const matchesQuery =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.organization && c.organization.toLowerCase().includes(searchQuery.toLowerCase())) ||
      c.phone.includes(searchQuery);
    return matchesCat && matchesQuery;
  });

  return (
    <div className="flex-1 p-4 lg:p-8 max-w-[1920px] mx-auto w-full space-y-6">
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <PhoneCall className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-white tracking-wide">Emergency Contact Directory</h2>
            <p className="text-xs text-slate-400">
              Manage official local emergency hotline numbers for Tupi, South Cotabato & campus responders
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchContacts}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-all"
            title="Refresh Directory"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white font-bold text-xs flex items-center space-x-2 shadow-lg shadow-cyan-500/25 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Emergency Contact</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-xl border border-slate-800">
          <p className="text-xs font-semibold text-slate-400 uppercase">Total Hotline Numbers</p>
          <p className="text-2xl font-extrabold text-white mt-1">{contacts.length}</p>
        </div>
        <div className="glass-panel p-4 rounded-xl border border-emerald-500/20">
          <p className="text-xs font-semibold text-emerald-400 uppercase">Active Contacts</p>
          <p className="text-2xl font-extrabold text-emerald-400 mt-1">
            {contacts.filter((c) => c.is_active).length}
          </p>
        </div>
        <div className="glass-panel p-4 rounded-xl border border-orange-500/20">
          <p className="text-xs font-semibold text-orange-400 uppercase">Disaster & MDRRMO</p>
          <p className="text-2xl font-extrabold text-orange-400 mt-1">
            {contacts.filter((c) => c.category === 'disaster').length}
          </p>
        </div>
        <div className="glass-panel p-4 rounded-xl border border-cyan-500/20">
          <p className="text-xs font-semibold text-cyan-400 uppercase">Medical & Hospitals</p>
          <p className="text-2xl font-extrabold text-cyan-400 mt-1">
            {contacts.filter((c) => c.category === 'medical').length}
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by contact name, organization, or phone number..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {[
            { id: 'all', label: 'All Categories' },
            { id: 'disaster', label: 'Disaster (MDRRMO)' },
            { id: 'fire', label: 'Fire (BFP)' },
            { id: 'police', label: 'Police (PNP)' },
            { id: 'medical', label: 'Medical' },
            { id: 'school', label: 'School' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                selectedCategory === cat.id
                  ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/20'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Contacts Directory Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        {loading ? (
          <div className="py-12 text-center text-slate-400 text-sm">Loading emergency contacts directory...</div>
        ) : error ? (
          <div className="py-12 text-center text-rose-400 text-sm">{error}</div>
        ) : filteredContacts.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-sm">No emergency contacts found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/90 text-slate-400 font-bold uppercase border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Contact Name</th>
                  <th className="py-3 px-4">Organization / Unit</th>
                  <th className="py-3 px-4">Phone Number</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-center">Sort Order</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredContacts.map((contact) => (
                  <tr key={contact.contact_id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="py-3 px-4 font-bold text-white flex items-center gap-2">
                      <span>{contact.name}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {contact.organization ? (
                        <span className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-500" />
                          {contact.organization}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-3 px-4 font-bold text-cyan-400">
                      <a
                        href={`tel:${contact.phone}`}
                        className="hover:underline flex items-center gap-1.5"
                        title="Click to dial"
                      >
                        <Phone className="w-3.5 h-3.5 text-emerald-400" />
                        {contact.phone}
                      </a>
                    </td>
                    <td className="py-3 px-4">{getCategoryBadge(contact.category)}</td>
                    <td className="py-3 px-4 text-center text-slate-400 font-mono">{contact.sort_order}</td>
                    <td className="py-3 px-4 text-center">
                      {contact.is_active ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                          <CheckCircle2 className="w-3 h-3" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">
                          <XCircle className="w-3 h-3" /> Inactive
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleOpenEditModal(contact)}
                          className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-cyan-400 hover:border-cyan-500/30 transition-all"
                          title="Edit Contact"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingContact(contact)}
                          className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-rose-400 hover:border-rose-500/30 transition-all"
                          title="Delete Contact"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Contact Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="glass-panel max-w-lg w-full p-6 rounded-2xl border border-slate-800 space-y-5 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <PhoneCall className="w-5 h-5 text-cyan-400" />
                <span>{editingContact ? 'Edit Emergency Contact' : 'Add Emergency Contact'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Contact Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Tupi MDRRMO Hotline"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Organization / Agency</label>
                <input
                  type="text"
                  value={formData.organization || ''}
                  onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                  placeholder="e.g. Municipal Disaster Risk Reduction Office"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="e.g. (083) 228-1500 or 911"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-cyan-400 font-bold focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="disaster">🌊 Disaster / MDRRMO</option>
                    <option value="fire">🚒 Fire (BFP)</option>
                    <option value="police">👮 Police (PNP)</option>
                    <option value="medical">🏥 Medical / Hospital</option>
                    <option value="school">🏫 School / Local</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Sort Order</label>
                  <input
                    type="number"
                    value={formData.sort_order}
                    onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div className="flex items-center pt-5">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="w-4 h-4 rounded text-cyan-500 focus:ring-cyan-500 bg-slate-900 border-slate-800"
                    />
                    <span className="text-slate-300 font-semibold">Active in App Directory</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white font-bold shadow-lg shadow-cyan-500/20 disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editingContact ? 'Update Contact' : 'Create Contact'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="glass-panel max-w-sm w-full p-6 rounded-2xl border border-rose-500/40 space-y-4 text-center shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">Delete Emergency Contact?</h3>
              <p className="text-xs text-slate-400 mt-1">
                Are you sure you want to remove <strong className="text-white">{deletingContact.name}</strong> ({deletingContact.phone})?
              </p>
            </div>
            <div className="flex items-center justify-center space-x-3 pt-2">
              <button
                onClick={() => setDeletingContact(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 font-semibold text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs shadow-lg shadow-rose-500/20 disabled:opacity-50"
              >
                {isSubmitting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
