import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Search,
  User,
} from 'lucide-react';
import { BlogCategory, BlogPost } from '../types';
import { ResponsiveImage } from './ResponsiveImage';

interface BlogSectionProps {
  posts: BlogPost[];
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
  onConsultTopic,
}) => {
  const publishedPosts = posts.filter((p) => p.isPublished);
  const [selectedCategory, setSelectedCategory] = useState<'Vše' | BlogCategory>('Vše');
  const [searchQuery, setSearchQuery] = useState('');

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

  return (
    <section id="blog" className="py-20 bg-[#F1F4F6] border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#B84F00] mb-2">
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
            <label htmlFor="blog-search-input" className="sr-only">
              Vyhledat článek na blogu
            </label>
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="blog-search-input"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Hledat téma (např. Ytong, vinyl)..."
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-800 placeholder-slate-500 focus:outline-none focus:border-[#C2560A]"
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
            <Link
              to={`/blog/${featuredPost.slug}`}
              className="lg:col-span-6 aspect-4/3 lg:aspect-auto bg-slate-900 overflow-hidden cursor-pointer group block"
            >
              <ResponsiveImage
                src={featuredPost.image}
                alt={featuredPost.imageAlt}
                sizes="(max-width: 1024px) 100vw, 50vw"
                defaultWidth={1200}
                defaultHeight={896}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-103"
              />
            </Link>

            <div className="lg:col-span-6 p-6 sm:p-8 flex flex-col justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-3">
                  <span className="font-bold text-[#B84F00]">{featuredPost.category}</span>
                  <span>·</span>
                  <span>{formatCzDate(featuredPost.publishedAt)}</span>
                  <span>·</span>
                  <span>{featuredPost.readTimeMinutes} min čtení</span>
                </div>

                <h3 className="text-2xl font-extrabold text-[#17232D] leading-snug text-balance">
                  <Link
                    to={`/blog/${featuredPost.slug}`}
                    className="hover:text-[#B84F00] transition-colors"
                  >
                    {featuredPost.title}
                  </Link>
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
                      <CheckCircle2 className="w-4 h-4 text-[#B84F00] shrink-0 mt-0.5" />
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

                <Link
                  to={`/blog/${featuredPost.slug}`}
                  className="px-4 py-2 bg-[#17232D] hover:bg-[#263746] text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <span>Přečíst celý návod</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
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
              className="px-4 py-2 bg-[#C2560A] hover:bg-[#9E4306] text-white text-xs font-bold rounded-lg cursor-pointer"
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
                  <Link
                    to={`/blog/${post.slug}`}
                    className="aspect-4/3 bg-slate-900 overflow-hidden cursor-pointer group block"
                  >
                    <ResponsiveImage
                      src={post.image}
                      alt={post.imageAlt}
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      defaultWidth={1200}
                      defaultHeight={896}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-103"
                    />
                  </Link>

                  <div className="p-6">
                    {/* Zero-pill inline metadata */}
                    <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 mb-2.5">
                      <span className="font-bold text-[#B84F00]">{post.category}</span>
                      <span>·</span>
                      <span>{formatCzDate(post.publishedAt)}</span>
                      <span>·</span>
                      <span>{post.readTimeMinutes} min</span>
                    </div>

                    <h3 className="text-lg font-bold text-[#17232D] leading-snug mb-2.5">
                      <Link
                        to={`/blog/${post.slug}`}
                        className="hover:text-[#B84F00] transition-colors"
                      >
                        {post.title}
                      </Link>
                    </h3>

                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                      {post.excerpt}
                    </p>
                  </div>
                </div>

                <div className="px-6 pb-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <Link
                    to={`/blog/${post.slug}`}
                    className="text-xs font-bold text-[#17232D] hover:text-[#B84F00] flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <span>Číst článek</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>

                  <button
                    type="button"
                    onClick={() => onConsultTopic(post.relatedServiceId, post.title)}
                    className="text-xs font-semibold text-slate-600 hover:text-[#B84F00] cursor-pointer transition-colors"
                  >
                    Poptat řešení
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
