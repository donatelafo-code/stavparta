import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Lock,
  LogOut,
  Inbox,
  Briefcase,
  Image as ImageIcon,
  MessageSquareQuote,
  Settings,
  Download,
  Upload,
  FileSpreadsheet,
  Archive,
  Search,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle2,
  RefreshCw,
  FileText,
  Key,
  Mail,
  Send,
  Check,
  BookOpen,
  Film,
} from 'lucide-react';
import {
  BlogCategory,
  BlogPost,
  Lead,
  LeadStatus,
  Project,
  ServiceItem,
  SiteSettings,
  Testimonial,
  NewsletterSubscriber,
} from '../types';
import { STATUS_LABELS } from '../shared/seedData';
import { api, ApiError, AdminAuthUser } from '../services/api';
import {
  exportDatabaseToJson,
  exportLeadsToCsv,
  exportFullBackupZip,
  importDatabaseFromJson,
} from '../services/export';
import { QuotationGeneratorModal } from './QuotationGeneratorModal';

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  settings: SiteSettings;
  services: ServiceItem[];
  projects: Project[];
  testimonials: Testimonial[];
  leads: Lead[];
  blogPosts: BlogPost[];
  onRefreshData?: () => Promise<void> | void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = (props) => {
  if (!props.isOpen) return null;
  return <AdminDashboardContent {...props} />;
};

const AdminDashboardContent: React.FC<AdminDashboardProps> = ({
  onClose,
  settings,
  services,
  projects,
  testimonials,
  leads,
  blogPosts,
  onRefreshData,
}) => {
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [setupRequired, setSetupRequired] = useState<boolean>(false);
  const [adminUser, setAdminUser] = useState<AdminAuthUser | null>(null);
  const [usernameInput, setUsernameInput] = useState('admin');
  const [passwordInput, setPasswordInput] = useState('');
  const [setupPasswordInput, setSetupPasswordInput] = useState('');
  const [setupConfirmInput, setSetupConfirmInput] = useState('');
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [authError, setAuthError] = useState('');

  const [forcedCurrentPassword, setForcedCurrentPassword] = useState('');
  const [forcedNewPassword, setForcedNewPassword] = useState('');
  const [forcedConfirmPassword, setForcedConfirmPassword] = useState('');
  const [forcedPassError, setForcedPassError] = useState('');

  const [activeTab, setActiveTab] = useState<'leads' | 'services' | 'projects' | 'blog' | 'testimonials' | 'subscribers' | 'settings' | 'backups'>('leads');
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [subscriberSearchQuery, setSubscriberSearchQuery] = useState('');

  // Quick-add Blog form state
  const [isAddingBlog, setIsAddingBlog] = useState(false);
  const [newBlogTitle, setNewBlogTitle] = useState('');
  const [newBlogCategory, setNewBlogCategory] = useState<BlogCategory>('Trendy v rekonstrukcích');
  const [newBlogExcerpt, setNewBlogExcerpt] = useState('');
  const [newBlogContent, setNewBlogContent] = useState('');
  const [newBlogTip, setNewBlogTip] = useState('');

  // Leads filter state
  const [leadStatusFilter, setLeadStatusFilter] = useState<string>('all');
  const [leadCategoryFilter, setLeadCategoryFilter] = useState<string>('all');
  const [leadSearchQuery, setLeadSearchQuery] = useState('');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [quotingLead, setQuotingLead] = useState<Lead | null>(null);
  const [newNoteText, setNewNoteText] = useState('');

  // Settings & notification state
  const [settingsForm, setSettingsForm] = useState<SiteSettings>(settings);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [simulatedEmailNotification, setSimulatedEmailNotification] = useState<string | null>(null);

  const [prevSettings, setPrevSettings] = useState<SiteSettings>(settings);
  if (settings !== prevSettings) {
    setPrevSettings(settings);
    setSettingsForm(settings);
  }

  const isAuthenticated = Boolean(adminUser && !adminUser.mustChangePassword);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }, []);

  const refreshSubscribers = useCallback(async () => {
    try {
      const res = await api.getSubscribers();
      setSubscribers(res.subscribers);
    } catch {
      setSubscribers([]);
    }
  }, []);

  useEffect(() => {
    let active = true;
    const checkSession = async () => {
      try {
        const me = await api.getAdminMe();
        if (!active) return;
        setSetupRequired(me.setupRequired);
        setAdminUser(me.user);
      } catch {
        if (active) {
          setAdminUser(null);
        }
      } finally {
        if (active) {
          setAuthLoading(false);
        }
      }
    };
    void checkSession();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    let active = true;
    const loadAdminData = async () => {
      try {
        const res = await api.getSubscribers();
        if (active) {
          setSubscribers(res.subscribers);
        }
      } catch {
        if (active) setSubscribers([]);
      }
    };
    void loadAdminData();
    return () => {
      active = false;
    };
  }, [isAuthenticated]);

  const handleSetupAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (setupPasswordInput.length < 8) {
      setAuthError('Heslo musí mít alespoň 8 znaků.');
      return;
    }
    if (setupPasswordInput !== setupConfirmInput) {
      setAuthError('Zadaná hesla se neshodují.');
      return;
    }
    setAuthSubmitting(true);
    setAuthError('');
    try {
      const res = await api.setupInitialAdmin(setupPasswordInput);
      setAdminUser(res.user);
      setSetupRequired(false);
      setSetupPasswordInput('');
      setSetupConfirmInput('');
      await onRefreshData?.();
      showToast('Účet administrátora byl úspěšně vytvořen.');
    } catch (err) {
      setAuthError(err instanceof ApiError ? err.message : 'Nepodařilo se nastavit účet správce.');
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthSubmitting(true);
    setAuthError('');
    try {
      const res = await api.loginAdmin(usernameInput.trim() || 'admin', passwordInput);
      setAdminUser(res.user);
      setPasswordInput('');
      if (!res.user.mustChangePassword) {
        await onRefreshData?.();
      }
    } catch (err) {
      setAuthError(err instanceof ApiError ? err.message : 'Přihlášení se nezdařilo.');
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleForcedPasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (forcedNewPassword.length < 8) {
      setForcedPassError('Nové heslo musí mít alespoň 8 znaků.');
      return;
    }
    if (forcedNewPassword !== forcedConfirmPassword) {
      setForcedPassError('Nové heslo a potvrzení hesla se neshodují.');
      return;
    }
    setAuthSubmitting(true);
    setForcedPassError('');
    try {
      const res = await api.changeAdminPassword(forcedCurrentPassword, forcedNewPassword);
      setAdminUser(res.user);
      setForcedCurrentPassword('');
      setForcedNewPassword('');
      setForcedConfirmPassword('');
      await onRefreshData?.();
      showToast('Nové heslo bylo nastaveno. Vítejte v administraci.');
    } catch (err) {
      setForcedPassError(
        err instanceof ApiError ? err.message : 'Nepodařilo se změnit výchozí heslo.'
      );
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await api.logoutAdmin();
    } catch {
      // Cookie cleared locally even on transient network failure
    }
    setAdminUser(null);
    setSubscribers([]);
    setSelectedLead(null);
    setQuotingLead(null);
    await onRefreshData?.();
  };

  const handleLeadStatusChange = async (leadId: string, status: LeadStatus) => {
    try {
      const res = await api.updateLeadStatus(leadId, status, 'Admin');
      if (selectedLead && selectedLead.id === leadId) {
        setSelectedLead(res.lead);
      }
      await onRefreshData?.();
      showToast(`Stav poptávky #${leadId} byl změněn na: ${STATUS_LABELS[status]?.label || status}`);
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Nepodařilo se aktualizovat stav poptávky.');
    }
  };

  const handleAddLeadNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead || !newNoteText.trim()) return;
    try {
      const res = await api.addLeadNote(selectedLead.id, newNoteText.trim(), 'Admin');
      setSelectedLead(res.lead);
      setNewNoteText('');
      await onRefreshData?.();
      showToast('Interní poznámka byla uložena.');
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Nepodařilo se uložit poznámku.');
    }
  };

  const handleDeleteLead = async (leadId: string) => {
    if (!window.confirm(`Opravdu si přejete smazat poptávku #${leadId}?`)) return;
    try {
      await api.deleteLead(leadId);
      if (selectedLead?.id === leadId) setSelectedLead(null);
      await onRefreshData?.();
      showToast('Poptávka byla odstraněna.');
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Nepodařilo se smazat poptávku.');
    }
  };

  const exportSubscribersToCsv = () => {
    const rows = [
      ['ID', 'E-mail', 'Datum registrace', 'Souhlas GDPR', 'Zdroj'],
      ...subscribers.map((s) => [
        s.id,
        s.email,
        new Date(s.createdAt).toLocaleString('cs-CZ'),
        s.consent ? 'ANO' : 'NE',
        s.source || 'Patička webu',
      ]),
    ];
    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `stavparta-odberatele-newsletteru-${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Seznam odběratelů byl exportován do CSV.');
  };

  const handleDeleteSubscriber = async (id: string, email: string) => {
    if (!window.confirm(`Opravdu chcete odebrat e-mail ${email} z odběru novinek?`)) return;
    try {
      await api.deleteSubscriber(id);
      await refreshSubscribers();
      showToast(`Odběratel ${email} byl odebrán.`);
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Nepodařilo se odebrat odběratele.');
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.updateSettings(settingsForm);
      await onRefreshData?.();
      showToast('Nastavení webu bylo úspěšně uloženo.');
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Nepodařilo se uložit nastavení.');
    }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      showToast('Zadejte prosím stávající heslo.');
      return;
    }
    if (newPassword.length < 8) {
      showToast('Nové heslo musí mít alespoň 8 znaků.');
      return;
    }
    try {
      await api.changeAdminPassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setPasswordChangeSuccess(true);
      setTimeout(() => setPasswordChangeSuccess(false), 4000);
      showToast('Administrátorské heslo bylo změněno.');
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Nepodařilo se změnit heslo.');
    }
  };

  // Filter leads
  const filteredLeads = leads.filter((l) => {
    const matchesStatus = leadStatusFilter === 'all' || l.status === leadStatusFilter;
    const cat = leadCategoryFilter;
    const matchesCategory =
      cat === 'all' ||
      (cat === 'komplexni' && (l.serviceId.includes('rekonstrukce-bytu') || l.serviceTitle.toLowerCase().includes('rekonstrukce'))) ||
      (cat === 'jadro' && (l.serviceId.includes('jadra') || l.serviceId.includes('koupelna') || l.coreDetails !== undefined)) ||
      (cat === 'zednicke' && (l.serviceId.includes('zednick') || l.serviceTitle.toLowerCase().includes('zedn'))) ||
      (cat === 'sadrokarton' && (l.serviceId.includes('sadrokarton') || l.serviceTitle.toLowerCase().includes('sádrokarton'))) ||
      (cat === 'obklady' && (l.serviceId.includes('obklady') || l.serviceTitle.toLowerCase().includes('obklad'))) ||
      (cat === 'dokoncovaci' && (l.serviceId.includes('dokoncovaci') || l.serviceTitle.toLowerCase().includes('dokonč') || l.serviceTitle.toLowerCase().includes('mal')));

    const matchesQuery =
      l.name.toLowerCase().includes(leadSearchQuery.toLowerCase()) ||
      l.email.toLowerCase().includes(leadSearchQuery.toLowerCase()) ||
      l.location.toLowerCase().includes(leadSearchQuery.toLowerCase()) ||
      l.serviceTitle.toLowerCase().includes(leadSearchQuery.toLowerCase());

    return matchesStatus && matchesCategory && matchesQuery;
  });

  const newLeadsCount = leads.filter((l) => l.status === 'nova').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-xs">
      <div className="bg-[#F8FAFC] text-slate-800 rounded-2xl shadow-2xl max-w-6xl w-full h-[92vh] flex flex-col overflow-hidden border border-slate-300">
        {/* Toast alert */}
        {toastMessage && (
          <div className="absolute top-4 right-1/2 translate-x-1/2 z-60 bg-[#17232D] text-white px-4 py-2 rounded-lg text-xs font-semibold shadow-xl border border-slate-700 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#F07818]" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Admin Header */}
        <div className="bg-[#17232D] text-white px-6 py-4 flex items-center justify-between border-b border-[#263746]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-[#F07818] flex items-center justify-center text-white font-bold">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-extrabold tracking-tight">
                Správa STAVPARTA
              </h2>
              <span className="text-[11px] text-slate-400">
                Poptávkový systém, bytová jádra, rekonstrukce a správa obsahu
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {adminUser && (
              <button
                onClick={() => void handleLogout()}
                className="px-3 py-1.5 text-xs text-slate-300 hover:text-white bg-[#263746] hover:bg-[#34485a] rounded transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Odhlásit</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-[#263746] rounded transition-colors cursor-pointer"
              aria-label="Zavřít administraci"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Auth states: Loading / First-run setup / Forced password change / Login */}
        {authLoading ? (
          <div className="flex-1 flex items-center justify-center p-6 bg-slate-100">
            <div className="text-center space-y-3">
              <RefreshCw className="w-6 h-6 text-[#F07818] animate-spin mx-auto" />
              <p className="text-xs font-semibold text-slate-600">Ověřuji relaci správce...</p>
            </div>
          </div>
        ) : !adminUser && setupRequired ? (
          <div className="flex-1 flex items-center justify-center p-6 bg-slate-100">
            <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-8 max-w-md w-full space-y-6">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-[#F07818]/10 text-[#F07818] rounded-xl flex items-center justify-center mx-auto">
                  <Key className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-extrabold text-[#17232D]">Prvotní nastavení správce</h3>
                <p className="text-xs text-slate-500">
                  Zatím není nastaven žádný administrátorský účet. Zvolte si vlastní silné heslo pro účet <strong>admin</strong>.
                </p>
              </div>

              <form onSubmit={handleSetupAdmin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nové heslo správce (min. 8 znaků)
                  </label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={setupPasswordInput}
                    onChange={(e) => setSetupPasswordInput(e.target.value)}
                    placeholder="Zadejte silné heslo..."
                    className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:border-[#F07818]"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Potvrzení hesla
                  </label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={setupConfirmInput}
                    onChange={(e) => setSetupConfirmInput(e.target.value)}
                    placeholder="Zadejte heslo znovu..."
                    className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:border-[#F07818]"
                  />
                </div>
                {authError && (
                  <p className="text-xs text-rose-600 font-medium">{authError}</p>
                )}

                <button
                  type="submit"
                  disabled={authSubmitting}
                  className="w-full py-3 bg-[#F07818] hover:bg-[#d9660e] text-white font-bold text-sm rounded-lg shadow transition-all cursor-pointer disabled:opacity-60"
                >
                  {authSubmitting ? 'Ukládám účet...' : 'Vytvořit účet a vstoupit'}
                </button>
              </form>
            </div>
          </div>
        ) : adminUser && adminUser.mustChangePassword ? (
          <div className="flex-1 flex items-center justify-center p-6 bg-slate-100">
            <div className="bg-white rounded-xl shadow-lg border border-amber-300 p-8 max-w-md w-full space-y-6">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-xl flex items-center justify-center mx-auto">
                  <Key className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-extrabold text-[#17232D]">Povinná změna hesla</h3>
                <p className="text-xs text-slate-600">
                  Přihlašujete se poprvé s inicializačním heslem. Před zpřístupněním poptávek si prosím nastavte nové osobní heslo.
                </p>
              </div>

              <form onSubmit={handleForcedPasswordChange} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Stávající inicializační heslo
                  </label>
                  <input
                    type="password"
                    required
                    value={forcedCurrentPassword}
                    onChange={(e) => setForcedCurrentPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:border-[#F07818]"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nové heslo (min. 8 znaků)
                  </label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={forcedNewPassword}
                    onChange={(e) => setForcedNewPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:border-[#F07818]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Potvrzení nového hesla
                  </label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={forcedConfirmPassword}
                    onChange={(e) => setForcedConfirmPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:border-[#F07818]"
                  />
                </div>
                {forcedPassError && (
                  <p className="text-xs text-rose-600 font-medium">{forcedPassError}</p>
                )}

                <button
                  type="submit"
                  disabled={authSubmitting}
                  className="w-full py-3 bg-[#17232D] hover:bg-[#263746] text-white font-bold text-sm rounded-lg shadow transition-all cursor-pointer disabled:opacity-60"
                >
                  {authSubmitting ? 'Ukládám nové heslo...' : 'Změnit heslo a pokračovat'}
                </button>
              </form>
            </div>
          </div>
        ) : !isAuthenticated ? (
          <div className="flex-1 flex items-center justify-center p-6 bg-slate-100">
            <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-8 max-w-md w-full space-y-6">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-[#F07818]/10 text-[#F07818] rounded-xl flex items-center justify-center mx-auto">
                  <Key className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-extrabold text-[#17232D]">Přihlášení do administrace</h3>
                <p className="text-xs text-slate-500">
                  Zadejte přístupové údaje správce pro zobrazení poptávek a správu obsahu.
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Uživatelské jméno
                  </label>
                  <input
                    type="text"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    autoComplete="username"
                    className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:border-[#F07818]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Přístupové heslo
                  </label>
                  <input
                    type="password"
                    required
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    autoComplete="current-password"
                    placeholder="Zadejte heslo..."
                    className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:border-[#F07818]"
                    autoFocus
                  />
                  {authError && (
                    <p className="text-xs text-rose-600 mt-1.5 font-medium">{authError}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={authSubmitting}
                  className="w-full py-3 bg-[#F07818] hover:bg-[#d9660e] text-white font-bold text-sm rounded-lg shadow transition-all cursor-pointer disabled:opacity-60"
                >
                  {authSubmitting ? 'Ověřuji...' : 'Přihlásit se'}
                </button>
              </form>
            </div>
          </div>
        ) : (
          /* Authenticated Dashboard */
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* Sidebar */}
            <div className="w-full md:w-60 bg-[#17232D] text-slate-300 p-3 flex md:flex-col justify-between border-r border-[#263746] shrink-0 overflow-x-auto">
              <div className="space-y-1 w-full flex md:flex-col gap-1 md:gap-0">
                <button
                  onClick={() => setActiveTab('leads')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    activeTab === 'leads'
                      ? 'bg-[#F07818] text-white shadow-sm'
                      : 'hover:bg-[#263746] text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Inbox className="w-4 h-4" />
                    <span>Poptávky</span>
                  </div>
                  {newLeadsCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full bg-white text-[#F07818] font-bold text-[10px]">
                      {newLeadsCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setActiveTab('services')}
                  className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    activeTab === 'services'
                      ? 'bg-[#F07818] text-white shadow-sm'
                      : 'hover:bg-[#263746] text-slate-300'
                  }`}
                >
                  <Briefcase className="w-4 h-4" />
                  <span>Služby ({services.length})</span>
                </button>

                <button
                  onClick={() => setActiveTab('projects')}
                  className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    activeTab === 'projects'
                      ? 'bg-[#F07818] text-white shadow-sm'
                      : 'hover:bg-[#263746] text-slate-300'
                  }`}
                >
                  <ImageIcon className="w-4 h-4" />
                  <span>Realizace ({projects.length})</span>
                </button>

                <button
                  onClick={() => setActiveTab('blog')}
                  className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    activeTab === 'blog'
                      ? 'bg-[#F07818] text-white shadow-sm'
                      : 'hover:bg-[#263746] text-slate-300'
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Blog / Aktuality ({blogPosts.length})</span>
                </button>

                <button
                  onClick={() => setActiveTab('testimonials')}
                  className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    activeTab === 'testimonials'
                      ? 'bg-[#F07818] text-white shadow-sm'
                      : 'hover:bg-[#263746] text-slate-300'
                  }`}
                >
                  <MessageSquareQuote className="w-4 h-4" />
                  <span>Reference ({testimonials.length})</span>
                </button>

                <button
                  onClick={() => setActiveTab('subscribers')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    activeTab === 'subscribers'
                      ? 'bg-[#F07818] text-white shadow-sm'
                      : 'hover:bg-[#263746] text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    <span>Odběr novinek</span>
                  </div>
                  <span className="px-1.5 py-0.5 rounded-full bg-[#0F171E] text-slate-200 text-[10px] font-bold">
                    {subscribers.length}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('settings')}
                  className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    activeTab === 'settings'
                      ? 'bg-[#F07818] text-white shadow-sm'
                      : 'hover:bg-[#263746] text-slate-300'
                  }`}
                >
                  <Settings className="w-4 h-4" />
                  <span>Nastavení firmy</span>
                </button>

                <button
                  onClick={() => setActiveTab('backups')}
                  className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    activeTab === 'backups'
                      ? 'bg-[#F07818] text-white shadow-sm'
                      : 'hover:bg-[#263746] text-slate-300'
                  }`}
                >
                  <Archive className="w-4 h-4" />
                  <span>Zálohy & Export</span>
                </button>
              </div>

              <div className="hidden md:block p-3 bg-[#0F171E] rounded-lg border border-[#263746] text-[10px] text-slate-400">
                <span className="font-bold text-white block mb-0.5">Vlastnictví dat:</span>
                <span>Všechna data včetně nových oborů lze kdykoliv stáhnout a zálohovat.</span>
              </div>
            </div>

            {/* Main Tab Content */}
            <div className="flex-1 bg-white overflow-y-auto p-4 sm:p-6">
              {/* TAB 1: LEADS INBOX */}
              {activeTab === 'leads' && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
                    <div>
                      <h3 className="text-xl font-extrabold text-[#17232D]">
                        Přijaté poptávky ({leads.length})
                      </h3>
                      <p className="text-xs text-slate-500">
                        Evidence zakázek, detailní odpovědi na otázky k bytovým jádrům a rekonstrukcím.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => exportLeadsToCsv(leads)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-xs font-semibold rounded flex items-center gap-1.5 cursor-pointer"
                      >
                        <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                        <span>Export do Excelu (CSV)</span>
                      </button>
                    </div>
                  </div>

                  {/* Filters: Category & Status */}
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="relative flex-1">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                        <input
                          type="text"
                          placeholder="Hledat podle jména, e-mailu, města nebo služby..."
                          value={leadSearchQuery}
                          onChange={(e) => setLeadSearchQuery(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-[#F07818]"
                        />
                      </div>

                      {/* Status filters */}
                      <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                        {[
                          { id: 'all', label: 'Všechny stavy' },
                          { id: 'nova', label: 'Nové' },
                          { id: 'ceka_na_kontakt', label: 'Čeká na kontakt' },
                          { id: 'kontaktovano', label: 'Kontaktováno' },
                          { id: 'pripravuje_se_nabidka', label: 'Příprava nabídky' },
                          { id: 'nabidka_odeslana', label: 'Nabídka odeslána' },
                          { id: 'zakazka_potvrzena', label: 'Potvrzeno' },
                          { id: 'realizace_probiha', label: 'Realizace' },
                          { id: 'dokonceno', label: 'Hotovo' },
                          { id: 'uzavreno', label: 'Uzavřeno' },
                        ].map((item) => (
                          <button
                            key={item.id}
                            onClick={() => setLeadStatusFilter(item.id)}
                            className={`px-2.5 py-1 text-[11px] font-semibold rounded-md whitespace-nowrap cursor-pointer transition-colors ${
                              leadStatusFilter === item.id
                                ? 'bg-[#17232D] text-white shadow-xs'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Category quick filters */}
                    <div className="flex items-center gap-1.5 overflow-x-auto text-xs pb-1 sm:pb-0">
                      <span className="text-slate-500 font-bold text-[11px] shrink-0">Kategorie:</span>
                      {[
                        { id: 'all', label: 'Všechny obory' },
                        { id: 'komplexni', label: 'Rekonstrukce' },
                        { id: 'jadro', label: 'Bytová jádra' },
                        { id: 'zednicke', label: 'Zednictví' },
                        { id: 'sadrokarton', label: 'Sádrokarton' },
                        { id: 'obklady', label: 'Obklady' },
                        { id: 'dokoncovaci', label: 'Dokončovací' },
                      ].map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => setLeadCategoryFilter(cat.id)}
                          className={`px-2 py-0.5 text-[11px] rounded transition-colors whitespace-nowrap ${
                            leadCategoryFilter === cat.id
                              ? 'bg-[#F07818] text-white font-bold'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Table */}
                  {filteredLeads.length === 0 ? (
                    <div className="p-12 text-center text-slate-400 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-300">
                      Nebyly nalezeny žádné poptávky odpovídající zadaným filtrům.
                    </div>
                  ) : (
                    <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-[#F1F4F6] text-slate-600 border-b border-slate-200 uppercase text-[10px] font-bold">
                            <tr>
                              <th className="py-3 px-4">Ev. číslo / Datum</th>
                              <th className="py-3 px-4">Zákazník</th>
                              <th className="py-3 px-4">Poptávaný obor & Specifikace</th>
                              <th className="py-3 px-4">Stav poptávky</th>
                              <th className="py-3 px-4 text-right">Akce</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {filteredLeads.map((lead) => {
                              const badgeInfo = STATUS_LABELS[lead.status] || {
                                label: lead.status,
                                bg: 'bg-slate-100',
                                color: 'text-slate-700 border-slate-300',
                              };

                              return (
                                <tr key={lead.id} className="hover:bg-slate-50 transition-colors">
                                  <td className="py-3.5 px-4 font-mono">
                                    <span className="font-bold text-[#17232D]">#{lead.id}</span>
                                    <div className="text-[10px] text-slate-400 font-sans">
                                      {new Date(lead.createdAt).toLocaleDateString('cs-CZ')}
                                    </div>
                                  </td>

                                  <td className="py-3.5 px-4">
                                    <div className="font-bold text-slate-900">{lead.name}</div>
                                    <div className="text-[11px] text-slate-500">{lead.email}</div>
                                    {lead.phone && (
                                      <div className="text-[10px] text-[#F07818] font-medium">{lead.phone}</div>
                                    )}
                                  </td>

                                  <td className="py-3.5 px-4">
                                    <div className="font-medium text-slate-800">{lead.serviceTitle}</div>
                                    <div className="text-[11px] text-slate-500">{lead.location}</div>
                                    {/* Specific tags */}
                                    {lead.coreDetails && (
                                      <span className="inline-block mt-1 px-1.5 py-0.5 bg-blue-50 text-blue-800 border border-blue-200 rounded text-[10px] font-semibold">
                                        Jádro: {lead.coreDetails.propertyType}
                                      </span>
                                    )}
                                  </td>

                                  <td className="py-3.5 px-4">
                                    <select
                                      value={lead.status}
                                      onChange={(e) => handleLeadStatusChange(lead.id, e.target.value as LeadStatus)}
                                      className={`text-xs font-semibold px-2 py-1 rounded border ${badgeInfo ? `${badgeInfo.bg} ${badgeInfo.color}` : 'bg-slate-100 text-slate-700'} cursor-pointer focus:outline-none`}
                                    >
                                      {(Object.keys(STATUS_LABELS) as LeadStatus[]).map((statusKey) => (
                                        <option key={statusKey} value={statusKey}>
                                          {STATUS_LABELS[statusKey].label}
                                        </option>
                                      ))}
                                    </select>
                                  </td>

                                  <td className="py-3.5 px-4 text-right">
                                    <div className="flex items-center justify-end gap-1.5">
                                      <button
                                        onClick={() => setQuotingLead(lead)}
                                        className="px-2 py-1 text-xs font-bold text-[#F07818] hover:text-white hover:bg-[#F07818] bg-orange-50 border border-orange-200 rounded transition-colors flex items-center gap-1 cursor-pointer"
                                        title="Vytvořit položkovou cenovou nabídku"
                                      >
                                        <FileText className="w-3.5 h-3.5" />
                                        <span className="hidden xl:inline">Nabídka</span>
                                      </button>
                                      <button
                                        onClick={() => setSelectedLead(lead)}
                                        className="px-2.5 py-1 text-xs font-bold text-slate-700 hover:text-white hover:bg-[#17232D] bg-slate-100 rounded transition-colors cursor-pointer"
                                      >
                                        Detail
                                      </button>
                                      <button
                                        onClick={() => handleDeleteLead(lead.id)}
                                        className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                                        title="Smazat"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Lead Detail Modal with Questionnaire Answers */}
                  {selectedLead && (
                    <div className="fixed inset-0 z-60 bg-black/60 flex items-center justify-center p-4">
                      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[88vh] overflow-y-auto p-6 border border-slate-200">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
                          <div>
                            <span className="text-xs font-bold font-mono text-[#F07818]">
                              Poptávka #{selectedLead.id}
                            </span>
                            <h4 className="text-lg font-extrabold text-[#17232D]">
                              {selectedLead.name}
                            </h4>
                          </div>
                          <div className="flex items-center gap-2 sm:gap-3">
                            <button
                              type="button"
                              onClick={() => setQuotingLead(selectedLead)}
                              className="px-2.5 py-1 bg-[#F07818] hover:bg-[#d9660e] text-white text-xs font-bold rounded flex items-center gap-1.5 cursor-pointer shadow-xs"
                              title="Vygenerovat položkový rozpočet pro zákazníka"
                            >
                              <FileSpreadsheet className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Vytvořit cenovou nabídku</span>
                              <span className="sm:hidden">Nabídka</span>
                            </button>

                            <div className="flex items-center gap-1.5">
                              <span className="text-[11px] text-slate-500 font-bold hidden sm:inline">Stav:</span>
                              <select
                                value={selectedLead.status}
                                onChange={(e) => handleLeadStatusChange(selectedLead.id, e.target.value as LeadStatus)}
                                className={`text-xs font-semibold px-2 py-1 rounded border ${STATUS_LABELS[selectedLead.status] ? `${STATUS_LABELS[selectedLead.status].bg} ${STATUS_LABELS[selectedLead.status].color}` : 'bg-slate-100 text-slate-700'} cursor-pointer focus:outline-none`}
                              >
                                {(Object.keys(STATUS_LABELS) as LeadStatus[]).map((statusKey) => (
                                  <option key={statusKey} value={statusKey}>
                                    {STATUS_LABELS[statusKey].label}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <button
                              onClick={() => setSelectedLead(null)}
                              className="p-1 text-slate-400 hover:text-slate-800 cursor-pointer"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-lg border border-slate-200 mb-4">
                          <div>
                            <span className="text-slate-500 block">E-mail:</span>
                            <a href={`mailto:${selectedLead.email}`} className="font-bold text-[#F07818] underline">
                              {selectedLead.email}
                            </a>
                          </div>
                          <div>
                            <span className="text-slate-500 block">Telefon:</span>
                            <span className="font-bold text-slate-800">{selectedLead.phone || 'Neuveden'}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block">Služba:</span>
                            <span className="font-bold text-slate-800">{selectedLead.serviceTitle}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block">Místo stavby:</span>
                            <span className="font-bold text-slate-800">{selectedLead.location}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block">Požadovaný termín:</span>
                            <span className="font-bold text-slate-800">{selectedLead.preferredTimeline || 'Flexibilní'}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block">Čas odeslání:</span>
                            <span className="font-mono text-slate-700">
                              {new Date(selectedLead.createdAt).toLocaleString('cs-CZ')}
                            </span>
                          </div>
                        </div>

                        {/* SPECIFIC REQUISITIONS: CORE DETAILS */}
                        {selectedLead.coreDetails && (
                          <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-lg text-xs space-y-1.5 mb-4">
                            <span className="font-bold text-blue-900 block mb-1">
                              Specifikace bytového jádra & koupelny:
                            </span>
                            <div className="grid grid-cols-2 gap-2 text-slate-700">
                              <div><span className="text-slate-500">Typ objektu:</span> {selectedLead.coreDetails.propertyType}</div>
                              <div><span className="text-slate-500">Rozsah:</span> {selectedLead.coreDetails.scope}</div>
                              <div><span className="text-slate-500">Změna dispozice:</span> {selectedLead.coreDetails.dispositionChange}</div>
                              <div><span className="text-slate-500">Představa / projekt:</span> {selectedLead.coreDetails.designStatus}</div>
                            </div>
                          </div>
                        )}

                        {/* Customer description */}
                        <div className="mb-4">
                          <span className="text-xs font-bold text-slate-700 block mb-1">
                            Znění poptávky:
                          </span>
                          <div className="p-3 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                            {selectedLead.description}
                          </div>
                        </div>

                        {/* Attachments */}
                        {selectedLead.attachments && selectedLead.attachments.length > 0 && (
                          <div className="mb-4">
                            <span className="text-xs font-bold text-slate-700 block mb-1">
                              Přiložená fotodokumentace / plány:
                            </span>
                            <div className="flex flex-wrap gap-2">
                              {selectedLead.attachments.map((att, i) => (
                                <div
                                  key={i}
                                  className="px-3 py-1.5 bg-slate-100 border border-slate-200 rounded text-xs flex items-center gap-1.5"
                                >
                                  <FileText className="w-3.5 h-3.5 text-[#F07818]" />
                                  <span>{att.name}</span>
                                  <span className="text-[10px] text-slate-400">({att.size} KB)</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Internal Notes History */}
                        <div className="border-t border-slate-200 pt-4">
                          <span className="text-xs font-bold text-slate-800 block mb-2">
                            Historie a interní poznámky:
                          </span>
                          <div className="space-y-2 mb-3 max-h-40 overflow-y-auto">
                            {selectedLead.notes.map((note) => (
                              <div
                                key={note.id}
                                className="p-2.5 bg-slate-50 border border-slate-200 rounded text-xs"
                              >
                                <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                                  <span className="font-bold text-slate-600">{note.author}</span>
                                  <span>{new Date(note.createdAt).toLocaleString('cs-CZ')}</span>
                                </div>
                                <p className="text-slate-700">{note.text}</p>
                              </div>
                            ))}
                          </div>

                          <form onSubmit={handleAddLeadNote} className="flex gap-2">
                            <input
                              type="text"
                              value={newNoteText}
                              onChange={(e) => setNewNoteText(e.target.value)}
                              placeholder="Přidat interní poznámku (např. Zaměření v pátek 15:00)..."
                              className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:border-[#F07818]"
                            />
                            <button
                              type="submit"
                              className="px-3 py-1.5 bg-[#17232D] text-white text-xs font-bold rounded hover:bg-[#263746]"
                            >
                              Uložit
                            </button>
                          </form>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: SERVICES */}
              {activeTab === 'services' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                    <div>
                      <h3 className="text-xl font-extrabold text-[#17232D]">Správa služeb</h3>
                      <p className="text-xs text-slate-500">
                        Pořadí kategorií, popisy a detailní podstránky.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {services.map((service) => (
                      <div
                        key={service.id}
                        className="p-4 rounded-xl border bg-white border-slate-200 shadow-xs flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#F07818]">
                              Pořadí #{service.order} · {service.category}
                            </span>
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                              service.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                            }`}>
                              {service.isActive ? 'Aktivní' : 'Skrytá'}
                            </span>
                          </div>

                          <h4 className="font-bold text-sm text-[#17232D] mb-1">
                            {service.title}
                          </h4>
                          <p className="text-xs text-slate-600 line-clamp-2 mb-2">
                            {service.shortDescription}
                          </p>
                        </div>

                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                          <span className="text-slate-400 text-[11px] font-mono">
                            /sluzby/{service.slug}
                          </span>
                          <button
                            onClick={async () => {
                              try {
                                await api.updateService(service.id, { isActive: !service.isActive });
                                await onRefreshData?.();
                                showToast(`Stav služby ${service.title} byl změněn.`);
                              } catch (err) {
                                showToast(err instanceof ApiError ? err.message : 'Nepodařilo se změnit stav služby.');
                              }
                            }}
                            className="text-slate-600 hover:text-slate-900 font-semibold"
                          >
                            {service.isActive ? 'Skrýt' : 'Zveřejnit'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: PROJECTS */}
              {activeTab === 'projects' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                    <div>
                      <h3 className="text-xl font-extrabold text-[#17232D]">Realizace v portfoliu</h3>
                      <p className="text-xs text-slate-500">
                        Správa ukázek zednictví, bytových jader a rekonstrukcí interiérů s fázemi PŘED / BĚHEM / PO.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {projects.map((proj) => (
                      <div
                        key={proj.id}
                        className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#F07818]">
                            {proj.serviceName}
                          </span>
                          <div className="flex items-center gap-1.5">
                            {proj.video && (
                              <span className="px-2 py-0.5 bg-slate-900 text-white rounded text-[10px] font-bold flex items-center gap-1">
                                <Film className="w-3 h-3 text-[#F07818]" />
                                <span>{proj.video.durationLabel}</span>
                              </span>
                            )}
                            {proj.isDemo && (
                              <span className="px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 rounded text-[10px] font-bold">
                                DEMO
                              </span>
                            )}
                          </div>
                        </div>
                        <h4 className="font-bold text-sm text-[#17232D]">{proj.title}</h4>
                        <p className="text-xs text-slate-600 line-clamp-2">{proj.description}</p>
                        <div className="text-[11px] text-slate-400">
                          {proj.location} · {proj.year}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB: BLOG / AKTUALITY */}
              {activeTab === 'blog' && (
                <div className="space-y-6">
                  <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-extrabold text-[#17232D]">
                        Blog & Aktuality ({blogPosts.length})
                      </h3>
                      <p className="text-xs text-slate-500">
                        Publikace článků o trendech v rekonstrukcích, údržbě interiéru a materiálech pro bytová jádra.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsAddingBlog(!isAddingBlog)}
                      className="px-4 py-2 bg-[#F07818] hover:bg-[#d9660e] text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
                    >
                      <Plus className="w-4 h-4" />
                      <span>{isAddingBlog ? 'Zavřít formulář' : 'Přidat nový článek'}</span>
                    </button>
                  </div>

                  {isAddingBlog && (
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        if (!newBlogTitle.trim() || !newBlogExcerpt.trim()) return;
                        const slug = newBlogTitle
                          .toLowerCase()
                          .normalize('NFD')
                          .replace(/[\u0300-\u036f]/g, '')
                          .replace(/[^a-z0-9]+/g, '-')
                          .replace(/^-|-$/g, '');

                        const categoryImageMap: Record<BlogCategory, string> = {
                          'Trendy v rekonstrukcích': '/src/assets/images/blog_trends_interior_1795272927881.jpg',
                          'Údržba interiéru': '/src/assets/images/blog_maintenance_care_1795272929816.jpg',
                          'Materiály pro bytová jádra': '/src/assets/images/blog_core_materials_1795272929269.jpg',
                        };

                        try {
                          await api.addBlogPost({
                            slug: slug || 'clanek-' + Date.now(),
                            title: newBlogTitle.trim(),
                            category: newBlogCategory,
                            publishedAt: new Date().toISOString().slice(0, 10),
                            readTimeMinutes: 4,
                            excerpt: newBlogExcerpt.trim(),
                            contentSections: [
                              {
                                heading: 'Doporučení přímo ze stavby',
                                text:
                                  newBlogContent.trim() ||
                                  newBlogExcerpt.trim(),
                              },
                            ],
                            practicalTips: newBlogTip.trim() ? [newBlogTip.trim()] : [],
                            image: categoryImageMap[newBlogCategory],
                            imageAlt: newBlogTitle.trim(),
                            relatedServiceId:
                              newBlogCategory === 'Materiály pro bytová jádra'
                                ? 'srv-bytova-jadra'
                                : newBlogCategory === 'Údržba interiéru'
                                ? 'srv-obklady-dlazby'
                                : 'srv-rekonstrukce-bytu',
                            author: 'Tým STAVPARTA Zábřeh na Moravě',
                            isPublished: true,
                            featured: false,
                          });
                          setNewBlogTitle('');
                          setNewBlogExcerpt('');
                          setNewBlogContent('');
                          setNewBlogTip('');
                          setIsAddingBlog(false);
                          await onRefreshData?.();
                          showToast('Nový článek byl úspěšně publikován na blog.');
                        } catch (err) {
                          showToast(err instanceof ApiError ? err.message : 'Nepodařilo se uložit článek.');
                        }
                      }}
                      className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-4 text-xs"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block font-bold mb-1">Titulek článku *</label>
                          <input
                            type="text"
                            required
                            value={newBlogTitle}
                            onChange={(e) => setNewBlogTitle(e.target.value)}
                            placeholder="Např. Jak připravit panelové jádro před obkladem"
                            className="w-full px-3 py-2 bg-white border rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block font-bold mb-1">Rubrika</label>
                          <select
                            value={newBlogCategory}
                            onChange={(e) => setNewBlogCategory(e.target.value as BlogCategory)}
                            className="w-full px-3 py-2 bg-white border rounded-lg"
                          >
                            <option value="Trendy v rekonstrukcích">Trendy v rekonstrukcích</option>
                            <option value="Materiály pro bytová jádra">Materiály pro bytová jádra</option>
                            <option value="Údržba interiéru">Údržba interiéru</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block font-bold mb-1">Krátké shrnutí (perex) *</label>
                        <input
                          type="text"
                          required
                          value={newBlogExcerpt}
                          onChange={(e) => setNewBlogExcerpt(e.target.value)}
                          placeholder="Hlavní myšlenka článku zobrazená v přehledu..."
                          className="w-full px-3 py-2 bg-white border rounded-lg"
                        />
                      </div>

                      <div>
                        <label className="block font-bold mb-1">Hlavní text článku</label>
                        <textarea
                          rows={3}
                          value={newBlogContent}
                          onChange={(e) => setNewBlogContent(e.target.value)}
                          placeholder="Podrobný popis postupu, materiálů nebo údržby..."
                          className="w-full px-3 py-2 bg-white border rounded-lg"
                        />
                      </div>

                      <div>
                        <label className="block font-bold mb-1">Praktický tip z praxe (nepovinné)</label>
                        <input
                          type="text"
                          value={newBlogTip}
                          onChange={(e) => setNewBlogTip(e.target.value)}
                          placeholder="Konkrétní doporučení pro čtenáře..."
                          className="w-full px-3 py-2 bg-white border rounded-lg"
                        />
                      </div>

                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setIsAddingBlog(false)}
                          className="px-4 py-2 bg-slate-200 text-slate-700 font-semibold rounded-lg cursor-pointer"
                        >
                          Zrušit
                        </button>
                        <button
                          type="submit"
                          className="px-5 py-2 bg-[#17232D] hover:bg-[#263746] text-white font-bold rounded-lg cursor-pointer"
                        >
                          Publikovat článek
                        </button>
                      </div>
                    </form>
                  )}

                  <div className="space-y-3">
                    {blogPosts.map((post) => (
                      <div
                        key={post.id}
                        className="p-4 bg-white border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-[11px] text-slate-500">
                            <span className="font-bold text-[#F07818]">{post.category}</span>
                            <span>·</span>
                            <span>{post.publishedAt}</span>
                            <span>·</span>
                            <span
                              className={`font-bold ${
                                post.isPublished ? 'text-emerald-700' : 'text-slate-400'
                              }`}
                            >
                              {post.isPublished ? 'Publikováno' : 'Skryto'}
                            </span>
                          </div>
                          <h4 className="font-bold text-sm text-[#17232D]">{post.title}</h4>
                          <p className="text-xs text-slate-600 line-clamp-1">{post.excerpt}</p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                await api.updateBlogPost(post.id, { isPublished: !post.isPublished });
                                await onRefreshData?.();
                                showToast(
                                  post.isPublished ? 'Článek byl skryt.' : 'Článek byl publikován.'
                                );
                              } catch (err) {
                                showToast(err instanceof ApiError ? err.message : 'Nepodařilo se upravit článek.');
                              }
                            }}
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded cursor-pointer flex items-center gap-1"
                          >
                            {post.isPublished ? (
                              <>
                                <EyeOff className="w-3.5 h-3.5" />
                                <span>Skrýt</span>
                              </>
                            ) : (
                              <>
                                <Eye className="w-3.5 h-3.5" />
                                <span>Publikovat</span>
                              </>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              if (window.confirm(`Opravdu smazat článek "${post.title}"?`)) {
                                try {
                                  await api.deleteBlogPost(post.id);
                                  await onRefreshData?.();
                                  showToast('Článek byl smazán.');
                                } catch (err) {
                                  showToast(err instanceof ApiError ? err.message : 'Nepodařilo se smazat článek.');
                                }
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                            title="Smazat článek"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 4: TESTIMONIALS */}
              {activeTab === 'testimonials' && (
                <div className="space-y-6">
                  <div className="border-b border-slate-200 pb-4">
                    <h3 className="text-xl font-extrabold text-[#17232D]">Správa referencí</h3>
                    <p className="text-xs text-slate-500">
                      Ověřené reference zákazníků se souhlasem ke zveřejnění.
                    </p>
                  </div>

                  <div className="space-y-3">
                    {testimonials.map((t) => (
                      <div
                        key={t.id}
                        className="p-4 bg-white border border-slate-200 rounded-xl flex items-center justify-between"
                      >
                        <div>
                          <div className="font-bold text-sm text-[#17232D]">
                            {t.clientName} <span className="text-xs text-slate-400 font-normal">({t.projectType})</span>
                          </div>
                          <p className="text-xs text-slate-600 italic mt-1">„{t.text}“</p>
                        </div>
                        <span className="px-2 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded">
                          Souhlas udělen
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB: SUBSCRIBERS (Newsletter) */}
              {activeTab === 'subscribers' && (
                <div className="space-y-6">
                  <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-extrabold text-[#17232D]">
                          Odběratelé novinek (Newsletter)
                        </h3>
                        <span className="px-2 py-0.5 bg-[#F07818] text-white rounded text-xs font-bold">
                          {subscribers.length} e-mailů
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Seznam kontaktů přihlášených k odběru novinek o dokončených realizacích a akčních nabídkách.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={exportSubscribersToCsv}
                        disabled={subscribers.length === 0}
                        className="px-4 py-2 bg-[#17232D] hover:bg-[#263746] text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Exportovat do CSV</span>
                      </button>
                    </div>
                  </div>

                  {/* Search filter */}
                  <div className="flex items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-sm">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={subscriberSearchQuery}
                        onChange={(e) => setSubscriberSearchQuery(e.target.value)}
                        placeholder="Hledat e-mail odběratele..."
                        className="w-full pl-9 pr-3 py-2 text-xs border rounded-lg bg-white"
                      />
                    </div>
                    <div className="text-xs text-slate-500">
                      Zobrazeno:{' '}
                      <span className="font-bold text-slate-700">
                        {
                          subscribers.filter((s) =>
                            s.email.toLowerCase().includes(subscriberSearchQuery.toLowerCase())
                          ).length
                        }
                      </span>{' '}
                      z {subscribers.length}
                    </div>
                  </div>

                  {/* Table */}
                  <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs text-slate-700">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                          <tr>
                            <th className="px-4 py-3">E-mailová adresa</th>
                            <th className="px-4 py-3">Datum přihlášení</th>
                            <th className="px-4 py-3">Zdroj přihlášení</th>
                            <th className="px-4 py-3">GDPR souhlas</th>
                            <th className="px-4 py-3 text-right">Akce</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {subscribers
                            .filter((s) =>
                              s.email.toLowerCase().includes(subscriberSearchQuery.toLowerCase())
                            )
                            .map((sub) => (
                              <tr key={sub.id} className="hover:bg-slate-50/80 transition-colors">
                                <td className="px-4 py-3 font-semibold text-[#17232D]">
                                  <div className="flex items-center gap-2">
                                    <Mail className="w-3.5 h-3.5 text-[#F07818]" />
                                    <span>{sub.email}</span>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                                  {new Date(sub.createdAt).toLocaleDateString('cs-CZ', {
                                    day: 'numeric',
                                    month: 'numeric',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </td>
                                <td className="px-4 py-3 text-slate-500">
                                  <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[11px] font-medium">
                                    {sub.source === 'footer_newsletter' ? 'Patička webu' : sub.source || 'Web'}
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-[11px]">
                                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>Udělen</span>
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <button
                                    onClick={() => handleDeleteSubscriber(sub.id, sub.email)}
                                    title="Odebrat z odběru"
                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          {subscribers.length === 0 && (
                            <tr>
                              <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                                Zatím nebyli zaevidováni žádní odběratelé novinek.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: SETTINGS */}
              {activeTab === 'settings' && (
                <div className="space-y-6 max-w-2xl">
                  <div className="border-b border-slate-200 pb-4">
                    <h3 className="text-xl font-extrabold text-[#17232D]">Nastavení firmy</h3>
                    <p className="text-xs text-slate-500">
                      Kontakty na stavbu, fakturační údaje a heslo do administrace.
                    </p>
                  </div>

                  <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block font-bold mb-1">Telefon</label>
                        <input
                          type="text"
                          value={settingsForm.phone}
                          onChange={(e) => setSettingsForm({ ...settingsForm, phone: e.target.value })}
                          className="w-full px-3 py-2 border rounded"
                        />
                      </div>
                      <div>
                        <label className="block font-bold mb-1">E-mail</label>
                        <input
                          type="email"
                          value={settingsForm.email}
                          onChange={(e) => setSettingsForm({ ...settingsForm, email: e.target.value })}
                          className="w-full px-3 py-2 border rounded"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block font-bold mb-1">IČO</label>
                        <input
                          type="text"
                          value={settingsForm.ico}
                          onChange={(e) => setSettingsForm({ ...settingsForm, ico: e.target.value })}
                          className="w-full px-3 py-2 border rounded"
                        />
                      </div>
                      <div>
                        <label className="block font-bold mb-1">DIČ</label>
                        <input
                          type="text"
                          value={settingsForm.dic}
                          onChange={(e) => setSettingsForm({ ...settingsForm, dic: e.target.value })}
                          className="w-full px-3 py-2 border rounded"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block font-bold mb-1">Působnost (Region)</label>
                        <input
                          type="text"
                          value={settingsForm.operatingRegion}
                          onChange={(e) => setSettingsForm({ ...settingsForm, operatingRegion: e.target.value })}
                          placeholder="Zábřeh na Moravě & Olomoucký kraj"
                          className="w-full px-3 py-2 border rounded"
                        />
                      </div>
                      <div>
                        <label className="block font-bold mb-1">Pracovní doba</label>
                        <input
                          type="text"
                          value={settingsForm.workingHours}
                          onChange={(e) => setSettingsForm({ ...settingsForm, workingHours: e.target.value })}
                          placeholder="Po–Pá: 7:00–18:00"
                          className="w-full px-3 py-2 border rounded"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold mb-1">Sídlo a adresa centrály</label>
                      <input
                        type="text"
                        value={settingsForm.addressNotice}
                        onChange={(e) => setSettingsForm({ ...settingsForm, addressNotice: e.target.value })}
                        placeholder="Sídlo a zázemí party: Zábřeh na Moravě (PSČ 789 01)"
                        className="w-full px-3 py-2 border rounded"
                      />
                    </div>

                    {/* Email notification system settings */}
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-[#F07818]" />
                        <span className="font-bold text-slate-800 text-xs">E-mailové notifikace nových poptávek</span>
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settingsForm.notifyEmailEnabled ?? true}
                          onChange={(e) =>
                            setSettingsForm({ ...settingsForm, notifyEmailEnabled: e.target.checked })
                          }
                          className="w-4 h-4 text-[#F07818] rounded"
                        />
                        <span className="text-slate-700">Aktivovat automatické notifikace při přijetí nové poptávky</span>
                      </label>

                      <div>
                        <label className="block font-bold text-slate-600 mb-1">Cílový e-mail pro notifikace</label>
                        <input
                          type="email"
                          value={settingsForm.notifyEmailAddress || settingsForm.email}
                          onChange={(e) =>
                            setSettingsForm({ ...settingsForm, notifyEmailAddress: e.target.value })
                          }
                          placeholder="poptavky@stavparta.cz"
                          className="w-full px-3 py-2 border rounded bg-white"
                        />
                        <p className="text-[11px] text-slate-500 mt-1">
                          Při odeslání formuláře zákazníkem je generována okamžitá zpráva na tento e-mail.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const targetMail = settingsForm.notifyEmailAddress || settingsForm.email || 'stavparta@email.cz';
                          setSimulatedEmailNotification(
                            `Předmět: [STAVPARTA] Nová poptávka z webu: Rekonstrukce bytového jádra - Petr Novák\n` +
                            `Komu: ${targetMail}\n` +
                            `Datum: ${new Date().toLocaleString('cs-CZ')}\n\n` +
                            `Zákazník: Petr Novák\n` +
                            `Telefon: +420 777 123 456\n` +
                            `E-mail: petr.novak@email.cz\n` +
                            `Lokalita stavby: Olomouc - Neředín\n` +
                            `Poptávaná služba: Kompletní renovace bytových jader\n` +
                            `Typ objektu: Panelový byt\n` +
                            `Požadavek na změnu dispozice: Ano, propojení koupelny s WC\n` +
                            `Sanitární řešení: Walk-in sprchový kout + závěsné WC Geberit\n` +
                            `Termín: Duben / Květen\n` +
                            `Zpráva zákazníka: Dobrý den, poptáváme kompletní rekonstrukci umakartového jádra v paneláku. Rádi bychom domluvili nezávazné zaměření.\n\n` +
                            `Status: Zpráva byla úspěšně zpracována a uložena do interní databáze STAVPARTA.`
                          );
                          showToast('Testovací notifikace vygenerována.');
                        }}
                        className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded text-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5 text-[#F07818]" />
                        <span>Simulovat odeslání testovací e-mailové notifikace</span>
                      </button>
                    </div>

                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-[#F07818] hover:bg-[#d9660e] text-white font-bold rounded shadow cursor-pointer"
                    >
                      Uložit nastavení
                    </button>
                  </form>

                  {/* Password Change */}
                  <div className="pt-6 border-t border-slate-200">
                    <h4 className="font-bold text-sm text-[#17232D] mb-2">Změna přístupového hesla</h4>
                    <form onSubmit={handleSavePassword} className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <input
                        type="password"
                        placeholder="Stávající heslo..."
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="px-3 py-2 text-xs border rounded"
                      />
                      <input
                        type="password"
                        placeholder="Nové heslo (min. 8 znaků)..."
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="px-3 py-2 text-xs border rounded"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 bg-[#17232D] hover:bg-[#263746] text-white text-xs font-bold rounded cursor-pointer"
                      >
                        Změnit heslo
                      </button>
                    </form>
                    {passwordChangeSuccess && (
                      <p className="text-xs text-emerald-600 mt-2 font-medium">Heslo bylo úspěšně změněno.</p>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 6: BACKUPS */}
              {activeTab === 'backups' && (
                <div className="space-y-6 max-w-3xl">
                  <div className="border-b border-slate-200 pb-4">
                    <h3 className="text-xl font-extrabold text-[#17232D]">
                      Zálohování a export všech dat (Zero Lock-in)
                    </h3>
                    <p className="text-xs text-slate-500">
                      Garantujeme 100% vlastnictví dat. Všechny poptávky, realizace i služby můžete kdykoliv exportovat.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                      <div className="w-8 h-8 rounded bg-emerald-100 text-emerald-700 flex items-center justify-center">
                        <Download className="w-4 h-4" />
                      </div>
                      <h4 className="font-bold text-xs text-[#17232D]">JSON záloha</h4>
                      <button
                        onClick={() =>
                          exportDatabaseToJson({
                            settings,
                            services,
                            projects,
                            testimonials,
                            leads,
                            subscribers,
                            blogPosts,
                          })
                        }
                        className="w-full py-2 bg-[#17232D] hover:bg-[#263746] text-white text-xs font-bold rounded"
                      >
                        Stáhnout JSON
                      </button>
                    </div>

                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                      <div className="w-8 h-8 rounded bg-blue-100 text-blue-700 flex items-center justify-center">
                        <FileSpreadsheet className="w-4 h-4" />
                      </div>
                      <h4 className="font-bold text-xs text-[#17232D]">Export CSV (Excel)</h4>
                      <button
                        onClick={() => exportLeadsToCsv(leads)}
                        className="w-full py-2 bg-[#17232D] hover:bg-[#263746] text-white text-xs font-bold rounded"
                      >
                        Stáhnout CSV
                      </button>
                    </div>

                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                      <div className="w-8 h-8 rounded bg-amber-100 text-amber-700 flex items-center justify-center">
                        <Archive className="w-4 h-4" />
                      </div>
                      <h4 className="font-bold text-xs text-[#17232D]">Kompletní ZIP</h4>
                      <button
                        onClick={() =>
                          exportFullBackupZip({
                            settings,
                            services,
                            projects,
                            testimonials,
                            leads,
                            subscribers,
                            blogPosts,
                          })
                        }
                        className="w-full py-2 bg-[#F07818] hover:bg-[#d9660e] text-white text-xs font-bold rounded"
                      >
                        Stáhnout ZIP
                      </button>
                    </div>
                  </div>

                  <div className="p-5 bg-white border border-slate-200 rounded-xl space-y-3">
                    <h4 className="font-bold text-sm text-[#17232D] flex items-center gap-2">
                      <Upload className="w-4 h-4 text-[#F07818]" />
                      <span>Obnovení databáze ze souboru</span>
                    </h4>
                    <input
                      type="file"
                      accept=".json"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (window.confirm('Opravdu si přejete přepsat data z vybraného JSON souboru?')) {
                          try {
                            const success = await importDatabaseFromJson(file);
                            if (success) {
                              await onRefreshData?.();
                              await refreshSubscribers();
                              showToast('Data byla úspěšně ověřena a obnovena na serveru!');
                            }
                          } catch (err: unknown) {
                            const msg = err instanceof Error ? err.message : 'Neočekávaná chyba';
                            showToast('Chyba při nahrávání: ' + msg);
                          }
                        }
                      }}
                      className="text-xs text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
                    />
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={async () => {
                        if (window.confirm('Obnovit výchozí demo data pro prezentaci?')) {
                          try {
                            await api.resetDemoData();
                            await onRefreshData?.();
                            await refreshSubscribers();
                            showToast('Data byla obnovena.');
                          } catch (err) {
                            showToast(err instanceof ApiError ? err.message : 'Obnova dat selhala.');
                          }
                        }
                      }}
                      className="text-xs text-slate-400 hover:text-slate-700 underline flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Obnovit výchozí data</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Email Simulation Modal */}
        {simulatedEmailNotification && (
          <div className="fixed inset-0 z-70 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-orange-100 text-[#F07818] flex items-center justify-center">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-[#17232D]">
                      Náhled automatické e-mailové notifikace
                    </h4>
                    <span className="text-[11px] text-slate-500">
                      Simulace doručení na SMTP / e-mail firmy
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSimulatedEmailNotification(null)}
                  className="p-1 text-slate-400 hover:text-slate-800 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-slate-900 text-slate-100 p-4 rounded-lg font-mono text-[11px] leading-relaxed whitespace-pre-wrap max-h-80 overflow-y-auto border border-slate-700">
                {simulatedEmailNotification}
              </div>

              <div className="flex justify-between items-center pt-2">
                <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> E-mailový template je připraven k napojení na SMTP
                </span>
                <button
                  onClick={() => setSimulatedEmailNotification(null)}
                  className="px-4 py-2 bg-[#17232D] hover:bg-[#263746] text-white text-xs font-bold rounded cursor-pointer"
                >
                  Zavřít náhled
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Itemized Quotation Generator Modal */}
        {quotingLead && (
          <QuotationGeneratorModal
            lead={quotingLead}
            settings={settings}
            onClose={() => setQuotingLead(null)}
            onSaveQuoteToLeadNotes={async (note) => {
              try {
                const res = await api.addLeadNote(quotingLead.id, note, 'Admin');
                if (selectedLead?.id === quotingLead.id) {
                  setSelectedLead(res.lead);
                }
                await onRefreshData?.();
                showToast('Cenová nabídka zapsána do historie zakázky.');
              } catch (err) {
                showToast(err instanceof ApiError ? err.message : 'Nepodařilo se zapsat nabídku do poznámek.');
              }
            }}
          />
        )}
      </div>
    </div>
  );
};
