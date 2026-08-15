import { motion } from 'framer-motion';
import { GradientCard } from '~/components/ui/GradientCard';
import styles from './Features.module.scss';
import { ChatBubbleLeftRightIcon, CodeBracketIcon, UserGroupIcon, SparklesIcon } from '@heroicons/react/24/outline';

const featureList = [
  {
    icon: <ChatBubbleLeftRightIcon className="w-8 h-8" />, 
    title: 'Human‑like Chat',
    description: 'Start a natural conversation and guide the assistant to analyze and generate code for your project.',
    seed: 'chat',
  },
  {
    icon: <CodeBracketIcon className="w-8 h-8" />, 
    title: 'Code‑First Workflow',
    description: 'Ask for code snippets, refactors, or help debugging and get JS/TS output you can copy instantly.',
    seed: 'code',
  },
  {
    icon: <UserGroupIcon className="w-8 h-8" />, 
    title: 'Collaborate & Share',
    description: 'Export or share your chat history with teammates or embed examples into your docs.',
    seed: 'collab',
  },
  {
    icon: <SparklesIcon className="w-8 h-8" />, 
    title: 'Personalize Your Experience',
    description: 'Switch between light/dark modes, adjust fonts and layouts to suit your workflow.',
    seed: 'theme',
  },
];

export const Features: React.FC = () => {
  return (
    <section className={styles.featuresContainer}>
      <motion.div
        className={styles.featuresGrid}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={{
          hidden: {},
          visible: {
            transition: { staggerChildren: 0.15 },
          },
        }}
      >
        {featureList.map((f) => (
          <motion.div
            key={f.title}
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 },
            }}
          >
            <GradientCard seed={f.seed} hoverEffect>
              <div className="flex items-center gap-2 mb-2 text-bolt-elements-textPrimary">
                {f.icon}
                <span className={styles.featureTitle}>{f.title}</span>
              </div>
              <p className={styles.featureDescription}>{f.description}</p>
            </GradientCard>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
};