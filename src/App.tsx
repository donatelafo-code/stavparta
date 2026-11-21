/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Send } from 'lucide-react';
import {
  INITIAL_BLOG_POSTS,
  INITIAL_PROJECTS,
  INITIAL_SERVICES,
  INITIAL_SETTINGS,
  INITIAL_TESTIMONIALS,
} from './shared/seedData';
import { api } from './services/api';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { AboutSection } from './components/AboutSection';
import { ServicesSection } from './components/ServicesSection';
import { ServiceDetailPage } from './components/ServiceDetailPage';
import { ProjectsSection } from './components/ProjectsSection';
import { CaseStudiesSection } from './components/CaseStudiesSection';
import { MaterialComparisonSection } from './components/MaterialComparisonSection';
import { FaqSection } from './components/FaqSection';
import { WhyUsSection } from './components/WhyUsSection';
import { ProcessSection } from './components/ProcessSection';
import { TestimonialsSection } from './components/TestimonialsSection';
import { LeadFormSection, LeadPrefillNote } from './components/LeadFormSection';
import { PriceCalculatorSection, CalculatedLeadData } from './components/PriceCalculatorSection';
import { ServiceAreaMapSection } from './components/ServiceAreaMapSection';
import { Footer } from './components/Footer';
import { AdminDashboard } from './components/AdminDashboard';
import { GdprModal } from './components/GdprModal';
import { ChatWidget } from './components/ChatWidget';
import { BlogSection } from './components/BlogSection';
import { BlogPost, Lead, Project, ServiceItem, SiteSettings, Testimonial } from './types';

export default function App() {
  // Server-backed application state (initialized cleanly from seed defaults while hydrating)
  const [settings, setSettings] = useState<SiteSettings>(INITIAL_SETTINGS);
  const [services, setServices] = useState<ServiceItem[]>(INITIAL_SERVICES);
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [testimonials, setTestimonials] = useState<Testimonial[]>(INITIAL_TESTIMONIALS);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>(INITIAL_BLOG_POSTS);

  // View state: Dedicated subpage vs Home overview
  const [activeSubpageService, setActiveSubpageService] = useState<ServiceItem | null>(null);
  const [activeBlogSlug, setActiveBlogSlug] = useState<string | null>(null);

  // Modal states
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isGdprOpen, setIsGdprOpen] = useState(false);
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

      setActiveSubpageService((prev) => {
        if (!prev) return null;
        return bootstrap.services.find((s) => s.id === prev.id) || prev;
      });
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

  // Handle URL hash navigation for direct links (e.g. #sluzba/renovace-bytovych-jader or #blog/slug)
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#sluzba/')) {
        const slug = hash.replace('#sluzba/', '');
        const matched = services.find((s) => s.slug === slug);
        if (matched) {
          setActiveSubpageService(matched);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      } else if (hash.startsWith('#blog/')) {
        const blogSlug = hash.replace('#blog/', '');
        const matchedPost = blogPosts.find((p) => p.slug === blogSlug && p.isPublished);
        if (matchedPost) {
          setActiveSubpageService(null);
          setActiveBlogSlug(blogSlug);
          setTimeout(() => {
            document.getElementById('blog')?.scrollIntoView({ behavior: 'smooth' });
          }, 80);
        }
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, [services, blogPosts]);

  const scrollToLeadForm = () => {
    setTimeout(() => {
      const element =
        document.getElementById('poptavka') || document.getElementById('kontakt');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 60);
  };

  const handleOpenLeadForm = (serviceId?: string) => {
    if (serviceId) {
      setPreselectedServiceId(serviceId);
    }
    if (activeSubpageService) {
      setActiveSubpageService(null);
      window.location.hash = '';
    }
    scrollToLeadForm();
  };

  const handleSelectCaseStudyForLead = (serviceId: string, contextTitle: string) => {
    setPrefilledCalculation(null);
    setPreselectedServiceId(serviceId);
    setPrefilledNote({
      serviceId,
      sourceLabel: 'Inspirace případovou studií',
      title: contextTitle,
      description: `Dobrý den, zaujala mě případová studie "${contextTitle}". Rád(a) bych poptal(a) podobnou realizaci v našem bytě/domě.`,
    });
    if (activeSubpageService) {
      setActiveSubpageService(null);
      window.location.hash = '';
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
    if (activeSubpageService) {
      setActiveSubpageService(null);
      window.location.hash = '';
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
    if (activeSubpageService) {
      setActiveSubpageService(null);
      window.location.hash = '';
    }
    scrollToLeadForm();
  };

  const handleSelectArticleSlug = (slug: string | null) => {
    setActiveBlogSlug(slug);
    if (slug) {
      window.history.replaceState(null, '', `#blog/${slug}`);
    } else if (window.location.hash.startsWith('#blog/')) {
      window.history.replaceState(null, '', '#blog');
    }
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
    if (activeSubpageService) {
      setActiveSubpageService(null);
      window.location.hash = '';
    }
    scrollToLeadForm();
  };

  const handleOpenServiceDetail = (service: ServiceItem) => {
    setActiveSubpageService(service);
    window.location.hash = `sluzba/${service.slug}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToHome = () => {
    setActiveSubpageService(null);
    window.location.hash = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
        {activeSubpageService ? (
          /* Dedicated Service Subpage (Requirement 5) */
          <ServiceDetailPage
            service={activeSubpageService}
            allServices={services}
            onBack={handleBackToHome}
            onOpenLeadForm={handleOpenLeadForm}
            onSelectService={handleOpenServiceDetail}
          />
        ) : (
          /* Standard Full Landing Page */
          <>
            {/* Hero Section */}
            <Hero
              settings={settings}
              onOpenLeadForm={() => handleOpenLeadForm()}
            />

            {/* O nás (About Us) */}
            <AboutSection
              settings={settings}
              onOpenLeadForm={() => handleOpenLeadForm()}
            />

            {/* Služby (Services Grid with details and subpage links) */}
            <ServicesSection
              services={services}
              onSelectServiceForLead={handleOpenLeadForm}
              onOpenServiceDetail={handleOpenServiceDetail}
            />

            {/* Orientační kalkulačka rozpočtu rekonstrukce a jádra */}
            <PriceCalculatorSection
              onApplyCalculation={(data) => {
                setPrefilledNote(null);
                setPrefilledCalculation(data);
                setPreselectedServiceId(data.serviceId);
              }}
            />

            {/* Realizace (Projects with Stage switcher & Before/After slider) */}
            <ProjectsSection
              projects={projects}
              onOpenLeadForm={() => handleOpenLeadForm()}
            />

            {/* Případové studie (Technical parameters, materials & engineering challenges) */}
            <CaseStudiesSection
              onSelectCaseStudyForLead={handleSelectCaseStudyForLead}
            />

            {/* Interaktivní srovnání materiálů pro konzultace */}
            <MaterialComparisonSection
              onConsultMaterial={handleConsultMaterial}
            />

            {/* Blog & Aktuality (Trendy v rekonstrukcích, údržba interiéru, materiály pro bytová jádra) */}
            <BlogSection
              posts={blogPosts}
              activeArticleSlug={activeBlogSlug}
              onSelectArticleSlug={handleSelectArticleSlug}
              onConsultTopic={handleConsultBlogTopic}
            />

            {/* Často kladené dotazy (FAQ) */}
            <FaqSection
              onOpenLeadForm={() => handleOpenLeadForm()}
              onOpenChat={() => setIsChatOpen(true)}
            />

            {/* Proč STAVPARTA (Why Us & craft principles) */}
            <WhyUsSection />

            {/* Jak probíhá spolupráce (4-step process) */}
            <ProcessSection onOpenLeadForm={() => handleOpenLeadForm()} />

            {/* Reference se souhlasem (Testimonials) */}
            <TestimonialsSection testimonials={testimonials} />

            {/* Interaktivní mapa působnosti v Olomouckém kraji */}
            <ServiceAreaMapSection
              settings={settings}
              onOpenLeadForm={handleOpenLeadForm}
            />

            {/* Poptávkový formulář & Kontakty (Dynamic Lead form with prefilled calculations) */}
            <LeadFormSection
              settings={settings}
              services={services}
              preselectedServiceId={preselectedServiceId}
              prefilledData={prefilledCalculation}
              prefilledNote={prefilledNote}
              onOpenGdpr={() => setIsGdprOpen(true)}
              onLeadCreated={(lead) => setLeads((prev) => [lead, ...prev])}
            />
          </>
        )}
      </main>

      {/* Footer */}
      <Footer
        settings={settings}
        onOpenLeadForm={() => handleOpenLeadForm()}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onOpenGdpr={() => setIsGdprOpen(true)}
      />

      {/* Admin Dashboard Modal */}
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

      {/* GDPR & Privacy Modal */}
      <GdprModal
        settings={settings}
        isOpen={isGdprOpen}
        onClose={() => setIsGdprOpen(false)}
      />

      {/* Mobile Sticky CTA 'Poptat' */}
      {!isAdminOpen && !isGdprOpen && !isChatOpen && (
        <button
          type="button"
          onClick={() => handleOpenLeadForm()}
          aria-label="Otevřít poptávkový formulář v sekci kontakt"
          className="md:hidden fixed bottom-4 right-4 z-40 min-h-[48px] px-5 py-3 bg-[#F07818] hover:bg-[#d9660e] active:scale-95 text-white font-extrabold text-sm rounded-xl shadow-xl border border-white/20 flex items-center gap-2 cursor-pointer transition-transform"
        >
          <Send className="w-4 h-4 shrink-0" />
          <span>Poptat</span>
        </button>
      )}

      {/* Contextual Service Chatbot Widget */}
      <ChatWidget
        settings={settings}
        services={services}
        isOpen={isChatOpen}
        onToggle={setIsChatOpen}
        onNavigateToLeadForm={handleChatNavigateToLeadForm}
        hidden={isAdminOpen || isGdprOpen}
      />
    </div>
  );
}
