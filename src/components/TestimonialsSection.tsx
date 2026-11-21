import React from 'react';
import { Star, CheckCircle, ShieldAlert, Quote } from 'lucide-react';
import { Testimonial } from '../types';

interface TestimonialsSectionProps {
  testimonials: Testimonial[];
}

export const TestimonialsSection: React.FC<TestimonialsSectionProps> = ({ testimonials }) => {
  const publishedTestimonials = testimonials.filter((t) => t.isPublished && t.hasConsent);

  return (
    <section id="reference" className="py-20 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#F07818] mb-2">
              <span>Zkušenosti klientů</span>
              <span className="text-slate-300">/</span>
              <span className="text-slate-500 font-medium">Pouze se souhlasem ke zveřejnění</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#17232D] tracking-tight">
              Co o naší práci říkají zákazníci
            </h2>
            <p className="text-slate-600 mt-2 text-base max-w-2xl">
              Nezveřejňujeme fiktivní hodnocení. Zobrazujeme výhradně autentické reference, u
              kterých dal zákazník výslovný souhlas se zveřejněním.
            </p>
          </div>

          <div className="shrink-0">
            <span className="text-xs text-slate-500 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>100% ověřený souhlas se zveřejněním</span>
            </span>
          </div>
        </div>

        {publishedTestimonials.length === 0 ? (
          <div className="p-8 text-center bg-[#F1F4F6] rounded-xl border border-slate-200 text-slate-500 text-sm">
            Zatím nejsou k dispozici žádné schválené reference. Nové reference doplní správce v
            administraci po získání souhlasu od zákazníků.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {publishedTestimonials.map((testimonial) => (
              <div
                key={testimonial.id}
                className="bg-[#F1F4F6] rounded-xl p-6 border border-slate-200 flex flex-col justify-between relative shadow-xs"
              >
                <div>
                  {/* Demo Indicator */}
                  {testimonial.isDemo && (
                    <div className="mb-4 inline-flex items-center gap-1.5 px-2 py-0.5 bg-amber-100 border border-amber-300 text-amber-900 rounded text-[10px] font-bold">
                      <ShieldAlert className="w-3 h-3 text-amber-600" />
                      <span>DEMO VZOR – K NAHRAZENÍ REÁLNOU REFERENCÍ</span>
                    </div>
                  )}

                  {/* Rating Stars */}
                  <div className="flex items-center gap-1 mb-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < testimonial.rating
                            ? 'text-amber-500 fill-amber-500'
                            : 'text-slate-300'
                        }`}
                      />
                    ))}
                  </div>

                  {/* Quote Text */}
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed italic mb-6">
                    „{testimonial.text}“
                  </p>
                </div>

                {/* Author footer */}
                <div className="pt-4 border-t border-slate-200/80">
                  <div className="font-bold text-xs text-[#17232D]">
                    {testimonial.clientName}
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                    <span>{testimonial.projectType}</span>
                    <span>·</span>
                    <span>{testimonial.location}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
