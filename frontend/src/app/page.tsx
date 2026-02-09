import { redirect } from 'next/navigation';

export default function Home() {
  // Root redirects to login - actual dashboard will be at /payments
  redirect('/login');
}
