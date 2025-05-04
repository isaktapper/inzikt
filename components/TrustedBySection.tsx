import { useScrollAnimation } from '@/hooks/useScrollAnimation';

export function TrustedBySection() {
  const { ref, isIntersecting } = useScrollAnimation({
    threshold: 0.1,
    once: true,
  });
  
  // Integration partner logos
  const integrations = [
    {
      id: 1,
      name: "Zendesk",
      logo: <img src="/zendesk-1.svg" alt="Zendesk" className="h-12 w-auto" />
    },
    {
      id: 2,
      name: "Freshdesk",
      logo: <img src="/freshdesk-logo.svg" alt="Freshdesk" className="h-12 w-auto" />
    },
    {
      id: 3,
      name: "Intercom",
      logo: <img src="/intercom-1.svg" alt="Intercom" className="h-12 w-auto" />
    }
  ];

  return (
    <section 
      ref={ref} 
      className={`py-12 px-4 border-t border-b border-gray-100 ${
        isIntersecting ? 'animate-fade-in' : 'opacity-0'
      }`}
    >
      <div className="max-w-6xl mx-auto">
        <p className="text-center text-gray-500 mb-8 text-sm font-medium uppercase tracking-wider">
          Integrates with
        </p>
        
        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16">
          {integrations.map((integration) => (
            <div key={integration.id} className="flex items-center justify-center hover:opacity-80 transition-opacity">
              <div className="flex items-center h-12">
                {integration.logo}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
} 