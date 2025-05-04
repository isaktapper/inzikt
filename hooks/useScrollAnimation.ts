import { useEffect, useState, useRef } from 'react';

interface ScrollAnimationOptions {
  threshold?: number;
  once?: boolean;
  rootMargin?: string;
}

export function useScrollAnimation(options: ScrollAnimationOptions = {}) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const [isBrowser, setIsBrowser] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  
  const {
    threshold = 0.15,
    once = true,
    rootMargin = '0px 0px -10% 0px'
  } = options;

  useEffect(() => {
    setIsBrowser(true);
    
    // If IntersectionObserver is not available, default to visible
    if (typeof IntersectionObserver === 'undefined') {
      setIsIntersecting(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        // If we've already animated and once is true, don't trigger again
        if (hasAnimated && once) return;
        
        if (entry.isIntersecting) {
          setIsIntersecting(true);
          if (once) {
            setHasAnimated(true);
          }
        } else if (!once) {
          // Only reset if not using "once" mode
          setIsIntersecting(false);
        }
      },
      {
        root: null,
        rootMargin,
        threshold,
      }
    );

    const currentRef = ref.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [isBrowser, threshold, once, rootMargin, hasAnimated]);

  // If not in browser, default to visible so elements show during SSR
  if (!isBrowser) {
    return { ref, isIntersecting: true, hasAnimated: false };
  }

  return { ref, isIntersecting, hasAnimated };
} 