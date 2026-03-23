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
  title: 'DiaCero: Fundamentos del Crecimiento Intelectual',
  description: 'Domina los principios centrales de claridad, enfoque y aprendizaje continuo en un entorno moderno.',
  sections: [
    {
      id: 'welcome',
      title: 'Bienvenido a DiaCero',
      type: 'content',
      content: 'DiaCero está diseñado para llevarte de una línea base de cero a un estado altamente productivo de claridad y propósito. En esta sección introductoria, exploramos por qué el enfoque es la máxima ventaja competitiva en el siglo XXI. El crecimiento intelectual no se trata solo de recopilar información; se trata de sintetizarla en sabiduría procesable.',
      imageUrl: 'https://picsum.photos/seed/learn1/1200/600',
      imageHint: 'online learning'
    },
    {
      id: 'core-concepts',
      title: 'Conceptos Centrales del Enfoque',
      type: 'content',
      content: 'El enfoque es un recurso finito. Para gestionarlo eficazmente, debes comprender la filosofía del "Trabajo Profundo". El trabajo profundo es la capacidad de concentrarse sin distracciones en una tarea cognitivamente exigente. Es una habilidad que te permite dominar rápidamente información complicada y producir mejores resultados en menos tiempo. Contrasta esto con el trabajo superficial: tareas de estilo logístico, no exigentes cognitivamente, a menudo realizadas mientras estás distraído.',
      videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
    },
    {
      id: 'quiz-1',
      title: 'Punto de Control de Enfoque',
      type: 'quiz',
      questions: [
        {
          id: 'q1',
          question: '¿Cuál es la característica principal del "Trabajo Profundo"?',
          options: [
            'Multitarea eficiente',
            'Enfocarse sin distracciones en tareas cognitivamente exigentes',
            'Responder correos electrónicos a medida que llegan',
            'Trabajar más horas que los compañeros'
          ],
          correctAnswer: 1
        },
        {
          id: 'q2',
          question: '¿Por qué el enfoque se considera un "recurso finito"?',
          options: [
            'Se puede cambiar por dinero',
            'Disminuye con la edad',
            'Requiere energía fisiológica y se agota con el uso',
            'Solo existe por la mañana'
          ],
          correctAnswer: 2
        }
      ]
    },
    {
      id: 'knowledge-synthesis',
      title: 'Sintetizando Conocimiento',
      type: 'content',
      content: 'Una vez que tienes enfoque, el siguiente paso es la síntesis. La síntesis es el proceso de combinar ideas diversas en algo nuevo. En esta etapa, te mueves más allá de la memorización mecánica hacia el ámbito del verdadero entendimiento. Aprendes a ver patrones donde otros ven caos.',
      imageUrl: 'https://picsum.photos/seed/brain/800/400',
      imageHint: 'brain knowledge'
    },
    {
      id: 'final-assessment',
      title: 'Cuestionario Final de Dominio',
      type: 'quiz',
      questions: [
        {
          id: 'q3',
          question: '¿Qué proceso implica combinar ideas diversas para crear un nuevo entendimiento?',
          options: [
            'Memorización',
            'Síntesis',
            'Clasificación',
            'Archivo'
          ],
          correctAnswer: 1
        }
      ]
    },
    {
      id: 'feedback-survey',
      title: 'Comentarios del Módulo',
      type: 'feedback'
    }
  ]
};
