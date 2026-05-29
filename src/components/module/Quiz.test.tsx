import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Quiz } from './Quiz';

const mockQuestions = [
  {
    id: '1',
    question: '¿Qué es React?',
    options: ['Una biblioteca UI', 'Un sistema operativo', 'Una base de datos'],
    correctAnswer: 0,
  },
  {
    id: '2',
    question: '¿Qué es Next.js?',
    options: ['Un framework de React', 'Un lenguaje de programación', 'Un editor de código'],
    correctAnswer: 0,
  },
];

describe('Quiz Component', () => {
  it('renders the first question and its options', () => {
    render(<Quiz questions={mockQuestions} onComplete={vi.fn()} />);

    expect(screen.getByText('Pregunta 1 de 2')).toBeInTheDocument();
    expect(screen.getByText('¿Qué es React?')).toBeInTheDocument();
    expect(screen.getByText('Una biblioteca UI')).toBeInTheDocument();
    expect(screen.getByText('Un sistema operativo')).toBeInTheDocument();
    expect(screen.getByText('Una base de datos')).toBeInTheDocument();
    
    // El botón de enviar debe estar deshabilitado al inicio
    const submitButton = screen.getByRole('button', { name: /Enviar Respuesta/i });
    expect(submitButton).toBeDisabled();
  });

  it('enables the submit button when an option is selected', async () => {
    const user = userEvent.setup();
    render(<Quiz questions={mockQuestions} onComplete={vi.fn()} />);

    const firstOption = screen.getByText('Una biblioteca UI');
    await user.click(firstOption);

    const submitButton = screen.getByRole('button', { name: /Enviar Respuesta/i });
    expect(submitButton).toBeEnabled();
  });

  it('shows correct feedback when selecting the correct answer', async () => {
    const user = userEvent.setup();
    render(<Quiz questions={mockQuestions} onComplete={vi.fn()} />);

    // Seleccionar respuesta correcta (index 0)
    await user.click(screen.getByText('Una biblioteca UI'));
    await user.click(screen.getByRole('button', { name: /Enviar Respuesta/i }));

    // Debe mostrar feedback de correcto
    expect(screen.getByText('¡Correcto!')).toBeInTheDocument();
    expect(screen.getByText('Gran trabajo entendiendo este concepto.')).toBeInTheDocument();

    // El botón debe cambiar a "Siguiente Pregunta"
    expect(screen.getByRole('button', { name: /Siguiente Pregunta/i })).toBeInTheDocument();
  });

  it('shows incorrect feedback when selecting a wrong answer', async () => {
    const user = userEvent.setup();
    render(<Quiz questions={mockQuestions} onComplete={vi.fn()} />);

    // Seleccionar respuesta incorrecta (index 1)
    await user.click(screen.getByText('Un sistema operativo'));
    await user.click(screen.getByRole('button', { name: /Enviar Respuesta/i }));

    // Debe mostrar feedback de incorrecto
    expect(screen.getByText('No exactamente.')).toBeInTheDocument();
    expect(screen.getByText('La respuesta correcta era: Una biblioteca UI')).toBeInTheDocument();
  });

  it('navigates to the next question upon clicking next', async () => {
    const user = userEvent.setup();
    render(<Quiz questions={mockQuestions} onComplete={vi.fn()} />);

    // Responder primera pregunta
    await user.click(screen.getByText('Una biblioteca UI'));
    await user.click(screen.getByRole('button', { name: /Enviar Respuesta/i }));
    await user.click(screen.getByRole('button', { name: /Siguiente Pregunta/i }));

    // Debe mostrar la segunda pregunta
    expect(screen.getByText('Pregunta 2 de 2')).toBeInTheDocument();
    expect(screen.getByText('¿Qué es Next.js?')).toBeInTheDocument();
  });

  it('finishes the quiz, displays score, and calls onComplete when clicking finish button', async () => {
    const user = userEvent.setup();
    const handleComplete = vi.fn();
    render(<Quiz questions={mockQuestions} onComplete={handleComplete} />);

    // Responder 1ra pregunta (correcta)
    await user.click(screen.getByText('Una biblioteca UI'));
    await user.click(screen.getByRole('button', { name: /Enviar Respuesta/i }));
    await user.click(screen.getByRole('button', { name: /Siguiente Pregunta/i }));

    // Responder 2da pregunta (incorrecta - 'Un lenguaje de programación' index 1)
    await user.click(screen.getByText('Un lenguaje de programación'));
    await user.click(screen.getByRole('button', { name: /Enviar Respuesta/i }));

    // Debe decir "Finalizar Cuestionario"
    const finishButton = screen.getByRole('button', { name: /Finalizar Cuestionario/i });
    expect(finishButton).toBeInTheDocument();
    await user.click(finishButton);

    // Debe mostrar pantalla final con el puntaje (1 de 2 = 50%)
    expect(screen.getByText('¡Evaluación Completada!')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();

    // Al hacer click en "Obtener Certificado de Aprobación", debe invocar onComplete
    const certificateButton = screen.getByRole('button', { name: /Obtener Certificado de Aprobación/i });
    await user.click(certificateButton);

    expect(handleComplete).toHaveBeenCalledWith(50);
  });
});
