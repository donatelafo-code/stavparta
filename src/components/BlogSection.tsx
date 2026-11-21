import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Calendar,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Search,
  Share2,
  User,
  X,
} from 'lucide-react';
import { BlogCategory, BlogPost } from '../types';

interface BlogSectionProps {
  posts: BlogPost[];
  activeArticleSlug?: string | null;
  onSelectArticleSlug?: (slug: string | null) => void;
  onConsultTopic: (serviceId: string, articleTitle: string) => void;
}

const CATEGORY_OPTIONS: Array<{ id: 'Vše' | BlogCategory; label: string }> = [
  { id: 'Vše', label: 'Všechny články' },
  { id: 'Trendy v rekonstrukcích', label: 'Trendy v rekonstrukcích' },
  { id: 'Materiály pro bytová jádra', label: 'Materiály pro bytová jádra' },
  { id: 'Údržba interiéru', label: 'Údržba interiéru' },
];

const formatCzDate = (isoDate: string): string => {
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) return isoDate;
  return parsed.toLocaleDateString('cs-CZ', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  });
};

export const BlogSection: React.FC<BlogSectionProps> = ({
  posts,
  activeArticleSlug,
  onSelectArticleSlug,
  onConsultTopic,
}) => {
  const publishedPosts = posts.filter((p) => p.isPublished);
  const [selectedCategory, setSelectedCategory] = useState<'Vše' | BlogCategory>('Vše');
  const [searchQuery, setSearchQuery] = useState('');
  const [internalOpenPost, setInternalOpenPost] = useState<BlogPost | null>(null);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  // Derive currently opened post from activeArticleSlug if controlled externally, otherwise internalOpenPost
  const openPost = activeArticleSlug
    ? publishedPosts.find((p) => p.slug === activeArticleSlug) || internalOpenPost
    : internalOpenPost;

  const handleOpenPost = (post: BlogPost) => {
    setInternalOpenPost(post);
    onSelectArticleSlug?.(post.slug);
  };

  const handleCloseModal = () => {
    setInternalOpenPost(null);
    onSelectArticleSlug?.(null);
  };

  // Close modal with Escape key
  useEffect(() => {
    if (!openPost) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleCloseModal();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  });

  const handleCopyArticleLink = async (post: BlogPost) => {
    const shareUrl = `${window.location.origin}${window.location.pathname}#blog/${post.slug}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedSlug(post.slug);
      setTimeout(() => setCopiedSlug(null), 2500);
    } catch {
      // Fallback ignored if clipboard blocked
    }
  };

  const filteredPosts = publishedPosts.filter((post) => {
    const matchesCategory =
      selectedCategory === 'Vše' || post.category === selectedCategory;
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      post.title.toLowerCase().includes(q) ||
      post.excerpt.toLowerCase().includes(q) ||
      post.category.toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  const featuredPost =
    selectedCategory === 'Vše' && !searchQuery.trim()
      ? filteredPosts.find((p) => p.featured) || filteredPosts[0]
      : null;

  const gridPosts = featuredPost
    ? filteredPosts.filter((p) => p.id !== featuredPost.id)
    : filteredPosts;

  const openPostIndex = openPost
    ? publishedPosts.findIndex((p) => p.id === openPost.id)
    : -1;
  const prevPost =
    openPostIndex > 0 ? publishedPosts[openPostIndex - 1] : null;
  const nextPost =
    openPostIndex >= 0 && openPostIndex < publishedPosts.length - 1
      ? publishedPosts[openPostIndex + 1]
      : null;

  return (
    <section id="blog" className="py-20 bg-[#F1F4F6] border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#F07818] mb-2">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Blog & Aktuality ze stavby</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#17232D] tracking-tight text-balance">
              Praktické rady pro rekonstrukce, bytová jádra a péči o interiér
            </h2>
            <p className="text-slate-600 mt-3 text-base leading-relaxed">
              Sdílíme zkušenosti přímo ze staveb v Zábřehu na Moravě, Olomouci a okolí. Dozvíte
              se, jaké materiály obstojí v každodenním provozu a na co si dát pozor před zahájením
              prací.
            </p>
          </div>

          {/* Search box */}
          <div className="relative w-full lg:w-72 shrink-0">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Hledat téma (např. Ytong, vinyl)..."
              aria-label="Vyhledat článek na blogu"
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#F07818]"
            />
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex flex-wrap gap-2 mb-10">
          {CATEGORY_OPTIONS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedCategory(tab.id)}
              className={`px-4 py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                selectedCategory === tab.id
                  ? 'bg-[#17232D] text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Featured Spotlight Article */}
        {featuredPost && (
          <article className="mb-10 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow grid grid-cols-1 lg:grid-cols-12">
            <div
              onClick={() => handleOpenPost(featuredPost)}
              className="lg:col-span-6 aspect-4/3 lg:aspect-auto bg-slate-900 overflow-hidden cursor-pointer group"
            >
              <img
                src={featuredPost.image}
                alt={featuredPost.imageAlt}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-103"
              />
            </div>

            <div className="lg:col-span-6 p-6 sm:p-8 flex flex-col justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-3">
                  <span className="font-bold text-[#F07818]">{featuredPost.category}</span>
                  <span>·</span>
                  <span>{formatCzDate(featuredPost.publishedAt)}</span>
                  <span>·</span>
                  <span>{featuredPost.readTimeMinutes} min čtení</span>
                </div>

                <h3
                  onClick={() => handleOpenPost(featuredPost)}
                  className="text-2xl font-extrabold text-[#17232D] leading-snug hover:text-[#F07818] transition-colors cursor-pointer text-balance"
                >
                  {featuredPost.title}
                </h3>

                <p className="text-sm text-slate-600 leading-relaxed mt-3">
                  {featuredPost.excerpt}
                </p>

                {featuredPost.practicalTips.length > 0 && (
                  <div className="mt-5 pt-4 border-t border-slate-100 space-y-1.5">
                    <span className="text-xs font-bold text-[#17232D] block">
                      Hlavní poznatek z praxe:
                    </span>
                    <p className="text-xs text-slate-600 flex items-start gap-2 leading-relaxed">
                      <CheckCircle2 className="w-4 h-4 text-[#F07818] shrink-0 mt-0.5" />
                      <span>{featuredPost.practicalTips[0]}</span>
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
                <span className="text-xs text-slate-500 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>{featuredPost.author}</span>
                </span>

                <button
                  type="button"
                  onClick={() => handleOpenPost(featuredPost)}
                  className="px-4 py-2 bg-[#17232D] hover:bg-[#263746] text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <span>Přečíst celý návod</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </article>
        )}

        {/* Articles Grid */}
        {filteredPosts.length === 0 ? (
          <div className="p-12 bg-white rounded-xl border border-slate-200 text-center space-y-3">
            <p className="text-sm font-semibold text-[#17232D]">
              Zadanému filtru neodpovídá žádný článek.
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('Vše');
                setSearchQuery('');
              }}
              className="px-4 py-2 bg-[#F07818] text-white text-xs font-bold rounded-lg cursor-pointer"
            >
              Zobrazit všechny články
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {gridPosts.map((post) => (
              <article
                key={post.id}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow"
              >
                <div>
                  <div
                    onClick={() => handleOpenPost(post)}
                    className="aspect-4/3 bg-slate-900 overflow-hidden cursor-pointer group"
                  >
                    <img
                      src={post.image}
                      alt={post.imageAlt}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-103"
                    />
                  </div>

                  <div className="p-6">
                    {/* Zero-pill inline metadata */}
                    <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 mb-2.5">
                      <span className="font-bold text-[#F07818]">{post.category}</span>
                      <span>·</span>
                      <span>{formatCzDate(post.publishedAt)}</span>
                      <span>·</span>
                      <span>{post.readTimeMinutes} min</span>
                    </div>

                    <h3
                      onClick={() => handleOpenPost(post)}
                      className="text-lg font-bold text-[#17232D] leading-snug mb-2.5 hover:text-[#F07818] transition-colors cursor-pointer"
                    >
                      {post.title}
                    </h3>

                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                      {post.excerpt}
                    </p>
                  </div>
                </div>

                <div className="px-6 pb-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => handleOpenPost(post)}
                    className="text-xs font-bold text-[#17232D] hover:text-[#F07818] flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <span>Číst článek</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => onConsultTopic(post.relatedServiceId, post.title)}
                    className="text-xs font-semibold text-slate-500 hover:text-[#F07818] cursor-pointer transition-colors"
                  >
                    Poptat řešení
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {/* Article Detail Reader Modal */}
      {openPost && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-6"
          onClick={handleCloseModal}
        >
          <div
            className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sticky Modal Header */}
            <div className="px-6 py-4 bg-[#17232D] text-white flex items-center justify-between gap-4 shrink-0">
              <div className="flex items-center gap-2 text-xs text-slate-300 truncate">
                <span className="font-bold text-[#F07818]">{openPost.category}</span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {formatCzDate(openPost.publishedAt)}
                </span>
                <span className="hidden sm:inline">·</span>
                <span className="hidden sm:flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {openPost.readTimeMinutes} min čtení
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleCopyArticleLink(openPost)}
                  className="px-2.5 py-1.5 rounded bg-[#263746] hover:bg-[#34495d] text-xs font-semibold text-slate-200 flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  {copiedSlug === openPost.slug ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Zkopírováno</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Sdílet odkaz</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  aria-label="Zavřít článek"
                  className="p-1.5 rounded hover:bg-[#263746] text-slate-300 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Scrollable Article Content */}
            <div className="overflow-y-auto flex-1">
              <div className="aspect-16/9 bg-slate-900 overflow-hidden">
                <img
                  src={openPost.image}
                  alt={openPost.imageAlt}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="p-6 sm:p-8 space-y-6">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-[#17232D] leading-tight text-balance">
                    {openPost.title}
                  </h2>
                  <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                    <User className="w-3.5 h-3.5 text-[#F07818]" />
                    <span className="font-medium text-slate-700">{openPost.author}</span>
                  </div>
                </div>

                <p className="text-base text-slate-700 font-medium leading-relaxed bg-[#F8FAFC] p-4 rounded-xl border border-slate-200">
                  {openPost.excerpt}
                </p>

                <div className="space-y-5">
                  {openPost.contentSections.map((sec, i) => (
                    <div key={i} className="space-y-2">
                      <h3 className="text-lg font-extrabold text-[#17232D]">{sec.heading}</h3>
                      <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
                        {sec.text}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Craft Checklist Box */}
                {openPost.practicalTips.length > 0 && (
                  <div className="p-5 sm:p-6 bg-[#17232D] text-white rounded-xl space-y-3">
                    <h4 className="text-sm font-extrabold uppercase tracking-wider text-[#F07818]">
                      Praktický tahák ze stavby
                    </h4>
                    <ul className="space-y-2.5 text-xs sm:text-sm text-slate-200">
                      {openPost.practicalTips.map((tip, i) => (
                        <li key={i} className="flex items-start gap-2.5 leading-relaxed">
                          <CheckCircle2 className="w-4 h-4 text-[#F07818] shrink-0 mt-0.5" />
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Consultation Callout */}
                <div className="p-5 bg-orange-50 border border-orange-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="font-extrabold text-sm text-[#17232D]">
                      Řešíte toto téma u své rekonstrukce?
                    </h4>
                    <p className="text-xs text-slate-600 mt-1">
                      Rádi přijedeme na nezávazné zaměření po celém Olomouckém kraji a navrhneme
                      správnou skladbu materiálů.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const post = openPost;
                      handleCloseModal();
                      onConsultTopic(post.relatedServiceId, post.title);
                    }}
                    className="px-4 py-2.5 bg-[#F07818] hover:bg-[#d9660e] text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-2 shrink-0 cursor-pointer whitespace-nowrap"
                  >
                    <span>Konzultovat s naší partou</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Prev / Next Navigation */}
                {(prevPost || nextPost) && (
                  <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-4 text-xs">
                    {prevPost ? (
                      <button
                        type="button"
                        onClick={() => handleOpenPost(prevPost)}
                        className="text-left text-slate-600 hover:text-[#F07818] flex items-center gap-1.5 max-w-[46%] cursor-pointer"
                      >
                        <ChevronLeft className="w-4 h-4 shrink-0" />
                        <span className="truncate font-semibold">{prevPost.title}</span>
                      </button>
                    ) : (
                      <span />
                    )}

                    {nextPost && (
                      <button
                        type="button"
                        onClick={() => handleOpenPost(nextPost)}
                        className="text-right text-slate-600 hover:text-[#F07818] flex items-center gap-1.5 max-w-[46%] cursor-pointer ml-auto"
                      >
                        <span className="truncate font-semibold">{nextPost.title}</span>
                        <ChevronRight className="w-4 h-4 shrink-0" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
