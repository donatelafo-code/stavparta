import React, { useState, useEffect, useCallback, useRef, lazy, Suspense } from 'react';
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
  AlertTriangle,
  MessageSquare,
} from 'lucide-react';
import {
  BlogCategory,
  BlogPost,
  ChatLogEntry,
  Lead,
  LeadStatus,
  Project,
  ServiceItem,
  SiteSettings,
  Testimonial,
  NewsletterSubscriber,
} from '../types';
import { STATUS_LABELS } from '../shared/seedData';
import { IMAGE_PATHS } from '../shared/responsiveImages';
import { getLaunchReadinessMissingItems } from '../shared/launchReadiness';
import { api, ApiError, AdminAuthUser } from '../services/api';
import {
  exportDatabaseToJson,
  exportLeadsToCsv,
  exportFullBackupZip,
  importDatabaseFromJson,
} from '../services/export';
import { useModalAccessibility } from '../hooks/useModalAccessibility';

const LazyQuotationGeneratorModal = lazy(() =>
  import('./QuotationGeneratorModal').then((m) => ({ default: m.QuotationGeneratorModal }))
);

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

  const [activeTab, setActiveTab] = useState<'leads' | 'services' | 'projects' | 'blog' | 'testimonials' | 'subscribers' | 'chatLogs' | 'settings' | 'backups'>('leads');
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [subscriberSearchQuery, setSubscriberSearchQuery] = useState('');
  const [chatLogs, setChatLogs] = useState<ChatLogEntry[]>([]);
  const [chatLogsSearchQuery, setChatLogsSearchQuery] = useState('');

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
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [clearingDemo, setClearingDemo] = useState(false);
  const [gdprEraseEmail, setGdprEraseEmail] = useState('');
  const [gdprErasing, setGdprErasing] = useState(false);
  const [gdprEraseResult, setGdprEraseResult] = useState<{
    normalizedEmail: string;
    deletedLeadsCount: number;
    deletedAttachmentsCount: number;
    deletedSubscribersCount: number;
  } | null>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [simulatedEmailNotification, setSimulatedEmailNotification] = useState<string | null>(null);

  const adminModalRef = useRef<HTMLDivElement>(null);
  const leadDetailModalRef = useRef<HTMLDivElement>(null);
  const emailModalRef = useRef<HTMLDivElement>(null);

  useModalAccessibility({
    isOpen: true,
    containerRef: adminModalRef,
    onClose,
  });

  useModalAccessibility({
    isOpen: Boolean(selectedLead),
    containerRef: leadDetailModalRef,
    onClose: () => setSelectedLead(null),
  });

  useModalAccessibility({
    isOpen: Boolean(simulatedEmailNotification),
    containerRef: emailModalRef,
    onClose: () => setSimulatedEmailNotification(null),
  });

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

  const refreshChatLogs = useCallback(async () => {
    try {
      const res = await api.getChatLogs(100);
      setChatLogs(res.logs);
    } catch {
      setChatLogs([]);
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
        const [subsRes, logsRes] = await Promise.all([
          api.getSubscribers(),
          api.getChatLogs(100),
        ]);
        if (active) {
          setSubscribers(subsRes.subscribers);
          setChatLogs(logsRes.logs);
        }
      } catch {
        if (active) {
          setSubscribers([]);
          setChatLogs([]);
        }
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
    setChatLogs([]);
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

  const handleClearDemoForProduction = async () => {
    if (
      !window.confirm(
        'Opravdu chcete trvale smazat všechny ukázkové DEMO realizace a DEMO reference ze serverové databáze?'
      )
    ) {
      return;
    }
    setClearingDemo(true);
    try {
      const res = await api.clearDemoData();
      if (!res.verifiedClean || res.remainingDemoProjects > 0 || res.remainingDemoTestimonials > 0) {
        showToast(
          `Upozornění: V databázi zůstalo ${res.remainingDemoProjects} demo realizací a ${res.remainingDemoTestimonials} demo referencí.`
        );
      } else {
        await onRefreshData?.();
        showToast('Demo realizace a demo reference byly smazány a ověřeny jako čisté.');
      }
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Nepodařilo se smazat demo data.');
    } finally {
      setClearingDemo(false);
    }
  };

  const handleGdprErase = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetEmail = gdprEraseEmail.trim().toLowerCase();
    if (!targetEmail) {
      showToast('Zadejte prosím e-mailovou adresu subjektu údajů.');
      return;
    }
    if (
      !window.confirm(
        `Opravdu si přejete trvale smazat veškeré poptávky, přiložené soubory a odběry novinek pro e-mail ${targetEmail}? Tuto akci nelze vrátit.`
      )
    ) {
      return;
    }

    setGdprErasing(true);
    setGdprEraseResult(null);
    try {
      const res = await api.eraseGdprByEmail(targetEmail);
      setGdprEraseResult({
        normalizedEmail: res.normalizedEmail,
        deletedLeadsCount: res.deletedLeadsCount,
        deletedAttachmentsCount: res.deletedAttachmentsCount,
        deletedSubscribersCount: res.deletedSubscribersCount,
      });
      setGdprEraseEmail('');
      await onRefreshData?.();
      await refreshSubscribers();
      showToast(`GDPR výmaz pro ${res.normalizedEmail} byl dokončen.`);
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Výmaz osobních údajů selhal.');
    } finally {
      setGdprErasing(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const missingFields = getLaunchReadinessMissingItems(settingsForm);
    if (missingFields.length > 0) {
      setSettingsError(`Vyplňte prosím povinná pole: ${missingFields.join(', ')}.`);
      showToast('Chybí povinné údaje firmy.');
      return;
    }
    setSettingsError(null);
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
  const missingLaunchItems = getLaunchReadinessMissingItems(settings, projects, testimonials);
  const hasDemoItems = projects.some((p) => p.isDemo) || testimonials.some((t) => t.isDemo);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        ref={adminModalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-modal-title"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="bg-[#F8FAFC] text-slate-800 rounded-2xl shadow-2xl max-w-6xl w-full h-[92vh] flex flex-col overflow-hidden border border-slate-300 outline-none"
      >
        {/* Toast alert */}
        {toastMessage && (
          <div
            role="status"
            aria-live="polite"
            className="absolute top-4 right-1/2 translate-x-1/2 z-60 bg-[#17232D] text-white px-4 py-2 rounded-lg text-xs font-semibold shadow-xl border border-slate-700 flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 text-[#F07818]" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Admin Header */}
        <div className="bg-[#17232D] text-white px-6 py-4 flex items-center justify-between border-b border-[#263746]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-[#C2560A] flex items-center justify-center text-white font-bold">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h2 id="admin-modal-title" className="text-base font-extrabold tracking-tight">
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
              <RefreshCw className="w-6 h-6 text-[#B84F00] animate-spin mx-auto" />
              <p className="text-xs font-semibold text-slate-600">Ověřuji relaci správce...</p>
            </div>
          </div>
        ) : !adminUser && setupRequired ? (
          <div className="flex-1 flex items-center justify-center p-6 bg-slate-100">
            <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-8 max-w-md w-full space-y-6">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-[#C2560A]/10 text-[#B84F00] rounded-xl flex items-center justify-center mx-auto">
                  <Key className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-extrabold text-[#17232D]">Prvotní nastavení správce</h3>
                <p className="text-xs text-slate-500">
                  Zatím není nastaven žádný administrátorský účet. Zvolte si vlastní silné heslo pro účet <strong>admin</strong>.
                </p>
              </div>

              <form onSubmit={handleSetupAdmin} className="space-y-4">
                <div>
                  <label htmlFor="admin-setup-password" className="block text-xs font-bold text-slate-700 mb-1">
                    Nové heslo správce (min. 8 znaků)
                  </label>
                  <input
                    id="admin-setup-password"
                    type="password"
                    required
                    minLength={8}
                    aria-invalid={Boolean(authError)}
                    aria-describedby={authError ? 'admin-setup-error' : undefined}
                    value={setupPasswordInput}
                    onChange={(e) => setSetupPasswordInput(e.target.value)}
                    placeholder="Zadejte silné heslo..."
                    className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:border-[#C2560A]"
                    autoFocus
                  />
                </div>
                <div>
                  <label htmlFor="admin-setup-confirm" className="block text-xs font-bold text-slate-700 mb-1">
                    Potvrzení hesla
                  </label>
                  <input
                    id="admin-setup-confirm"
                    type="password"
                    required
                    minLength={8}
                    aria-invalid={Boolean(authError)}
                    aria-describedby={authError ? 'admin-setup-error' : undefined}
                    value={setupConfirmInput}
                    onChange={(e) => setSetupConfirmInput(e.target.value)}
                    placeholder="Zadejte heslo znovu..."
                    className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:border-[#C2560A]"
                  />
                </div>
                {authError && (
                  <p id="admin-setup-error" role="alert" className="text-xs text-rose-700 font-medium">
                    {authError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={authSubmitting}
                  className="w-full py-3 bg-[#C2560A] hover:bg-[#9E4306] text-white font-bold text-sm rounded-lg shadow transition-all cursor-pointer disabled:opacity-60"
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
                <div className="w-12 h-12 bg-amber-100 text-amber-800 rounded-xl flex items-center justify-center mx-auto">
                  <Key className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-extrabold text-[#17232D]">Povinná změna hesla</h3>
                <p className="text-xs text-slate-600">
                  Přihlašujete se poprvé s inicializačním heslem. Před zpřístupněním poptávek si prosím nastavte nové osobní heslo.
                </p>
              </div>

              <form onSubmit={handleForcedPasswordChange} className="space-y-4">
                <div>
                  <label htmlFor="admin-forced-current" className="block text-xs font-bold text-slate-700 mb-1">
                    Stávající inicializační heslo
                  </label>
                  <input
                    id="admin-forced-current"
                    type="password"
                    required
                    aria-invalid={Boolean(forcedPassError)}
                    aria-describedby={forcedPassError ? 'admin-forced-error' : undefined}
                    value={forcedCurrentPassword}
                    onChange={(e) => setForcedCurrentPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:border-[#C2560A]"
                    autoFocus
                  />
                </div>
                <div>
                  <label htmlFor="admin-forced-new" className="block text-xs font-bold text-slate-700 mb-1">
                    Nové heslo (min. 8 znaků)
                  </label>
                  <input
                    id="admin-forced-new"
                    type="password"
                    required
                    minLength={8}
                    aria-invalid={Boolean(forcedPassError)}
                    aria-describedby={forcedPassError ? 'admin-forced-error' : undefined}
                    value={forcedNewPassword}
                    onChange={(e) => setForcedNewPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:border-[#C2560A]"
                  />
                </div>
                <div>
                  <label htmlFor="admin-forced-confirm" className="block text-xs font-bold text-slate-700 mb-1">
                    Potvrzení nového hesla
                  </label>
                  <input
                    id="admin-forced-confirm"
                    type="password"
                    required
                    minLength={8}
                    aria-invalid={Boolean(forcedPassError)}
                    aria-describedby={forcedPassError ? 'admin-forced-error' : undefined}
                    value={forcedConfirmPassword}
                    onChange={(e) => setForcedConfirmPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:border-[#C2560A]"
                  />
                </div>
                {forcedPassError && (
                  <p id="admin-forced-error" role="alert" className="text-xs text-rose-700 font-medium">
                    {forcedPassError}
                  </p>
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
                <div className="w-12 h-12 bg-[#C2560A]/10 text-[#B84F00] rounded-xl flex items-center justify-center mx-auto">
                  <Key className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-extrabold text-[#17232D]">Přihlášení do administrace</h3>
                <p className="text-xs text-slate-500">
                  Zadejte přístupové údaje správce pro zobrazení poptávek a správu obsahu.
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label htmlFor="admin-login-username" className="block text-xs font-bold text-slate-700 mb-1">
                    Uživatelské jméno
                  </label>
                  <input
                    id="admin-login-username"
                    type="text"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    autoComplete="username"
                    className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:border-[#C2560A]"
                  />
                </div>
                <div>
                  <label htmlFor="admin-login-password" className="block text-xs font-bold text-slate-700 mb-1">
                    Přístupové heslo
                  </label>
                  <input
                    id="admin-login-password"
                    type="password"
                    required
                    aria-invalid={Boolean(authError)}
                    aria-describedby={authError ? 'admin-login-error' : undefined}
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    autoComplete="current-password"
                    placeholder="Zadejte heslo..."
                    className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:border-[#C2560A]"
                    autoFocus
                  />
                  {authError && (
                    <p id="admin-login-error" role="alert" className="text-xs text-rose-700 mt-1.5 font-medium">
                      {authError}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={authSubmitting}
                  className="w-full py-3 bg-[#C2560A] hover:bg-[#9E4306] text-white font-bold text-sm rounded-lg shadow transition-all cursor-pointer disabled:opacity-60"
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
                      ? 'bg-[#C2560A] text-white shadow-sm'
                      : 'hover:bg-[#263746] text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Inbox className="w-4 h-4" />
                    <span>Poptávky</span>
                  </div>
                  {newLeadsCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full bg-white text-[#B84F00] font-bold text-[10px]">
                      {newLeadsCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setActiveTab('services')}
                  className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    activeTab === 'services'
                      ? 'bg-[#C2560A] text-white shadow-sm'
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
                      ? 'bg-[#C2560A] text-white shadow-sm'
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
                      ? 'bg-[#C2560A] text-white shadow-sm'
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
                      ? 'bg-[#C2560A] text-white shadow-sm'
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
                      ? 'bg-[#C2560A] text-white shadow-sm'
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
                  onClick={() => setActiveTab('chatLogs')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    activeTab === 'chatLogs'
                      ? 'bg-[#C2560A] text-white shadow-sm'
                      : 'hover:bg-[#263746] text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    <span>Chat dotazy</span>
                  </div>
                  <span className="px-1.5 py-0.5 rounded-full bg-[#0F171E] text-slate-200 text-[10px] font-bold">
                    {chatLogs.length}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('settings')}
                  className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    activeTab === 'settings'
                      ? 'bg-[#C2560A] text-white shadow-sm'
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
                      ? 'bg-[#C2560A] text-white shadow-sm'
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
              {missingLaunchItems.length > 0 && (
                <div
                  role="alert"
                  className="mb-6 p-4 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-950 space-y-3"
                >
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="space-y-1.5 flex-1">
                      <h4 className="font-extrabold text-sm text-amber-950">
                        Web není připraven k ostrému provozu
                      </h4>
                      <p className="text-amber-900">
                        Před spuštěním pro veřejnost doplňte následující povinné údaje a odstraňte ukázkový obsah:
                      </p>
                      <ul className="list-disc pl-5 space-y-0.5 font-medium text-amber-950">
                        {missingLaunchItems.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 pl-7">
                    <button
                      type="button"
                      onClick={() => setActiveTab('settings')}
                      className="px-3 py-1.5 bg-[#17232D] hover:bg-[#263746] text-white font-bold rounded-lg cursor-pointer"
                    >
                      Doplnit údaje v nastavení
                    </button>
                    {hasDemoItems && (
                      <button
                        type="button"
                        disabled={clearingDemo}
                        onClick={() => void handleClearDemoForProduction()}
                        className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg cursor-pointer disabled:opacity-60"
                      >
                        {clearingDemo
                          ? 'Mazání demo dat...'
                          : 'Vyčistit demo data pro ostrý provoz'}
                      </button>
                    )}
                  </div>
                </div>
              )}

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
                        <label htmlFor="admin-lead-search" className="sr-only">
                          Hledat poptávku podle jména, e-mailu, města nebo služby
                        </label>
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                        <input
                          id="admin-lead-search"
                          type="text"
                          placeholder="Hledat podle jména, e-mailu, města nebo služby..."
                          value={leadSearchQuery}
                          onChange={(e) => setLeadSearchQuery(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-[#C2560A]"
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
                              ? 'bg-[#C2560A] text-white font-bold'
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
                                      <div className="text-[10px] text-[#B84F00] font-medium">{lead.phone}</div>
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
                                      aria-label={`Změnit stav poptávky #${lead.id}`}
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
                                        className="px-2 py-1 text-xs font-bold text-[#B84F00] hover:text-white hover:bg-[#C2560A] bg-orange-50 border border-orange-200 rounded transition-colors flex items-center gap-1 cursor-pointer"
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
                                        className="p-1 text-slate-500 hover:text-rose-700 rounded transition-colors cursor-pointer"
                                        title="Smazat poptávku"
                                        aria-label={`Smazat poptávku #${lead.id}`}
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
                    <div
                      className="fixed inset-0 z-60 bg-black/60 flex items-center justify-center p-4"
                      onClick={() => setSelectedLead(null)}
                    >
                      <div
                        ref={leadDetailModalRef}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="admin-lead-detail-title"
                        tabIndex={-1}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[88vh] overflow-y-auto p-6 border border-slate-200 outline-none"
                      >
                        <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
                          <div>
                            <span className="text-xs font-bold font-mono text-[#B84F00]">
                              Poptávka #{selectedLead.id}
                            </span>
                            <h4 id="admin-lead-detail-title" className="text-lg font-extrabold text-[#17232D]">
                              {selectedLead.name}
                            </h4>
                          </div>
                          <div className="flex items-center gap-2 sm:gap-3">
                            <button
                              type="button"
                              onClick={() => setQuotingLead(selectedLead)}
                              className="px-2.5 py-1 bg-[#C2560A] hover:bg-[#9E4306] text-white text-xs font-bold rounded flex items-center gap-1.5 cursor-pointer shadow-xs"
                              title="Vygenerovat položkový rozpočet pro zákazníka"
                            >
                              <FileSpreadsheet className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Vytvořit cenovou nabídku</span>
                              <span className="sm:hidden">Nabídka</span>
                            </button>

                            <div className="flex items-center gap-1.5">
                              <label htmlFor="admin-detail-status" className="text-[11px] text-slate-500 font-bold hidden sm:inline">
                                Stav:
                              </label>
                              <select
                                id="admin-detail-status"
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
                              type="button"
                              onClick={() => setSelectedLead(null)}
                              aria-label="Zavřít detail poptávky"
                              className="p-1 text-slate-500 hover:text-slate-900 cursor-pointer"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-lg border border-slate-200 mb-4">
                          <div>
                            <span className="text-slate-500 block">E-mail:</span>
                            <a href={`mailto:${selectedLead.email}`} className="font-bold text-[#B84F00] underline">
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
                            <span className="text-xs font-bold text-slate-700 block mb-2">
                              Přiložená fotodokumentace / plány ({selectedLead.attachments.length}):
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              {selectedLead.attachments.map((att, i) => {
                                const isImage = att.type.startsWith('image/');
                                const downloadUrl = att.url
                                  ? `${att.url}${att.url.includes('?') ? '&' : '?'}download=1`
                                  : undefined;
                                return (
                                  <div
                                    key={att.id || `${att.name}-${i}`}
                                    className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs flex items-center gap-3"
                                  >
                                    {isImage && att.url ? (
                                      <a
                                        href={att.url}
                                        download={att.name}
                                        title={`Zobrazit nebo stáhnout ${att.name}`}
                                        className="w-16 h-12 rounded overflow-hidden border border-slate-200 bg-white shrink-0 block"
                                      >
                                        <img
                                          src={att.url}
                                          alt={`Náhled přílohy: ${att.name}`}
                                          className="w-full h-full object-cover"
                                        />
                                      </a>
                                    ) : (
                                      <div className="w-10 h-10 rounded bg-orange-50 border border-orange-200 flex items-center justify-center shrink-0">
                                        <FileText className="w-5 h-5 text-[#B84F00]" />
                                      </div>
                                    )}

                                    <div className="min-w-0 flex-1">
                                      <div className="font-semibold text-slate-800 truncate" title={att.name}>
                                        {att.name}
                                      </div>
                                      <div className="text-[10px] text-slate-500 flex items-center gap-2 mt-0.5">
                                        <span>{att.size} KB</span>
                                        <span>·</span>
                                        <span>{att.type === 'application/pdf' ? 'PDF' : 'Obrázek'}</span>
                                      </div>
                                      {downloadUrl ? (
                                        <a
                                          href={downloadUrl}
                                          download={att.name}
                                          className="inline-flex items-center gap-1 text-[11px] font-bold text-[#B84F00] hover:underline mt-1"
                                        >
                                          <Download className="w-3 h-3" />
                                          <span>{isImage ? 'Stáhnout foto' : 'Stáhnout PDF'}</span>
                                        </a>
                                      ) : (
                                        <span className="inline-block text-[10px] text-slate-500 mt-1">
                                          Pouze metadata (bez souboru)
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
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
                                <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                                  <span className="font-bold text-slate-600">{note.author}</span>
                                  <span>{new Date(note.createdAt).toLocaleString('cs-CZ')}</span>
                                </div>
                                <p className="text-slate-700">{note.text}</p>
                              </div>
                            ))}
                          </div>

                          <form onSubmit={handleAddLeadNote} className="flex gap-2">
                            <label htmlFor="admin-lead-note-input" className="sr-only">
                              Interní poznámka k poptávce
                            </label>
                            <input
                              id="admin-lead-note-input"
                              type="text"
                              value={newNoteText}
                              onChange={(e) => setNewNoteText(e.target.value)}
                              placeholder="Přidat interní poznámku (např. Zaměření v pátek 15:00)..."
                              className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:border-[#C2560A]"
                            />
                            <button
                              type="submit"
                              className="px-3 py-1.5 bg-[#17232D] text-white text-xs font-bold rounded hover:bg-[#263746] cursor-pointer"
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
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#B84F00]">
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
                          <span className="text-xs font-bold text-[#B84F00]">
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
                        <div className="text-[11px] text-slate-500">
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
                      className="px-4 py-2 bg-[#C2560A] hover:bg-[#9E4306] text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
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
                          'Trendy v rekonstrukcích': IMAGE_PATHS.BLOG_TRENDS,
                          'Údržba interiéru': IMAGE_PATHS.BLOG_MAINTENANCE,
                          'Materiály pro bytová jádra': IMAGE_PATHS.BLOG_MATERIALS,
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
                          <label htmlFor="admin-blog-title" className="block font-bold mb-1">
                            Titulek článku *
                          </label>
                          <input
                            id="admin-blog-title"
                            type="text"
                            required
                            value={newBlogTitle}
                            onChange={(e) => setNewBlogTitle(e.target.value)}
                            placeholder="Např. Jak připravit panelové jádro před obkladem"
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg"
                          />
                        </div>
                        <div>
                          <label htmlFor="admin-blog-category" className="block font-bold mb-1">
                            Rubrika
                          </label>
                          <select
                            id="admin-blog-category"
                            value={newBlogCategory}
                            onChange={(e) => setNewBlogCategory(e.target.value as BlogCategory)}
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg"
                          >
                            <option value="Trendy v rekonstrukcích">Trendy v rekonstrukcích</option>
                            <option value="Materiály pro bytová jádra">Materiály pro bytová jádra</option>
                            <option value="Údržba interiéru">Údržba interiéru</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label htmlFor="admin-blog-excerpt" className="block font-bold mb-1">
                          Krátké shrnutí (perex) *
                        </label>
                        <input
                          id="admin-blog-excerpt"
                          type="text"
                          required
                          value={newBlogExcerpt}
                          onChange={(e) => setNewBlogExcerpt(e.target.value)}
                          placeholder="Hlavní myšlenka článku zobrazená v přehledu..."
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg"
                        />
                      </div>

                      <div>
                        <label htmlFor="admin-blog-content" className="block font-bold mb-1">
                          Hlavní text článku
                        </label>
                        <textarea
                          id="admin-blog-content"
                          rows={3}
                          value={newBlogContent}
                          onChange={(e) => setNewBlogContent(e.target.value)}
                          placeholder="Podrobný popis postupu, materiálů nebo údržby..."
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg"
                        />
                      </div>

                      <div>
                        <label htmlFor="admin-blog-tip" className="block font-bold mb-1">
                          Praktický tip z praxe (nepovinné)
                        </label>
                        <input
                          id="admin-blog-tip"
                          type="text"
                          value={newBlogTip}
                          onChange={(e) => setNewBlogTip(e.target.value)}
                          placeholder="Konkrétní doporučení pro čtenáře..."
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg"
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
                            <span className="font-bold text-[#B84F00]">{post.category}</span>
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
                        <span className="px-2 py-0.5 bg-[#C2560A] text-white rounded text-xs font-bold">
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
                      <label htmlFor="admin-subscriber-search" className="sr-only">
                        Hledat e-mail odběratele
                      </label>
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        id="admin-subscriber-search"
                        type="text"
                        value={subscriberSearchQuery}
                        onChange={(e) => setSubscriberSearchQuery(e.target.value)}
                        placeholder="Hledat e-mail odběratele..."
                        className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
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
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
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
                                    <Mail className="w-3.5 h-3.5 text-[#B84F00]" />
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
                                    aria-label={`Odebrat odběratele ${sub.email}`}
                                    className="p-1.5 text-slate-500 hover:text-rose-700 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          {subscribers.length === 0 && (
                            <tr>
                              <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
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

              {/* TAB: CHAT LOGS */}
              {activeTab === 'chatLogs' && (
                <div className="space-y-6">
                  <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-extrabold text-[#17232D]">
                          Historie dotazů v chatovém asistentovi
                        </h3>
                        <span className="px-2 py-0.5 bg-[#17232D] text-white rounded text-xs font-bold">
                          {chatLogs.length} záznamů
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Anonymizovaný přehled dotazů návštěvníků bez ukládání osobních údajů navíc.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => void refreshChatLogs()}
                      className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Obnovit přehled</span>
                    </button>
                  </div>

                  <div className="relative max-w-md">
                    <label htmlFor="admin-chatlog-search" className="sr-only">
                      Hledat v dotazech nebo odpovědích asistenta
                    </label>
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="admin-chatlog-search"
                      type="text"
                      value={chatLogsSearchQuery}
                      onChange={(e) => setChatLogsSearchQuery(e.target.value)}
                      placeholder="Hledat v dotazech nebo odpovědích..."
                      className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                    />
                  </div>

                  {chatLogs.length === 0 ? (
                    <div className="p-10 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                      Zatím nebyly zaznamenány žádné konverzace s chatovým asistentem.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {chatLogs
                        .filter((entry) => {
                          const q = chatLogsSearchQuery.trim().toLowerCase();
                          if (!q) return true;
                          return (
                            entry.userMessage.toLowerCase().includes(q) ||
                            entry.assistantReply.toLowerCase().includes(q) ||
                            entry.suggestedServiceId.toLowerCase().includes(q)
                          );
                        })
                        .map((entry) => (
                          <div
                            key={entry.id}
                            className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs space-y-2.5 text-xs"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
                                    entry.status === 'ok'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : entry.status === 'rejected'
                                        ? 'bg-rose-100 text-rose-800'
                                        : entry.status === 'rate_limited'
                                          ? 'bg-amber-100 text-amber-800'
                                          : 'bg-slate-200 text-slate-700'
                                  }`}
                                >
                                  {entry.status === 'ok'
                                    ? 'Zodpovězeno'
                                    : entry.status === 'rejected'
                                      ? 'Blokováno filtrem'
                                      : entry.status === 'rate_limited'
                                        ? 'Limit dosažen'
                                        : 'Chyba API'}
                                </span>
                                <span className="font-mono text-[10px] text-slate-400">
                                  relace:{entry.sessionHash.slice(0, 8)} · {entry.model}
                                </span>
                                {entry.suggestLeadForm && (
                                  <span className="px-2 py-0.5 bg-orange-50 text-[#C2560A] border border-orange-200 rounded text-[10px] font-bold">
                                    Doporučena poptávka
                                    {entry.suggestedServiceId ? ` (${entry.suggestedServiceId})` : ''}
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-2">
                                <span>{new Date(entry.createdAt).toLocaleString('cs-CZ')}</span>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    try {
                                      await api.deleteChatLog(entry.id);
                                      await refreshChatLogs();
                                      showToast('Záznam chatu byl odstraněn.');
                                    } catch (err) {
                                      showToast(
                                        err instanceof ApiError
                                          ? err.message
                                          : 'Nepodařilo se smazat záznam.'
                                      );
                                    }
                                  }}
                                  className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                                  title="Smazat záznam"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                              <span className="font-bold text-slate-600 block text-[10px] uppercase mb-0.5">
                                Dotaz návštěvníka:
                              </span>
                              <p className="text-slate-900 font-medium whitespace-pre-wrap">
                                {entry.userMessage}
                              </p>
                            </div>

                            <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                              <span className="font-bold text-[#C2560A] block text-[10px] uppercase mb-0.5">
                                Odpověď asistenta:
                              </span>
                              <p className="text-slate-700 whitespace-pre-wrap">
                                {entry.assistantReply}
                              </p>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
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
                    {settingsError && (
                      <div role="alert" className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 font-semibold">
                        {settingsError}
                      </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="admin-set-phone" className="block font-bold mb-1">
                          Telefon <span className="text-rose-600">*</span>
                        </label>
                        <input
                          id="admin-set-phone"
                          type="text"
                          required
                          value={settingsForm.phone}
                          onChange={(e) => {
                            setSettingsForm({ ...settingsForm, phone: e.target.value });
                            setSettingsError(null);
                          }}
                          placeholder="např. +420 777 123 456"
                          className="w-full px-3 py-2 border border-slate-300 rounded"
                        />
                      </div>
                      <div>
                        <label htmlFor="admin-set-email" className="block font-bold mb-1">
                          E-mail <span className="text-rose-600">*</span>
                        </label>
                        <input
                          id="admin-set-email"
                          type="email"
                          required
                          value={settingsForm.email}
                          onChange={(e) => {
                            setSettingsForm({ ...settingsForm, email: e.target.value });
                            setSettingsError(null);
                          }}
                          placeholder="poptavky@stavparta.cz"
                          className="w-full px-3 py-2 border border-slate-300 rounded"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="admin-set-ico" className="block font-bold mb-1">
                          IČO <span className="text-rose-600">*</span>
                        </label>
                        <input
                          id="admin-set-ico"
                          type="text"
                          required
                          value={settingsForm.ico}
                          onChange={(e) => {
                            setSettingsForm({ ...settingsForm, ico: e.target.value });
                            setSettingsError(null);
                          }}
                          placeholder="např. 12345678"
                          className="w-full px-3 py-2 border border-slate-300 rounded"
                        />
                      </div>
                      <div>
                        <label htmlFor="admin-set-dic" className="block font-bold mb-1">
                          DIČ / daňový status <span className="text-rose-600">*</span>
                        </label>
                        <input
                          id="admin-set-dic"
                          type="text"
                          required
                          value={settingsForm.dic}
                          onChange={(e) => {
                            setSettingsForm({ ...settingsForm, dic: e.target.value });
                            setSettingsError(null);
                          }}
                          placeholder="CZ12345678 nebo neplátce DPH"
                          className="w-full px-3 py-2 border border-slate-300 rounded"
                        />
                        <p className="text-[11px] text-slate-500 mt-1">
                          Uveďte DIČ nebo napište „neplátce DPH“.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
                      <label htmlFor="admin-set-vat" className="flex items-center gap-2 cursor-pointer self-center">
                        <input
                          id="admin-set-vat"
                          type="checkbox"
                          checked={Boolean(settingsForm.isVatPayer)}
                          onChange={(e) =>
                            setSettingsForm({ ...settingsForm, isVatPayer: e.target.checked })
                          }
                          className="w-4 h-4 text-[#C2560A] rounded cursor-pointer"
                        />
                        <span className="font-bold text-slate-800">Plátce DPH</span>
                      </label>

                      <div>
                        <label htmlFor="admin-set-cert" className="block font-bold mb-1">
                          Oprávnění / číslo osvědčení <span className="text-slate-500 font-normal">(nepovinné)</span>
                        </label>
                        <input
                          id="admin-set-cert"
                          type="text"
                          value={settingsForm.certificationNumber || ''}
                          onChange={(e) =>
                            setSettingsForm({
                              ...settingsForm,
                              certificationNumber: e.target.value,
                            })
                          }
                          placeholder="např. č. živnostenského / odborného oprávnění"
                          className="w-full px-3 py-2 border border-slate-300 rounded bg-white"
                        />
                      </div>

                      <div>
                        <label htmlFor="admin-set-warranty" className="block font-bold mb-1">
                          Záruka ve smlouvě (měsíce) <span className="text-slate-500 font-normal">(nepovinné)</span>
                        </label>
                        <input
                          id="admin-set-warranty"
                          type="number"
                          min={0}
                          max={120}
                          value={settingsForm.warrantyMonths ?? ''}
                          onChange={(e) => {
                            const val = e.target.value.trim();
                            setSettingsForm({
                              ...settingsForm,
                              warrantyMonths: val ? Math.max(0, parseInt(val, 10) || 0) : undefined,
                            });
                          }}
                          placeholder="dle smlouvy o dílo"
                          className="w-full px-3 py-2 border border-slate-300 rounded bg-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="admin-set-region" className="block font-bold mb-1">
                          Působnost (Region)
                        </label>
                        <input
                          id="admin-set-region"
                          type="text"
                          value={settingsForm.operatingRegion}
                          onChange={(e) => setSettingsForm({ ...settingsForm, operatingRegion: e.target.value })}
                          placeholder="Zábřeh na Moravě & Olomoucký kraj"
                          className="w-full px-3 py-2 border border-slate-300 rounded"
                        />
                      </div>
                      <div>
                        <label htmlFor="admin-set-hours" className="block font-bold mb-1">
                          Pracovní doba
                        </label>
                        <input
                          id="admin-set-hours"
                          type="text"
                          value={settingsForm.workingHours}
                          onChange={(e) => setSettingsForm({ ...settingsForm, workingHours: e.target.value })}
                          placeholder="Po–Pá: 7:00–18:00"
                          className="w-full px-3 py-2 border border-slate-300 rounded"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="admin-set-address" className="block font-bold mb-1">
                        Sídlo a adresa centrály <span className="text-rose-600">*</span>
                      </label>
                      <input
                        id="admin-set-address"
                        type="text"
                        required
                        value={settingsForm.addressNotice}
                        onChange={(e) => {
                          setSettingsForm({ ...settingsForm, addressNotice: e.target.value });
                          setSettingsError(null);
                        }}
                        placeholder="Ulice, č.p., Zábřeh na Moravě (PSČ 789 01)"
                        className="w-full px-3 py-2 border border-slate-300 rounded"
                      />
                    </div>

                    {/* Email notification system settings */}
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-[#B84F00]" />
                        <span className="font-bold text-slate-800 text-xs">E-mailové notifikace nových poptávek</span>
                      </div>
                      <label htmlFor="admin-set-notify-enabled" className="flex items-center gap-2 cursor-pointer">
                        <input
                          id="admin-set-notify-enabled"
                          type="checkbox"
                          checked={settingsForm.notifyEmailEnabled ?? true}
                          onChange={(e) =>
                            setSettingsForm({ ...settingsForm, notifyEmailEnabled: e.target.checked })
                          }
                          className="w-4 h-4 text-[#C2560A] rounded"
                        />
                        <span className="text-slate-700">Aktivovat automatické notifikace při přijetí nové poptávky</span>
                      </label>

                      <div>
                        <label htmlFor="admin-set-notify-email" className="block font-bold text-slate-600 mb-1">
                          Cílový e-mail pro notifikace
                        </label>
                        <input
                          id="admin-set-notify-email"
                          type="email"
                          value={settingsForm.notifyEmailAddress || settingsForm.email}
                          onChange={(e) =>
                            setSettingsForm({ ...settingsForm, notifyEmailAddress: e.target.value })
                          }
                          placeholder="poptavky@stavparta.cz"
                          className="w-full px-3 py-2 border border-slate-300 rounded bg-white"
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
                            `Telefon: ${settingsForm.phone.trim() || 'neuveden'}\n` +
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
                        <Send className="w-3.5 h-3.5 text-[#B84F00]" />
                        <span>Simulovat odeslání testovací e-mailové notifikace</span>
                      </button>
                    </div>

                    {/* Chat Assistant Knowledge Base Settings */}
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                      <div>
                        <span className="font-bold text-slate-800 text-xs block">
                          Znalostní báze chatového asistenta (ceny, doba realizace, podmínky)
                        </span>
                        <span className="text-[11px] text-slate-500">
                          AI asistent na webu čerpá ceny, doby realizace a platební podmínky výhradně z těchto polí a aktivního katalogu služeb.
                        </span>
                      </div>

                      <div>
                        <label htmlFor="admin-set-chat-pricing" className="block font-bold text-slate-700 mb-1">
                          Orientační cenové informace pro asistenta
                        </label>
                        <textarea
                          id="admin-set-chat-pricing"
                          rows={2}
                          value={settingsForm.chatPricingSummary || ''}
                          onChange={(e) =>
                            setSettingsForm({ ...settingsForm, chatPricingSummary: e.target.value })
                          }
                          placeholder="Např. Zaměření a položkový rozpočet zdarma; orientační rozpětí dle kalkulačky na webu..."
                          className="w-full px-3 py-2 border border-slate-300 rounded bg-white"
                        />
                      </div>

                      <div>
                        <label htmlFor="admin-set-chat-timeline" className="block font-bold text-slate-700 mb-1">
                          Orientační doba realizace a volné kapacity
                        </label>
                        <textarea
                          id="admin-set-chat-timeline"
                          rows={2}
                          value={settingsForm.chatTimelineSummary || ''}
                          onChange={(e) =>
                            setSettingsForm({ ...settingsForm, chatTimelineSummary: e.target.value })
                          }
                          placeholder="Např. Běžná doba realizace dle rozsahu zakázky; termín upřesňujeme po zaměření..."
                          className="w-full px-3 py-2 border border-slate-300 rounded bg-white"
                        />
                      </div>

                      <div>
                        <label htmlFor="admin-set-chat-payment" className="block font-bold text-slate-700 mb-1">
                          Platební a smluvní podmínky
                        </label>
                        <textarea
                          id="admin-set-chat-payment"
                          rows={2}
                          value={settingsForm.chatPaymentTerms || ''}
                          onChange={(e) =>
                            setSettingsForm({ ...settingsForm, chatPaymentTerms: e.target.value })
                          }
                          placeholder="Např. Platba po etapách dle písemné smlouvy o dílo..."
                          className="w-full px-3 py-2 border border-slate-300 rounded bg-white"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-[#C2560A] hover:bg-[#9E4306] text-white font-bold rounded shadow cursor-pointer"
                    >
                      Uložit nastavení
                    </button>
                  </form>

                  {/* Password Change */}
                  <div className="pt-6 border-t border-slate-200">
                    <h4 className="font-bold text-sm text-[#17232D] mb-2">Změna přístupového hesla</h4>
                    <form onSubmit={handleSavePassword} className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div>
                        <label htmlFor="admin-pw-current" className="sr-only">
                          Stávající heslo
                        </label>
                        <input
                          id="admin-pw-current"
                          type="password"
                          placeholder="Stávající heslo..."
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className="w-full px-3 py-2 text-xs border border-slate-300 rounded"
                        />
                      </div>
                      <div>
                        <label htmlFor="admin-pw-new" className="sr-only">
                          Nové heslo (minimálně 8 znaků)
                        </label>
                        <input
                          id="admin-pw-new"
                          type="password"
                          placeholder="Nové heslo (min. 8 znaků)..."
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full px-3 py-2 text-xs border border-slate-300 rounded"
                        />
                      </div>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-[#17232D] hover:bg-[#263746] text-white text-xs font-bold rounded cursor-pointer"
                      >
                        Změnit heslo
                      </button>
                    </form>
                    {passwordChangeSuccess && (
                      <p role="status" className="text-xs text-emerald-700 mt-2 font-medium">
                        Heslo bylo úspěšně změněno.
                      </p>
                    )}
                  </div>

                  {/* GDPR Right to Erasure Panel */}
                  <div className="pt-6 border-t border-slate-200 space-y-3">
                    <div>
                      <h4 className="font-bold text-sm text-[#17232D]">
                        Výmaz osobních údajů na žádost (GDPR)
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Trvale odstraní všechny poptávky, nahrané přílohy z disku i záznamy odběru
                        novinek přiřazené ke konkrétní e-mailové adrese.
                      </p>
                    </div>
                    <form onSubmit={handleGdprErase} className="flex flex-col sm:flex-row gap-2">
                      <label htmlFor="admin-gdpr-email" className="sr-only">
                        E-mailová adresa žadatele pro výmaz osobních údajů
                      </label>
                      <input
                        id="admin-gdpr-email"
                        type="email"
                        required
                        value={gdprEraseEmail}
                        onChange={(e) => setGdprEraseEmail(e.target.value)}
                        placeholder="E-mail žadatele (např. klient@email.cz)"
                        className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded bg-white"
                      />
                      <button
                        type="submit"
                        disabled={gdprErasing}
                        className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold rounded cursor-pointer disabled:opacity-60 whitespace-nowrap"
                      >
                        {gdprErasing ? 'Mažu údaje...' : 'Vymazat údaje (GDPR)'}
                      </button>
                    </form>
                    {gdprEraseResult && (
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900">
                        Výmaz dokončen pro <strong>{gdprEraseResult.normalizedEmail}</strong>:
                        odstraněno <strong>{gdprEraseResult.deletedLeadsCount}</strong> poptávek,{' '}
                        <strong>{gdprEraseResult.deletedAttachmentsCount}</strong> souborů příloh a{' '}
                        <strong>{gdprEraseResult.deletedSubscribersCount}</strong> odběrů novinek.
                      </div>
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
                        className="w-full py-2 bg-[#C2560A] hover:bg-[#9E4306] text-white text-xs font-bold rounded cursor-pointer"
                      >
                        Stáhnout ZIP
                      </button>
                    </div>
                  </div>

                  <div className="p-5 bg-white border border-slate-200 rounded-xl space-y-3">
                    <h4 className="font-bold text-sm text-[#17232D] flex items-center gap-2">
                      <Upload className="w-4 h-4 text-[#B84F00]" />
                      <span>Obnovení databáze ze souboru</span>
                    </h4>
                    <label htmlFor="admin-backup-import" className="sr-only">
                      Vybrat JSON soubor se zálohou databáze
                    </label>
                    <input
                      id="admin-backup-import"
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

                  <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                    <button
                      type="button"
                      disabled={clearingDemo || !hasDemoItems}
                      onClick={() => void handleClearDemoForProduction()}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
                    >
                      {hasDemoItems
                        ? clearingDemo
                          ? 'Mažu demo data...'
                          : 'Vyčistit demo data pro ostrý provoz'
                        : 'Demo data již byla vyčištěna'}
                    </button>

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
                      className="text-xs text-slate-500 hover:text-slate-800 underline flex items-center gap-1 cursor-pointer"
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
          <div
            className="fixed inset-0 z-70 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
            onClick={() => setSimulatedEmailNotification(null)}
          >
            <div
              ref={emailModalRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="admin-email-preview-title"
              tabIndex={-1}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 space-y-4 outline-none"
            >
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-orange-100 text-[#9E4306] flex items-center justify-center">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 id="admin-email-preview-title" className="font-extrabold text-sm text-[#17232D]">
                      Náhled automatické e-mailové notifikace
                    </h4>
                    <span className="text-[11px] text-slate-500">
                      Simulace doručení na SMTP / e-mail firmy
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSimulatedEmailNotification(null)}
                  aria-label="Zavřít náhled e-mailu"
                  className="p-1 text-slate-500 hover:text-slate-900 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-slate-900 text-slate-100 p-4 rounded-lg font-mono text-[11px] leading-relaxed whitespace-pre-wrap max-h-80 overflow-y-auto border border-slate-700">
                {simulatedEmailNotification}
              </div>

              <div className="flex justify-between items-center pt-2">
                <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> E-mailový template je připraven k napojení na SMTP
                </span>
                <button
                  type="button"
                  onClick={() => setSimulatedEmailNotification(null)}
                  className="px-4 py-2 bg-[#17232D] hover:bg-[#263746] text-white text-xs font-bold rounded cursor-pointer"
                >
                  Zavřít náhled
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Itemized Quotation Generator Modal (lazy chunk) */}
        {quotingLead && (
          <Suspense fallback={null}>
            <LazyQuotationGeneratorModal
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
          </Suspense>
        )}
      </div>
    </div>
  );
};
