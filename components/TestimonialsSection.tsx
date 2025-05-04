import { useScrollAnimation } from '@/hooks/useScrollAnimation';

export function TestimonialsSection() {
  const { ref, isIntersecting } = useScrollAnimation({
    threshold: 0.1,
    once: true,
  });

  const testimonial = {
    quote: "Inzikt turned our support tickets from a headache into our most valuable source of product feedback. We've reduced our response time by 40% and identified critical issues before they became widespread.",
    name: "Sarah Johnson",
    title: "Head of Customer Support at TechCorp",
  };

  return (
    <section 
      ref={ref} 
      className="py-12 px-6 bg-gray-50"
    >
      <div className={`max-w-4xl mx-auto text-center ${isIntersecting ? 'animate-fade-in' : 'opacity-0'}`}>
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="40" 
          height="40" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          className="mx-auto mb-6 text-gray-400"
        >
          <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z" />
          <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z" />
        </svg>
        
        <blockquote className="text-xl md:text-2xl text-[#0E0E10] mb-8 font-light italic">
          "{testimonial.quote}"
        </blockquote>
        
        <div className="flex flex-col items-center">
          <p className="font-semibold text-[#0E0E10]">{testimonial.name}</p>
          <p className="text-gray-500 text-sm">{testimonial.title}</p>
        </div>
      </div>
    </section>
  );
} 