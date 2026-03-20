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
  id: 'seguridad-laboral-chile',
  title: 'Módulo Piloto: Seguridad Laboral (Ley 16.744)',
  description: 'Conoce los fundamentos de la prevención de riesgos en Chile, el seguro social obligatorio y el Derecho a Saber (ODI).',
  sections: [
    {
      id: 'ley-16744',
      title: '1. ¿Qué es la Ley 16.744?',
      type: 'content',
      content: 'En Chile, la Ley 16.744 establece un seguro social obligatorio contra riesgos de accidentes del trabajo y enfermedades profesionales. Este seguro protege a todos los trabajadores dependientes e independientes, brindando cobertura médica, económica y preventiva frente a cualquier eventualidad que ocurra a causa o con ocasión del trabajo.',
      imageUrl: 'https://picsum.photos/seed/safety1/1200/600',
      imageHint: 'construction safety'
    },
    {
      id: 'derecho-a-saber',
      title: '2. El Derecho a Saber (ODI)',
      type: 'content',
      content: 'El "Derecho a Saber" u Obligación de Informar (ODI) es un mandato legal para todo empleador en Chile. Consiste en la obligación de informar oportuna y convenientemente a todos sus trabajadores acerca de los riesgos que entrañan sus labores, las medidas preventivas y los métodos de trabajo correctos para evitar accidentes o enfermedades profesionales antes de iniciar sus actividades.',
      videoUrl: 'https://www.youtube.com/embed/aTodIVUqh2s'
    },
    {
      id: 'quiz-1',
      title: 'Punto de Control: Conceptos Base',
      type: 'quiz',
      questions: [
        {
          id: 'q1',
          question: '¿A quiénes protege principalmente la Ley 16.744?',
          options: [
            'Solo a los empleadores',
            'A todos los trabajadores dependientes e independientes',
            'Únicamente a los trabajadores del rubro de la construcción',
            'A personas que no tienen trabajo'
          ],
          correctAnswer: 1
        },
        {
          id: 'q2',
          question: '¿Qué significan las siglas ODI en el contexto de prevención chileno?',
          options: [
            'Organización de Desarrollo Interno',
            'Obligación de Informar',
            'Orden de Despido Inmediato',
            'Oficina de Inspección'
          ],
          correctAnswer: 1
        }
      ]
    },
    {
      id: 'epp',
      title: '3. Elementos de Protección Personal (EPP)',
      type: 'content',
      content: 'Los Elementos de Protección Personal (EPP) son dispositivos, accesorios y vestimentas diseñados para proteger al trabajador de posibles lesiones. En Chile, el empleador debe proporcionar estos elementos de forma gratuita, y el trabajador está obligado legalmente a usarlos y cuidarlos. Los EPP no eliminan el riesgo, sino que minimizan las consecuencias de un accidente.',
      imageUrl: 'https://picsum.photos/seed/epp/800/400',
      imageHint: 'personal protective equipment'
    },
    {
      id: 'final-assessment',
      title: 'Cuestionario Evaluativo',
      type: 'quiz',
      questions: [
        {
          id: 'q3',
          question: 'Sobre los EPP (Elementos de Protección Personal), ¿cuál afirmación es correcta?',
          options: [
            'El trabajador debe comprarlos con su propio dinero',
            'Eliminan completamente la probabilidad de que ocurra el accidente',
            'El empleador debe entregarlos gratuitamente y el trabajador debe usarlos',
            'Su uso es completamente opcional según la comodidad del trabajador'
          ],
          correctAnswer: 2
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
