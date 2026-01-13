// Moved from lib/providers/AuthProvider.tsx
'use client';
import { Provider } from 'react-redux';
import { store } from '../redux/store';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  return <Provider store={store}>{children}</Provider>;
}
