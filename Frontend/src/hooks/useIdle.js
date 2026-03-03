import { useState, useEffect, useRef, useCallback } from 'react';

const useIdle = (timeout, onIdle) => {
  const [isIdle, setIsIdle] = useState(false);
  const timeoutRef = useRef(null);
  const onIdleRef = useRef(onIdle);

  // Keep the callback ref updated without triggering resets
  useEffect(() => {
    onIdleRef.current = onIdle;
  }, [onIdle]);

  const handleEvent = useCallback(() => {
    setIsIdle(false);
    
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Set new timeout - only log out if truly idle
    timeoutRef.current = setTimeout(() => {
      setIsIdle(true);
      if (onIdleRef.current) {
        onIdleRef.current();
      }
    }, timeout);
  }, [timeout]);

  useEffect(() => {
    const events = ['mousemove', 'keydown', 'mousedown', 'touchstart', 'scroll'];

    const addEventListeners = () => {
      events.forEach(event => {
        window.addEventListener(event, handleEvent);
      });
    };

    const removeEventListeners = () => {
      events.forEach(event => {
        window.removeEventListener(event, handleEvent);
      });
    };

    addEventListeners();
    // Initial timer
    handleEvent();

    return () => {
      removeEventListeners();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [handleEvent]);

  return isIdle;
};

export default useIdle;
