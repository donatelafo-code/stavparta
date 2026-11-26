/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Send } from 'lucide-react';
import {
  INITIAL_BLOG_POSTS,
  INITIAL_PROJECTS,
  INITIAL_SERVICES,
  INITIAL_SETTINGS,
  INITIAL_TESTIMONIALS,
} from './shared/seedData';
import { findCityPageBySlug } from './shared/cityPages';
import { api } from './services/api';
import { getPreferredScrollBehavior } from './hooks/useModalAccessibility';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { AboutSection } from './components/AboutSection';
import { ServicesSection } from './components/ServicesSection';
import { ProjectsSection } from './components/ProjectsSection';
import { FaqSection } from './components/FaqSection';
import { WhyUsSection } from './components/WhyUsSection';
import { ProcessSection } from './components/ProcessSection';
import { TestimonialsSection } from './components/TestimonialsSection';
import { LeadFormSection, LeadPrefillNote } from './components/LeadFormSection';
import { PriceCalculatorSection, CalculatedLeadData } from './components/PriceCalculatorSection';
import { Footer } from './components/Footer';
import { ChatWidget } from './components/ChatWidget';
import { SeoHead } from './components/SeoHead';
import { BlogPost, Lead, Project, ServiceItem, SiteSettings, Testimonial } from './types';

const ServiceDetailPage = lazy(() =>
  import('./components/ServiceDetailPage').then((m) => ({ default: m.ServiceDetailPage }))
);
const BlogArticlePage = lazy(() =>
  import('./components/BlogArticlePage').then((m) => ({ default: m.BlogArticlePage }))
);
const CityLandingPage = lazy(() =>
  import('./components/CityLandingPage').then((m) => ({ default: m.CityLandingPage }))
);
const NotFoundPage = lazy(() =>
  import('./components/NotFoundPage').then((m) => ({ default: m.NotFoundPage }))
);
const CaseStudiesSection = lazy(() =>
  import('./components/CaseStudiesSection').then((m) => ({ default: m.CaseStudiesSection }))
);
const MaterialComparisonSection = lazy(() =>
  import('./components/MaterialComparisonSection').then((m) => ({
    default: m.MaterialComparisonSection,
  }))
);
const BlogSection = lazy(() =>
  import('./components/BlogSection').then((m) => ({ default: m.BlogSection }))
);
const ServiceAreaMapSection = lazy(() =>
  import('./components/ServiceAreaMapSection').then((m) => ({
    default: m.ServiceAreaMapSection,
  }))
);
const AdminDashboard = lazy(() =>
  import('./components/AdminDashboard').then((m) => ({ default: m.AdminDashboard }))
);
const GdprModal = lazy(() =>
  import('./components/GdprModal').then((m) => ({ default: m.GdprModal }))
);
const TermsModal = lazy(() =>
  import('./components/TermsModal').then((m) => ({ default: m.TermsModal }))
);

const SectionFallback: React.FC<{ label?: string }> = ({ label }) => (
  <div className="py-16 bg-white border-b border-slate-200">
    <div className="max-w-7xl mx-auto px-4 sm:px-8 text-center text-xs text-slate-400">
      {label || 'Načítám sekci…'}
    </div>
  </div>
);

interface ServiceRouteViewProps {
  settings: SiteSettings;
  services: ServiceItem[];
  testimonials: Testimonial[];
  onOpenLeadForm: (serviceId?: string) => void;
}

const ServiceRouteView: React.FC<ServiceRouteViewProps> = ({
  settings,
  services,
  testimonials,
  onOpenLeadForm,
}) => {
  const { slug } = useParams<{ slug: string }>();
  const service = services.find((s) => s.slug === slug && s.isActive);

  if (!service) {
    return (
      <>
        <SeoHead
          title="Služba nenalezena | STAVPARTA"
          description="Požadovaná stavební služba nebyla nalezena."
          canonicalPath={`/sluzba/${slug || ''}`}
          pageType="not_found"
          noIndex
          settings={settings}
          services={services}
          testimonials={testimonials}
        />
        <NotFoundPage onOpenLeadForm={() => onOpenLeadForm()} />
      </>
    );
  }

  return (
    <>
      <SeoHead
        title={service.metaTitle || `${service.title} | STAVPARTA`}
        description={service.metaDescription || service.shortDescription}
        canonicalPath={`/sluzba/${service.slug}`}
        pageType="service"
        ogImage={service.image || '/og-image.jpg'}
        settings={settings}
        services={services}
        testimonials={testimonials}
        activeService={service}
        breadcrumbs={[
          { name: 'Úvod', path: '/' },
          { name: 'Služby', path: '/#sluzby' },
          { name: service.title, path: `/sluzba/${service.slug}` },
        ]}
      />
      <ServiceDetailPage
        service={service}
        allServices={services}
        onOpenLeadForm={onOpenLeadForm}
      />
    </>
  );
};

interface BlogRouteViewProps {
  settings: SiteSettings;
  services: ServiceItem[];
  blogPosts: BlogPost[];
  testimonials: Testimonial[];
  onConsultTopic: (serviceId: string, articleTitle: string) => void;
  onOpenLeadForm: () => void;
}

const BlogRouteView: React.FC<BlogRouteViewProps> = ({
  settings,
  services,
  blogPosts,
  testimonials,
  onConsultTopic,
  onOpenLeadForm,
}) => {
  const { slug } = useParams<{ slug: string }>();
  const post = blogPosts.find((p) => p.slug === slug && p.isPublished);

  if (!post) {
    return (
      <>
        <SeoHead
          title="Článek nenalezen | STAVPARTA"
          description="Požadovaný článek nebyl nalezen."
          canonicalPath={`/blog/${slug || ''}`}
          pageType="not_found"
          noIndex
          settings={settings}
          services={services}
          testimonials={testimonials}
        />
        <NotFoundPage onOpenLeadForm={onOpenLeadForm} />
      </>
    );
  }

  const relatedService = services.find((s) => s.id === post.relatedServiceId && s.isActive);

  return (
    <>
      <SeoHead
        title={`${post.title} | Blog STAVPARTA`}
        description={post.excerpt}
        canonicalPath={`/blog/${post.slug}`}
        pageType="blog"
        ogType="article"
        ogImage={post.image || '/og-image.jpg'}
        settings={settings}
        services={services}
        testimonials={testimonials}
        activePost={post}
        breadcrumbs={[
          { name: 'Úvod', path: '/' },
          { name: 'Blog & Aktuality', path: '/#blog' },
          { name: post.title, path: `/blog/${post.slug}` },
        ]}
      />
      <BlogArticlePage
        post={post}
        allPosts={blogPosts}
        relatedService={relatedService}
        onConsultTopic={onConsultTopic}
      />
    </>
  );
};

interface CityRouteViewProps {
  settings: SiteSettings;
  services: ServiceItem[];
  testimonials: Testimonial[];
  onOpenLeadForm: (serviceId?: string) => void;
}

const CityRouteView: React.FC<CityRouteViewProps> = ({
  settings,
  services,
  testimonials,
  onOpenLeadForm,
}) => {
  const { citySlug } = useParams<{ citySlug: string }>();
  const city = findCityPageBySlug(citySlug);

  if (!city) {
    return (
      <>
        <SeoHead
          title="Lokalita nenalezena | STAVPARTA"
          description="Požadovaná lokalita nebyla nalezena."
          canonicalPath={`/lokalita/${citySlug || ''}`}
          pageType="not_found"
          noIndex
          settings={settings}
          services={services}
          testimonials={testimonials}
        />
        <NotFoundPage onOpenLeadForm={() => onOpenLeadForm()} />
      </>
    );
  }

  return (
    <>
      <SeoHead
        title={city.metaTitle}
        description={city.metaDescription}
        canonicalPath={`/lokalita/${city.slug}`}
        pageType="city"
        settings={settings}
        services={services}
        testimonials={testimonials}
        activeCity={city}
        breadcrumbs={[
          { name: 'Úvod', path: '/' },
          { name: 'Působnost', path: '/#pusobnost' },
          { name: city.cityName, path: `/lokalita/${city.slug}` },
        ]}
      />
      <CityLandingPage
        city={city}
        services={services}
        settings={settings}
        onOpenLeadForm={onOpenLeadForm}
      />
    </>
  );
};

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();

  // Server-backed application state (initialized cleanly from seed defaults while hydrating)
  const [settings, setSettings] = useState<SiteSettings>(INITIAL_SETTINGS);
  const [services, setServices] = useState<ServiceItem[]>(INITIAL_SERVICES);
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [testimonials, setTestimonials] = useState<Testimonial[]>(INITIAL_TESTIMONIALS);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>(INITIAL_BLOG_POSTS);

  // Modal states
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isGdprOpen, setIsGdprOpen] = useState(
    () => typeof window !== 'undefined' && window.location.hash === '#gdpr'
  );
  const [isTermsOpen, setIsTermsOpen] = useState(
    () => typeof window !== 'undefined' && window.location.hash === '#obchodni-podminky'
  );
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [preselectedServiceId, setPreselectedServiceId] = useState<string | undefined>(undefined);
  const [prefilledCalculation, setPrefilledCalculation] = useState<CalculatedLeadData | null>(null);
  const [prefilledNote, setPrefilledNote] = useState<LeadPrefillNote | null>(null);

  const refreshData = useCallback(async () => {
    try {
      const bootstrap = await api.getPublicBootstrap();
      setSettings(bootstrap.settings);
      setServices(bootstrap.services);
      setProjects(bootstrap.projects);
      setTestimonials(bootstrap.testimonials);
      setBlogPosts(bootstrap.blogPosts);
    } catch (err) {
      console.error('Failed to bootstrap public app data:', err);
    }

    try {
      const me = await api.getAdminMe();
      if (me.authenticated && me.user && !me.user.mustChangePassword) {
        const leadsRes = await api.getLeads();
        setLeads(leadsRes.leads);
      } else {
        setLeads([]);
      }
    } catch {
      setLeads([]);
    }
  }, []);

  useEffect(() => {
    let active = true;
    const loadInitial = async () => {
      try {
        const bootstrap = await api.getPublicBootstrap();
        if (!active) return;
        setSettings(bootstrap.settings);
        setServices(bootstrap.services);
        setProjects(bootstrap.projects);
        setTestimonials(bootstrap.testimonials);
        setBlogPosts(bootstrap.blogPosts);
      } catch (err) {
        console.error('Failed to bootstrap public app data:', err);
      }

      try {
        const me = await api.getAdminMe();
        if (!active) return;
        if (me.authenticated && me.user && !me.user.mustChangePassword) {
          const leadsRes = await api.getLeads();
          if (!active) return;
          setLeads(leadsRes.leads);
        } else {
          setLeads([]);
        }
      } catch {
        if (active) setLeads([]);
      }
    };
    void loadInitial();
    return () => {
      active = false;
    };
  }, []);

  // Redirect legacy hash subpage URLs (#sluzba/:slug, #blog/:slug) to clean SEO paths
  useEffect(() => {
    const hash = location.hash;
    if (hash.startsWith('#sluzba/')) {
      const slug = hash.replace('#sluzba/', '').trim();
      if (slug) {
        navigate(`/sluzba/${slug}`, { replace: true });
      }
      return;
    }
    if (hash.startsWith('#blog/')) {
      const slug = hash.replace('#blog/', '').trim();
      if (slug) {
        navigate(`/blog/${slug}`, { replace: true });
      }
    }
  }, [location.hash, navigate]);

  useEffect(() => {
    const handleHashModals = () => {
      if (window.location.hash === '#obchodni-podminky') {
        setIsTermsOpen(true);
      } else if (window.location.hash === '#gdpr') {
        setIsGdprOpen(true);
      }
    };
    window.addEventListener('hashchange', handleHashModals);
    return () => window.removeEventListener('hashchange', handleHashModals);
  }, []);

  // Handle route changes: scroll to anchor when hash points to a section on '/', else scroll top
  useEffect(() => {
    const behavior = getPreferredScrollBehavior();
    if (location.pathname === '/' && location.hash) {
      const targetId = location.hash.replace(/^#/, '');
      if (targetId && targetId !== 'obchodni-podminky' && targetId !== 'gdpr') {
        const timer = setTimeout(() => {
          document.getElementById(targetId)?.scrollIntoView({ behavior, block: 'start' });
        }, 90);
        return () => clearTimeout(timer);
      }
    }
    window.scrollTo({ top: 0, behavior });
  }, [location.pathname, location.hash]);

  const scrollToLeadForm = useCallback(() => {
    setTimeout(() => {
      const element =
        document.getElementById('poptavka') || document.getElementById('kontakt');
      if (element) {
        element.scrollIntoView({ behavior: getPreferredScrollBehavior(), block: 'start' });
      }
    }, 80);
  }, []);

  const handleOpenLeadForm = useCallback(
    (serviceId?: string) => {
      if (serviceId) {
        setPreselectedServiceId(serviceId);
      }
      if (location.pathname !== '/') {
        navigate('/#poptavka');
        return;
      }
      scrollToLeadForm();
    },
    [location.pathname, navigate, scrollToLeadForm]
  );

  const handleSelectCaseStudyForLead = (serviceId: string, contextTitle: string) => {
    setPrefilledCalculation(null);
    setPreselectedServiceId(serviceId);
    setPrefilledNote({
      serviceId,
      sourceLabel: 'Inspirace případovou studií',
      title: contextTitle,
      description: `Dobrý den, zaujala mě případová studie "${contextTitle}". Rád(a) bych poptal(a) podobnou realizaci v našem bytě/domě.`,
    });
    if (location.pathname !== '/') {
      navigate('/#poptavka');
      return;
    }
    scrollToLeadForm();
  };

  const handleConsultMaterial = (serviceId: string, materialSummary: string) => {
    setPrefilledCalculation(null);
    setPreselectedServiceId(serviceId);
    setPrefilledNote({
      serviceId,
      sourceLabel: 'Porovnání materiálů',
      title: materialSummary,
      description: `Dobrý den, ze srovnávače materiálů zvažuji variantu: ${materialSummary}. Prosím o konzultaci při zaměření na místě.`,
    });
    if (location.pathname !== '/') {
      navigate('/#poptavka');
      return;
    }
    scrollToLeadForm();
  };

  const handleConsultBlogTopic = (serviceId: string, articleTitle: string) => {
    setPrefilledCalculation(null);
    setPreselectedServiceId(serviceId);
    setPrefilledNote({
      serviceId,
      sourceLabel: 'Konzultace tématu z blogu',
      title: articleTitle,
      description: `Dobrý den, přečetl(a) jsem si článek "${articleTitle}" a rád(a) bych toto řešení zkonzultoval(a) pro naši plánovanou rekonstrukci.`,
    });
    if (location.pathname !== '/') {
      navigate('/#poptavka');
      return;
    }
    scrollToLeadForm();
  };

  const handleChatNavigateToLeadForm = (serviceId?: string, prefillSummary?: string) => {
    const normalizedServiceId =
      serviceId === 'srv-dokoncovaci-prace'
        ? 'srv-rekonstrukce-bytu'
        : serviceId || '';

    setPrefilledCalculation(null);
    if (normalizedServiceId) {
      setPreselectedServiceId(normalizedServiceId);
    }
    if (prefillSummary && prefillSummary.trim()) {
      setPrefilledNote({
        serviceId: normalizedServiceId || preselectedServiceId || 'srv-bytova-jadra',
        sourceLabel: 'Návrh z chatového asistenta',
        title: 'Kontextová konzultace',
        description: prefillSummary.trim(),
      });
    }
    if (location.pathname !== '/') {
      navigate('/#poptavka');
      return;
    }
    scrollToLeadForm();
  };

  const unreadLeadsCount = leads.filter((l) => l.status === 'nova').length;

  return (
    <div className="min-h-screen flex flex-col bg-[#F1F4F6] text-[#17232D] font-sans">
      {/* Top Navbar */}
      <Navbar
        settings={settings}
        onOpenLeadForm={handleOpenLeadForm}
        onOpenAdmin={() => setIsAdminOpen(true)}
        unreadLeadsCount={unreadLeadsCount}
      />

      {/* Main Content Area */}
      <main className="flex-grow">
        <Routes>
          <Route
            path="/"
            element={
              <>
                <SeoHead
                  title={
                    settings.seoTitle ||
                    'STAVPARTA – Rekonstrukce bytů a jader | Zábřeh na Moravě'
                  }
                  description={settings.seoDescription}
                  canonicalPath="/"
                  pageType="home"
                  settings={settings}
                  services={services}
                  testimonials={testimonials}
                />

                {/* Hero Section */}
                <Hero settings={settings} onOpenLeadForm={() => handleOpenLeadForm()} />

                {/* O nás (About Us) */}
                <AboutSection settings={settings} onOpenLeadForm={() => handleOpenLeadForm()} />

                {/* Služby (Services Grid with subpage links) */}
                <ServicesSection services={services} onSelectServiceForLead={handleOpenLeadForm} />

                {/* Orientační kalkulačka rozpočtu rekonstrukce a jádra */}
                <PriceCalculatorSection
                  onApplyCalculation={(data) => {
                    setPrefilledNote(null);
                    setPrefilledCalculation(data);
                    setPreselectedServiceId(data.serviceId);
                  }}
                />

                {/* Realizace (Projects with Stage switcher & Before/After slider) */}
                <ProjectsSection projects={projects} onOpenLeadForm={() => handleOpenLeadForm()} />

                {/* Případové studie (Technical parameters, materials & engineering challenges) */}
                <Suspense fallback={<SectionFallback label="Načítám případové studie…" />}>
                  <CaseStudiesSection onSelectCaseStudyForLead={handleSelectCaseStudyForLead} />
                </Suspense>

                {/* Interaktivní srovnání materiálů pro konzultace */}
                <Suspense fallback={<SectionFallback label="Načítám srovnávač materiálů…" />}>
                  <MaterialComparisonSection onConsultMaterial={handleConsultMaterial} />
                </Suspense>

                {/* Blog & Aktuality */}
                <Suspense fallback={<SectionFallback label="Načítám články a aktuality…" />}>
                  <BlogSection posts={blogPosts} onConsultTopic={handleConsultBlogTopic} />
                </Suspense>

                {/* Často kladené dotazy (FAQ) */}
                <FaqSection
                  onOpenLeadForm={() => handleOpenLeadForm()}
                  onOpenChat={() => setIsChatOpen(true)}
                />

                {/* Proč STAVPARTA */}
                <WhyUsSection />

                {/* Jak probíhá spolupráce */}
                <ProcessSection onOpenLeadForm={() => handleOpenLeadForm()} />

                {/* Reference se souhlasem */}
                <TestimonialsSection testimonials={testimonials} />

                {/* Interaktivní mapa působnosti v Olomouckém kraji */}
                <Suspense fallback={<SectionFallback label="Načítám mapu působnosti…" />}>
                  <ServiceAreaMapSection settings={settings} onOpenLeadForm={handleOpenLeadForm} />
                </Suspense>

                {/* Poptávkový formulář & Kontakty */}
                <LeadFormSection
                  settings={settings}
                  services={services}
                  preselectedServiceId={preselectedServiceId}
                  prefilledData={prefilledCalculation}
                  prefilledNote={prefilledNote}
                  onOpenGdpr={() => setIsGdprOpen(true)}
                  onOpenTerms={() => setIsTermsOpen(true)}
                  onLeadCreated={(lead) => setLeads((prev) => [lead, ...prev])}
                />
              </>
            }
          />

          <Route
            path="/sluzba/:slug"
            element={
              <Suspense fallback={<SectionFallback label="Načítám detail služby…" />}>
                <ServiceRouteView
                  settings={settings}
                  services={services}
                  testimonials={testimonials}
                  onOpenLeadForm={handleOpenLeadForm}
                />
              </Suspense>
            }
          />

          <Route
            path="/blog/:slug"
            element={
              <Suspense fallback={<SectionFallback label="Načítám článek…" />}>
                <BlogRouteView
                  settings={settings}
                  services={services}
                  blogPosts={blogPosts}
                  testimonials={testimonials}
                  onConsultTopic={handleConsultBlogTopic}
                  onOpenLeadForm={() => handleOpenLeadForm()}
                />
              </Suspense>
            }
          />

          <Route
            path="/lokalita/:citySlug"
            element={
              <Suspense fallback={<SectionFallback label="Načítám přehled lokality…" />}>
                <CityRouteView
                  settings={settings}
                  services={services}
                  testimonials={testimonials}
                  onOpenLeadForm={handleOpenLeadForm}
                />
              </Suspense>
            }
          />

          <Route
            path="*"
            element={
              <>
                <SeoHead
                  title="Stránka nenalezena | STAVPARTA"
                  description="Požadovaná stránka nebyla nalezena."
                  canonicalPath={location.pathname}
                  pageType="not_found"
                  noIndex
                  settings={settings}
                  services={services}
                  testimonials={testimonials}
                />
                <Suspense fallback={<SectionFallback label="Načítám stránku…" />}>
                  <NotFoundPage onOpenLeadForm={() => handleOpenLeadForm()} />
                </Suspense>
              </>
            }
          />
        </Routes>
      </main>

      {/* Footer */}
      <Footer
        settings={settings}
        services={services}
        onOpenLeadForm={() => handleOpenLeadForm()}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onOpenGdpr={() => setIsGdprOpen(true)}
        onOpenTerms={() => setIsTermsOpen(true)}
      />

      {/* Admin Dashboard Modal (loaded lazily only when opened) */}
      {isAdminOpen && (
        <Suspense fallback={null}>
          <AdminDashboard
            isOpen={isAdminOpen}
            onClose={() => setIsAdminOpen(false)}
            settings={settings}
            services={services}
            projects={projects}
            testimonials={testimonials}
            leads={leads}
            blogPosts={blogPosts}
            onRefreshData={refreshData}
          />
        </Suspense>
      )}

      {/* GDPR & Privacy Modal */}
      {isGdprOpen && (
        <Suspense fallback={null}>
          <GdprModal
            settings={settings}
            isOpen={isGdprOpen}
            onClose={() => setIsGdprOpen(false)}
          />
        </Suspense>
      )}

      {/* Business & Warranty Terms Modal Template */}
      {isTermsOpen && (
        <Suspense fallback={null}>
          <TermsModal
            settings={settings}
            isOpen={isTermsOpen}
            onClose={() => setIsTermsOpen(false)}
          />
        </Suspense>
      )}

      {/* Mobile Sticky CTA 'Poptat' */}
      {!isAdminOpen && !isGdprOpen && !isTermsOpen && !isChatOpen && (
        <button
          type="button"
          onClick={() => handleOpenLeadForm()}
          aria-label="Otevřít poptávkový formulář v sekci kontakt"
          className="md:hidden fixed bottom-4 right-4 z-40 min-h-[48px] px-5 py-3 bg-[#C2560A] hover:bg-[#9E4306] active:scale-95 text-white font-extrabold text-sm rounded-xl shadow-xl border border-white/20 flex items-center gap-2 cursor-pointer transition-transform"
        >
          <Send className="w-4 h-4 shrink-0" />
          <span>Poptat</span>
        </button>
      )}

      {/* Contextual Service Chatbot Widget */}
      <ChatWidget
        isOpen={isChatOpen}
        onToggle={setIsChatOpen}
        onNavigateToLeadForm={handleChatNavigateToLeadForm}
        hidden={isAdminOpen || isGdprOpen || isTermsOpen}
      />
    </div>
  );
}
