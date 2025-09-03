import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Test simple para validar configuración
describe('Basic Configuration Test', () => {
  it('should render a simple component', () => {
    const TestComponent = () => <div>Test Component</div>;
    render(<TestComponent />);

    const element = screen.getByText('Test Component');
    expect(element).toBeInTheDocument();
  });

  it('should handle basic logic', () => {
    const sum = (a: number, b: number) => a + b;
    expect(sum(2, 3)).toBe(5);
  });
});
