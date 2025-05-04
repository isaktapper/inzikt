'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { useEffect, useState, useRef } from "react";

export function HeroSection() {
  const [mounted, setMounted] = useState(false);
  const [text, setText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [loopNum, setLoopNum] = useState(0);
  const [typingSpeed, setTypingSpeed] = useState(100);
  
  const words = ['insights', 'solutions', 'actions', 'answers'];
  const typingRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    setMounted(true);
    return () => {
      if (typingRef.current) clearTimeout(typingRef.current);
    };
  }, []);
  
  useEffect(() => {
    if (!mounted) return;
    
    const handleTyping = () => {
      const i = loopNum % words.length;
      const fullText = words[i];
      
      setText(isDeleting 
        ? fullText.substring(0, text.length - 1)
        : fullText.substring(0, text.length + 1)
      );
      
      setTypingSpeed(isDeleting ? 50 : 100);
      
      if (!isDeleting && text === fullText) {
        // Start deleting after pause
        setTimeout(() => setIsDeleting(true), 1000);
      } else if (isDeleting && text === '') {
        setIsDeleting(false);
        setLoopNum(loopNum + 1);
      }
    };
    
    typingRef.current = setTimeout(handleTyping, typingSpeed);
    return () => {
      if (typingRef.current) clearTimeout(typingRef.current);
    };
  }, [text, isDeleting, loopNum, mounted]);
  
  // Hero should animate in immediately
  const { ref, isIntersecting } = useScrollAnimation({
    threshold: 0.1,
    once: true,
  });

  // Show a simpler placeholder during SSR
  if (!mounted) {
    return (
      <section className="relative min-h-[80vh] flex items-center justify-center pt-28 pb-16 overflow-hidden">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-gray-900 mb-6">
            Turn your tickets into{" "}
            <span className="inline-block w-[9ch]">
              <span className="bg-gradient-to-r from-orange-400 to-pink-500 bg-clip-text text-transparent">
                insights
              </span>
              <span className="inline-block bg-gradient-to-r from-orange-400 to-pink-500 bg-clip-text text-transparent">|</span>
            </span>
          </h1>
          
          <p className="max-w-2xl mx-auto text-xl md:text-2xl text-gray-700 mb-12">
            AI-powered analysis in seconds
          </p>
          
          <div className="inline-block">
            <Button 
              asChild 
              size="lg" 
              className="bg-gradient-to-r from-orange-400 to-pink-500 text-white rounded-full px-8 py-4 h-auto text-lg font-medium"
            >
              <Link href="/register">
                Get Started <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section ref={ref} className="min-h-[80vh] flex items-center justify-center py-16 px-4">
      <div className={`max-w-6xl mx-auto ${isIntersecting ? 'animate-fade-in' : 'opacity-0'}`}>
        <div className="flex flex-col lg:flex-row items-center gap-16">
          <div className="flex-1 text-center lg:text-left">
            <h1 className="text-4xl md:text-6xl font-bold text-[#0E0E10] leading-tight">
              Turn your tickets into&nbsp;
              <span className="inline-block w-[9ch]">
                <span className="text-center bg-gradient-to-r from-orange-400 to-pink-500 bg-clip-text text-transparent">
                  {text}
                </span>
                <span className="inline-block animate-pulse ml-1 bg-gradient-to-r from-orange-400 to-pink-500 bg-clip-text text-transparent">|</span>
              </span>
            </h1>
            
            <p className="mt-4 text-lg text-gray-600">
              Automate ticket summaries, priority tags and insights—no manual work required.
            </p>
            
            <Link 
              href="/register" 
              className="inline-block bg-gradient-to-r from-orange-400 to-pink-500 text-white px-8 py-4 rounded-full mt-8 font-medium hover:shadow-lg hover:scale-105 transition-all duration-300"
            >
              Get Started
            </Link>
            <Link 
              href="#demo" 
              className="inline-block bg-white text-[#0E0E10] border border-gray-200 px-8 py-4 rounded-full mt-8 ml-4 font-medium hover:shadow-lg hover:scale-105 transition-all duration-300"
            >
              View Demo
            </Link>
          </div>
          
          <div className="flex-1 w-full max-w-lg mx-auto lg:mx-0">
            <div className="relative">
              {/* Main Card - Analyzed Ticket */}
              <div className="bg-white rounded-xl p-4 shadow-lg border border-gray-200 mb-4">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center">
                    <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-[#0E0E10] ml-2">Ticket #4872 Analyzed</span>
                  </div>
                  <span className="text-xs text-gray-500">2m ago</span>
                </div>
                
                {/* Ticket Title */}
                <h3 className="text-sm font-semibold text-[#0E0E10] mb-2">Unable to update payment method in mobile app</h3>
                
                {/* AI Summary */}
                <div className="mb-3">
                  <div className="text-xs font-medium text-gray-500 mb-1">AI Summary</div>
                  <div className="p-2 bg-gray-50 rounded border border-gray-100 text-xs text-gray-700">
                    Customer is unable to update their credit card details in the mobile app. They receive an error after entering the new card information. The issue appears to be isolated to the iOS app version 3.2.1.
                  </div>
                </div>
                
                {/* Tags */}
                <div className="mb-3">
                  <div className="text-xs font-medium text-gray-500 mb-1">Tags</div>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="text-xs px-2 py-0.5 bg-orange-50 text-orange-600 rounded-full">Payment Processing</span>
                    <span className="text-xs px-2 py-0.5 bg-orange-50 text-orange-600 rounded-full">iOS App</span>
                    <span className="text-xs px-2 py-0.5 bg-orange-50 text-orange-600 rounded-full">Bug</span>
                  </div>
                </div>
              </div>
              
              {/* Insights Card */}
              <div className="bg-white rounded-xl p-4 shadow-lg border border-gray-200 relative">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-r from-orange-400 to-pink-500 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 18h6"/>
                        <path d="M10 22h4"/>
                        <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0018 8A6 6 0 006 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 018.91 14"/>
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-[#0E0E10] ml-2">Trending Insight</span>
                  </div>
                  <span className="text-xs text-gray-500">Last 30 days</span>
                </div>
                
                <div className="flex items-center mb-4">
                  <h3 className="text-sm font-semibold text-[#0E0E10]">Payment & Billing Issues</h3>
                  <div className="ml-2 px-2 py-0.5 bg-red-50 rounded-full flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-600 mr-1">
                      <line x1="12" y1="5" x2="12" y2="19"></line>
                      <polyline points="19 12 12 19 5 12"></polyline>
                    </svg>
                    <span className="text-xs font-medium text-red-600">+27%</span>
                  </div>
                </div>
                
                <p className="text-xs text-gray-700 mb-4">
                  Customer reports about payment method updates have increased by 27% since the last mobile app release.
                </p>
                
                <div className="w-full text-xs px-3 py-1.5 text-gray-500 rounded border border-gray-200 text-center">
                  View connected tickets
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
} 