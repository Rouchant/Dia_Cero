export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
}

export interface ModuleSection {
  id: string;
  title: string;
  type: 'content' | 'quiz' | 'feedback';
  content?: string;
  videoUrl?: string;
  imageUrl?: string;
  imageHint?: string;
  questions?: QuizQuestion[];
}

export interface LearningModule {
  id: string;
  title: string;
  description: string;
  sections: ModuleSection[];
}

export const DIA_CERO_MODULE: LearningModule = {
  id: 'dia-cero-intro',
  title: 'DiaCero: Foundations of Intellectual Growth',
  description: 'Master the core principles of clarity, focus, and continuous learning in a modern environment.',
  sections: [
    {
      id: 'welcome',
      title: 'Welcome to DiaCero',
      type: 'content',
      content: 'DiaCero is designed to take you from a baseline of zero to a highly productive state of clarity and purpose. In this introductory section, we explore why focus is the ultimate competitive advantage in the 21st century. Intellectual growth isn\'t just about gathering information; it\'s about synthesizing it into actionable wisdom.',
      imageUrl: 'https://picsum.photos/seed/learn1/1200/600',
      imageHint: 'online learning'
    },
    {
      id: 'core-concepts',
      title: 'Core Concepts of Focus',
      type: 'content',
      content: 'Focus is a finite resource. To manage it effectively, you must understand the "Deep Work" philosophy. Deep work is the ability to focus without distraction on a cognitively demanding task. It’s a skill that allows you to quickly master complicated information and produce better results in less time. Contrast this with shallow work: non-cognitively demanding, logistical-style tasks, often performed while distracted.',
      videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
    },
    {
      id: 'quiz-1',
      title: 'Focus Checkpoint',
      type: 'quiz',
      questions: [
        {
          id: 'q1',
          question: 'What is the primary characteristic of "Deep Work"?',
          options: [
            'Multitasking efficiently',
            'Focusing without distraction on cognitively demanding tasks',
            'Answering emails as they arrive',
            'Working longer hours than peers'
          ],
          correctAnswer: 1
        },
        {
          id: 'q2',
          question: 'Why is focus considered a "finite resource"?',
          options: [
            'It can be traded for money',
            'It decreases as you get older',
            'It requires physiological energy and depletes with use',
            'It only exists in the morning'
          ],
          correctAnswer: 2
        }
      ]
    },
    {
      id: 'knowledge-synthesis',
      title: 'Synthesizing Knowledge',
      type: 'content',
      content: 'Once you have focus, the next step is synthesis. Synthesis is the process of combining diverse ideas into something new. In this stage, you move beyond rote memorization into the realm of true understanding. You learn to see patterns where others see chaos.',
      imageUrl: 'https://picsum.photos/seed/brain/800/400',
      imageHint: 'brain knowledge'
    },
    {
      id: 'final-assessment',
      title: 'Final Mastery Quiz',
      type: 'quiz',
      questions: [
        {
          id: 'q3',
          question: 'Which process involves combining diverse ideas to create new understanding?',
          options: [
            'Memorization',
            'Synthesis',
            'Classification',
            'Archiving'
          ],
          correctAnswer: 1
        }
      ]
    },
    {
      id: 'feedback-survey',
      title: 'Module Feedback',
      type: 'feedback'
    }
  ]
};
