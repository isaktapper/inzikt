import { useState, useEffect } from 'react';

/**
 * A simple typewriter hook that cycles through an array of words
 */
export function useTypewriter(
  words: string[],
  options = {
    typeSpeed: 100,
    deleteSpeed: 60,
    pauseTime: 1000,
  }
) {
  const [text, setText] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!words || !words.length) return;
    
    let currentIndex = 0;
    let isDeleting = false;
    let currentText = '';
    let timeoutId: NodeJS.Timeout;
    
    // Mark as initialized to avoid SSR issues
    setIsInitialized(true);
    
    function handleTyping() {
      const word = words[currentIndex];
      
      if (isDeleting) {
        // Deleting
        currentText = word.substring(0, currentText.length - 1);
      } else {
        // Typing
        currentText = word.substring(0, currentText.length + 1);
      }
      
      setText(currentText);
      
      let delay = isDeleting ? options.deleteSpeed : options.typeSpeed;
      
      if (!isDeleting && currentText === word) {
        // Pause at the end of typing a word
        delay = options.pauseTime;
        isDeleting = true;
      } else if (isDeleting && currentText === '') {
        // Switch to next word when deleted
        isDeleting = false;
        currentIndex = (currentIndex + 1) % words.length;
        delay = 500; // Brief pause before starting new word
      }
      
      timeoutId = setTimeout(handleTyping, delay);
    }
    
    // Start typing
    handleTyping();
    
    // Cleanup on unmount
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [words, options.typeSpeed, options.deleteSpeed, options.pauseTime]);
  
  // Return the first word during SSR to avoid layout shifts
  if (!isInitialized && words.length > 0) {
    return ''; // Return empty string initially to ensure animation starts
  }
  
  return text;
} 