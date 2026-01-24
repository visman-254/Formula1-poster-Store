import { useState, useEffect, useRef } from 'react';

const useIdle = (timeout, onIdle) => {
  const [isIdle, setIsIdle] = useState(false);
  const timeoutRef = useRef(null);

  const handleEvent = () => {
    setIsIdle(false);
    resetTimer();
  };

  const resetTimer = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setIsIdle(true);
      if (onIdle) {
        onIdle();
      }
    }, timeout);
  };

  useEffect(() => {
    const events = ['mousemove', 'keydown', 'mousedown', 'touchstart'];

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
    resetTimer();

    return () => {
      removeEventListeners();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [timeout, onIdle]);

  return isIdle;
};

export default useIdle;
