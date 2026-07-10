import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { TextWidget } from './TextWidget';

afterEach(() => cleanup());

describe('TextWidget', () => {
  it('renders Dutch fallback copy when no body is configured', () => {
    render(
      <TextWidget
        definition={{ id: 'welcome-text', type: 'text', title: 'Welkom', settings: {} }}
        instance={{ id: 'widget-1', widgetDefinitionId: 'welcome-text', title: 'Welkom', settings: {} }}
      />,
    );

    const fallbackCopy = screen.getAllByText('Gezinsnotitie');

    expect(fallbackCopy).toHaveLength(2);
  });
});
