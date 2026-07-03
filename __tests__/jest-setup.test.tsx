import { render } from '@testing-library/react-native';
import { Text } from 'react-native';

describe('Jest configuration', () => {
  it('renders with the React Native test environment', async () => {
    const { getByText } = await render(<Text>DawnBrief</Text>);

    expect(getByText('DawnBrief')).toBeOnTheScreen();
  });
});
