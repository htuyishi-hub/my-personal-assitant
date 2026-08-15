import { useRef } from 'react';
import { useNavigate } from '@remix-run/react';
import styles from './Hero.module.scss';

interface HeroProps {
  /** optional callback when user clicks the call-to-action button */
  onStart?: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onStart }) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const navigate = useNavigate();

  const handleClick = () => {
    if (onStart) {
      onStart();
    } else if (buttonRef.current) {
      // fallback: navigate to chat when no navigation callback provided
      navigate('/chat/default');
    }
  };

  return (
    <section className={styles.heroContainer}>
      <div>
        <img 
          src="/logo-allable.svg" 
          alt="allAble logo" 
          style={{ width: '200px', marginBottom: '1.5rem' }} 
        />
        <h1>Build smarter with allAble</h1>
        <p>
          An AI‑powered studio built for developers. Inspect your codebase,
          ask questions, generate new functions, and collaborate live – all in a
          single chat interface.
        </p>
        <ul className="mt-4 text-left max-w-md mx-auto text-lg">
          <li>• Get instant, runnable JS/TS snippets</li>
          <li>• Understand, refactor and optimize existing files</li>
          <li>• Share sessions, export chats and work with your team</li>
        </ul>
      </div>

      {/* preview image removed */}

      <div className={styles.ctaWrapper}>
        <button ref={buttonRef} className={styles.ctaButton} onClick={handleClick}>
          Start creating
        </button>
      </div>
    </section>
  );
};
