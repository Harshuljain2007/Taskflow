import { AppProviders } from '@/src/app/providers';
import { AppRouter } from '@/src/app/router';
import { ErrorBoundary } from '@/src/components/shared/ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary>
      <AppProviders>
        <AppRouter />
      </AppProviders>
    </ErrorBoundary>
  );
}
