import { redirect } from 'next/navigation';
import { hasExistingUsers } from './setup-actions';
import { getGitOpsSettings } from '@/lib/gitops';
import SetupClient from './SetupClient';

export default async function SetupPage() {
  const usersExist = await hasExistingUsers();
  const gitOps = await getGitOpsSettings();
  
  if (usersExist && gitOps) {
    // Both user and GitOps are setup, redirect to login/dashboard
    redirect('/admin/login');
  }

  // Auto-detect Vercel deployment variables
  const defaultOwner = process.env.VERCEL_GIT_REPO_OWNER || '';
  const defaultRepo = process.env.VERCEL_GIT_REPO_SLUG || '';

  return (
    <SetupClient 
      defaultOwner={defaultOwner} 
      defaultRepo={defaultRepo} 
      initialStep={usersExist ? 2 : 1} 
    />
  );
}
