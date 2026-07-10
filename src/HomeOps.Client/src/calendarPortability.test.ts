import { describe, expect, it } from 'vitest';
import { ApiException } from './api/homeOpsApiClient';
import { getFriendlyCalendarPortabilityError, getValidationErrors } from './calendarPortability';

describe('calendarPortability copy', () => {
  it('shows a Dutch JSON error for invalid files', () => {
    expect(getFriendlyCalendarPortabilityError(new SyntaxError('Unexpected token'))).toBe('Het gekozen bestand is geen geldig JSON-bestand.');
  });

  it('shows a friendly Dutch restore summary when validation details are present', () => {
    const error = new ApiException(
      'Bad Request',
      400,
      JSON.stringify({ errors: { calendar: ['Kies een geldig back-upbestand.'] } }),
      {},
      null,
    );

    expect(getFriendlyCalendarPortabilityError(error)).toBe('Deze agenda-back-up kan niet worden hersteld. Controleer de meldingen en probeer opnieuw.');
    expect(getValidationErrors(error)).toEqual(['calendar: Kies een geldig back-upbestand.']);
  });

  it('shows a Dutch retry message for server failures', () => {
    const error = new ApiException('Server Error', 503, '', {}, null);

    expect(getFriendlyCalendarPortabilityError(error)).toBe('De agenda-back-up kan nu niet worden verwerkt. Probeer het opnieuw zodra de server beschikbaar is.');
  });
});
