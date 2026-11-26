import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Share2,
  User,
} from 'lucide-react';
import { BlogPost, ServiceItem } from '../types';
import { ResponsiveImage } from './ResponsiveImage';

interface BlogArticlePageProps {
  post: BlogPost;
  allPosts: BlogPost[];
  relatedService?: ServiceItem;
  onConsultTopic: (serviceId: string, articleTitle: string) => void;
}

const formatCzDate = (isoDate: string): string => {
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) return isoDate;
  return parsed.toLocaleDateString('cs-CZ', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  });
};

export const BlogArticlePage: React.FC<BlogArticlePageProps> = ({
  post,
  allPosts,
  relatedService,
  onConsultTopic,
}) => {
  const [copied, setCopied] = useState(false);

  const publishedPosts = allPosts.filter((p) => p.isPublished);
  const currentIdx = publishedPosts.findIndex((p) => p.id === post.id);
  const prevPost = currentIdx > 0 ? publishedPosts[currentIdx - 1] : null;
  const nextPost =
    currentIdx >= 0 && currentIdx < publishedPosts.length - 1
      ? publishedPosts[currentIdx + 1]
      : null;

  const handleCopyShareLink = async () => {
    const shareUrl = `${window.location.origin}/blog/${post.slug}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Clipboard write unavailable in restricted context
    }
  };

  return (
    <div className="bg-[#F1F4F6] min-h-screen py-8 sm:py-12">
      <article className="max-w-4xl mx-auto px-4 sm:px-8">
        {/* Breadcrumbs */}
        <nav aria-label="Drobečková navigace" className="flex flex-wrap items-center gap-2 text-xs text-slate-600 mb-6">
          <Link to="/" className="hover:text-[#B84F00] flex items-center gap-1 font-semibold">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Úvod</span>
          </Link>
          <span>/</span>
          <Link to="/#blog" className="hover:text-[#B84F00] font-medium">
            Blog & Aktuality
          </Link>
          <span>/</span>
          <span className="font-bold text-[#17232D] line-clamp-1">{post.title}</span>
        </nav>

        {/* Hero / Header Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="aspect-16/9 bg-slate-900 overflow-hidden relative">
            <ResponsiveImage
              src={post.image}
              alt={post.imageAlt}
              sizes="(max-width: 1024px) 100vw, 896px"
              defaultWidth={1200}
              defaultHeight={896}
              priority
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-8 sm:right-8 flex flex-wrap items-center justify-between gap-3">
              <span className="px-3 py-1 bg-[#17232D]/90 text-[#F07818] text-xs font-bold uppercase tracking-wider rounded border border-[#F07818]/40">
                {post.category}
              </span>

              <button
                type="button"
                onClick={handleCopyShareLink}
                className="px-3 py-1.5 rounded-lg bg-white/95 hover:bg-white text-[#17232D] text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Odkaz zkopírován</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Sdílet článek</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="p-6 sm:p-10 space-y-8">
            <header className="space-y-4">
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#B84F00]" />
                  <span>{formatCzDate(post.publishedAt)}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#B84F00]" />
                  <span>{post.readTimeMinutes} min čtení</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#B84F00]" />
                  <span>{post.author}</span>
                </span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-extrabold text-[#17232D] leading-tight text-balance">
                {post.title}
              </h1>

              <p className="text-base sm:text-lg text-slate-700 font-medium leading-relaxed bg-[#F8FAFC] p-5 rounded-xl border border-slate-200">
                {post.excerpt}
              </p>
            </header>

            {/* Body Paragraphs */}
            <div className="space-y-6">
              {post.contentSections.map((sec, idx) => (
                <section key={idx} className="space-y-2.5">
                  <h2 className="text-xl font-extrabold text-[#17232D]">{sec.heading}</h2>
                  <p className="text-sm sm:text-base text-slate-700 leading-relaxed">{sec.text}</p>
                </section>
              ))}
            </div>

            {/* Craft Checklist */}
            {post.practicalTips.length > 0 && (
              <div className="p-6 bg-[#17232D] text-white rounded-xl space-y-3">
                <h2 className="text-sm font-extrabold uppercase tracking-wider text-[#F07818]">
                  Praktický tahák ze stavby
                </h2>
                <ul className="space-y-2.5 text-xs sm:text-sm text-slate-200">
                  {post.practicalTips.map((tip, i) => (
                    <li key={i} className="flex items-start gap-2.5 leading-relaxed">
                      <CheckCircle2 className="w-4 h-4 text-[#F07818] shrink-0 mt-0.5" />
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Related Service & Consultation Callout */}
            <div className="p-6 bg-orange-50 border border-orange-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h2 className="font-extrabold text-base text-[#17232D]">
                  Řešíte toto téma u své rekonstrukce?
                </h2>
                <p className="text-xs sm:text-sm text-slate-700">
                  Přijedeme na nezávazné zaměření po celém Olomouckém kraji a navrhneme přesné
                  řešení.
                </p>
                {relatedService && (
                  <Link
                    to={`/sluzba/${relatedService.slug}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#B84F00] hover:underline pt-1"
                  >
                    <span>Související služba: {relatedService.title}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>

              <button
                type="button"
                onClick={() => onConsultTopic(post.relatedServiceId, post.title)}
                className="px-5 py-3 bg-[#C2560A] hover:bg-[#9E4306] text-white text-xs sm:text-sm font-bold rounded-lg shadow-sm flex items-center gap-2 shrink-0 cursor-pointer whitespace-nowrap"
              >
                <span>Konzultovat s naší partou</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Prev / Next Articles */}
            {(prevPost || nextPost) && (
              <nav
                aria-label="Další články"
                className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 text-xs"
              >
                {prevPost ? (
                  <Link
                    to={`/blog/${prevPost.slug}`}
                    className="text-left text-slate-700 hover:text-[#B84F00] flex items-center gap-2 sm:max-w-[46%] font-semibold"
                  >
                    <ChevronLeft className="w-4 h-4 shrink-0" />
                    <span className="truncate">{prevPost.title}</span>
                  </Link>
                ) : (
                  <span />
                )}

                {nextPost && (
                  <Link
                    to={`/blog/${nextPost.slug}`}
                    className="text-right text-slate-700 hover:text-[#B84F00] flex items-center justify-end gap-2 sm:max-w-[46%] font-semibold ml-auto"
                  >
                    <span className="truncate">{nextPost.title}</span>
                    <ChevronRight className="w-4 h-4 shrink-0" />
                  </Link>
                )}
              </nav>
            )}
          </div>
        </div>
      </article>
    </div>
  );
};
