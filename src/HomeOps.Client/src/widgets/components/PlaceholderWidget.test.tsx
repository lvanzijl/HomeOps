import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { PlaceholderWidget } from './PlaceholderWidget';

afterEach(() => cleanup());

describe('PlaceholderWidget', () => {
  it('renders Dutch fallback copy when no body is configured', () => {
    render(
      <PlaceholderWidget
        definition={{ id: 'house-placeholder', type: 'placeholder', title: 'Huis', settings: {} }}
        instance={{ id: 'widget-1', widgetDefinitionId: 'house-placeholder', title: 'Huis', settings: {} }}
      />,
    );

    expect(screen.getByText('Binnenkort beschikbaar')).not.toBeNull();
    expect(screen.getByText('Hier is straks meer ruimte voor je gezin.')).not.toBeNull();
  });
});
