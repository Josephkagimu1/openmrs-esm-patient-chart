import React, { useCallback, useState, useEffect, useRef } from 'react';
import { Button, Tile, InlineLoading } from '@carbon/react';
import { usePatient, openmrsFetch } from '@openmrs/esm-framework';

const AiSummaryOverview: React.FC = () => {
  const { patientUuid } = usePatient();
  const [summary, setSummary] = useState<string | null>(null);
  const [disclaimer, setDisclaimer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const cachedSummary = useRef<string | null>(null);
  const cachedDisclaimer = useRef<string | null>(null);

  const fetchSummary = useCallback(async () => {
    const { data } = await openmrsFetch('/ws/rest/v1/chartsearchai/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: {
        patient: patientUuid,
        question:
          'Summarize this patient in 3-5 short sentences. Include active conditions, current medications, allergies, and recent visits. Be concise.',
      },
    });
    const cleanAnswer = data.answer
      .replace(/\s*\[\d+(?:,\s*\d+)*\]/g, '')
      .replace(/,\s*,/g, ',')
      .trim();
    return { answer: cleanAnswer, disclaimer: data.disclaimer };
  }, [patientUuid]);

  // Pre-fetch silently in background
  useEffect(() => {
    const prefetch = async () => {
      try {
        const result = await fetchSummary();
        cachedSummary.current = result.answer;
        cachedDisclaimer.current = result.disclaimer;
      } catch {
        cachedSummary.current = 'Error generating summary. Make sure the Chart Search AI module is installed.';
      }
    };
    prefetch();
    // Also start pre-fetching a second response for Regenerate
    fetchSummary()
      .then((result) => {
        cachedSummary.current = result.answer;
        cachedDisclaimer.current = result.disclaimer;
      })
      .catch(() => {});
  }, [fetchSummary]);

  const generateSummary = useCallback(async () => {
    if (cachedSummary.current) {
      setSummary(cachedSummary.current);
      setDisclaimer(cachedDisclaimer.current);
      return;
    }

    setLoading(true);
    setSummary(null);
    const interval = setInterval(() => {
      if (cachedSummary.current) {
        setSummary(cachedSummary.current);
        setDisclaimer(cachedDisclaimer.current);
        setLoading(false);
        clearInterval(interval);
      }
    }, 500);
  }, []);

  const regenerate = useCallback(async () => {
    setLoading(true);
    setSummary(null);
    try {
      const result = await fetchSummary();
      cachedSummary.current = result.answer;
      cachedDisclaimer.current = result.disclaimer;
      setSummary(result.answer);
      setDisclaimer(result.disclaimer);
    } catch {
      setSummary('Error generating summary.');
    } finally {
      setLoading(false);
    }
  }, [fetchSummary]);

  return (
    <Tile>
      <h4>AI Summary</h4>
      {loading ? (
        <InlineLoading description="AI is analyzing patient data... this may take a moment" />
      ) : summary ? (
        <>
          <p>{summary}</p>
          {disclaimer && <p style={{ fontSize: '0.75rem', color: '#888', marginTop: '0.5rem' }}>{disclaimer}</p>}
          <Button onClick={regenerate} size="sm" kind="ghost" style={{ marginTop: '0.5rem' }}>
            Regenerate
          </Button>
        </>
      ) : (
        <Button onClick={generateSummary} size="sm">
          Generate Summary
        </Button>
      )}
    </Tile>
  );
};

export default AiSummaryOverview;
