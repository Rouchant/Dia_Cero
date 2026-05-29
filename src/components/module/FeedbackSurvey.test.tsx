import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FeedbackSurvey } from './FeedbackSurvey';

describe('FeedbackSurvey Component', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders initial state correctly with submit button disabled', () => {
    render(<FeedbackSurvey onComplete={vi.fn()} />);

    expect(screen.getByText('Tu Opinión Importa')).toBeInTheDocument();
    expect(screen.getByText('¿Cómo fue tu experiencia de aprendizaje hoy?')).toBeInTheDocument();
    expect(screen.getByText('Calificación General')).toBeInTheDocument();
    expect(screen.getByLabelText('¿Algún pensamiento adicional?')).toBeInTheDocument();

    const submitButton = screen.getByRole('button', { name: /Enviar Comentarios/i });
    expect(submitButton).toBeDisabled();
  });

  it('enables submit button and shows correct rating text when a star is clicked', () => {
    render(<FeedbackSurvey onComplete={vi.fn()} />);

    // Obtenemos los botones (las 5 estrellas + el botón de enviar)
    const buttons = screen.getAllByRole('button');
    // Las primeras 5 son las estrellas, hacemos click en la 4ta (índice 3)
    fireEvent.click(buttons[3]);

    expect(screen.getByText('¡Gran experiencia!')).toBeInTheDocument();

    const submitButton = screen.getByRole('button', { name: /Enviar Comentarios/i });
    expect(submitButton).toBeEnabled();
  });

  it('updates comment textarea state when user types', () => {
    render(<FeedbackSurvey onComplete={vi.fn()} />);

    const textarea = screen.getByLabelText('¿Algún pensamiento adicional?');
    fireEvent.change(textarea, { target: { value: 'Excelente curso, aprendí mucho.' } });

    expect(textarea).toHaveValue('Excelente curso, aprendí mucho.');
  });

  it('shows thank you message and calls onComplete after timeout upon submitting', () => {
    const handleComplete = vi.fn();
    render(<FeedbackSurvey onComplete={handleComplete} />);

    // Calificar con 5 estrellas (índice 4)
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[4]);
    expect(screen.getByText('¡Superó mis expectativas!')).toBeInTheDocument();

    // Agregar comentario
    const textarea = screen.getByLabelText('¿Algún pensamiento adicional?');
    fireEvent.change(textarea, { target: { value: 'Recomendado 100%' } });

    // Enviar formulario (el botón de submit es el último botón de la lista o podemos buscar por rol/texto)
    const submitButton = screen.getByRole('button', { name: /Enviar Comentarios/i });
    fireEvent.click(submitButton);

    // Debe mostrar la vista de agradecimiento
    expect(screen.getByText('¡Gracias!')).toBeInTheDocument();
    expect(screen.getByText('Tus comentarios nos ayudan a mejorar DiaCero para todos.')).toBeInTheDocument();

    // Aún no debe haber llamado a onComplete (tiene 2s de delay)
    expect(handleComplete).not.toHaveBeenCalled();

    // Avanzamos el tiempo 2 segundos
    vi.advanceTimersByTime(2000);

    // Debe haberse llamado a onComplete con los datos ingresados
    expect(handleComplete).toHaveBeenCalledWith({
      rating: 5,
      comment: 'Recomendado 100%',
    });
  });
});
