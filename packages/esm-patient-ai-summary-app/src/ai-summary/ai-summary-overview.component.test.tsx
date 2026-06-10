import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { openmrsFetch, usePatient } from '@openmrs/esm-framework';
import AiSummaryOverview from './ai-summary-overview.component';

vi.mock('@openmrs/esm-framework', () => ({
  openmrsFetch: vi.fn(),
  usePatient: vi.fn(),
}));

const mockedOpenmrsFetch = vi.mocked(openmrsFetch);
const mockedUsePatient = vi.mocked(usePatient);

const mockPatientUuid = '8673ee4f-e2ab-4077-ba55-4980f408773e';

describe('AiSummaryOverview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedUsePatient.mockReturnValue({
      patientUuid: mockPatientUuid,
      patient: null,
      isLoading: false,
      error: null,
    });
  });

  it('renders the Generate Summary button', () => {
    mockedOpenmrsFetch.mockResolvedValue({ data: {} });
    render(<AiSummaryOverview />);
    expect(screen.getByText('AI Summary')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /generate summary/i })).toBeInTheDocument();
  });

  it('displays summary when button is clicked and data is cached', async () => {
    const user = userEvent.setup();
    mockedOpenmrsFetch.mockResolvedValue({
      data: {
        answer: 'Patient has diabetes [1] and hypertension [2].',
        disclaimer: 'AI-generated content.',
      },
    });

    render(<AiSummaryOverview />);

    await waitFor(() => {
      expect(mockedOpenmrsFetch).toHaveBeenCalled();
    });

    const button = screen.getByRole('button', { name: /generate summary/i });
    await user.click(button);

    expect(screen.getByText('Patient has diabetes and hypertension.')).toBeInTheDocument();
  });

  it('displays error message when API call fails', async () => {
    const user = userEvent.setup();
    mockedOpenmrsFetch.mockRejectedValue(new Error('Network error'));

    render(<AiSummaryOverview />);

    await waitFor(() => {
      expect(mockedOpenmrsFetch).toHaveBeenCalled();
    });

    const button = screen.getByRole('button', { name: /generate summary/i });
    await user.click(button);

    expect(screen.getByText(/error generating summary/i)).toBeInTheDocument();
  });

  it('strips citation references from the summary', async () => {
    const user = userEvent.setup();
    mockedOpenmrsFetch.mockResolvedValue({
      data: { answer: 'Has diabetes [1] and takes metformin [4, 5, 6].', disclaimer: null },
    });

    render(<AiSummaryOverview />);

    await waitFor(() => {
      expect(mockedOpenmrsFetch).toHaveBeenCalled();
    });

    await user.click(screen.getByRole('button', { name: /generate summary/i }));

    expect(screen.getByText('Has diabetes and takes metformin.')).toBeInTheDocument();
  });
});
