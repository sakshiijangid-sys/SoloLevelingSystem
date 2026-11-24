import { useState, type FormEvent } from 'react';
import {
  linkWithPopup, multiFactor, reload, sendEmailVerification, signOut,
  TotpMultiFactorGenerator, unlink, type TotpSecret,
} from 'firebase/auth';
import { useAuth } from '../contexts/AuthContext';
import { auth } from '../firebase';
import { oauthProviders, providerNames } from '../lib/authProviders';

export default function AccountSecurity() {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [secret, setSecret] = useState<TotpSecret>();
  if (!user) return null;

  async function run(action: () => Promise<unknown>, success: string) {
    setBusy(true);
    setNotice('');
    try {
      await action();
      setNotice(success);
    } catch (error) {
      const code = error instanceof Error && 'code' in error ? error.code : null;
      setNotice(code === 'auth/requires-recent-login'
        ? 'Sign out and sign back in before changing your account security.'
        : error instanceof Error ? error.message : 'Could not complete the request.');
    } finally {
      setBusy(false);
    }
  }

  function enroll(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!secret) return;
    const code = String(new FormData(event.currentTarget).get('code'));
    void run(async () => {
      const assertion = TotpMultiFactorGenerator.assertionForEnrollment(secret, code);
      await multiFactor(user!).enroll(assertion, 'Authenticator app');
      setSecret(undefined);
    }, 'Authenticator enabled.');
  }

  return (
    <main className="mx-auto max-w-xl space-y-6 px-4 pb-10 pt-28">
      <h1 className="text-2xl font-bold">Account security</h1>
      {!user.emailVerified && (
        <section className="space-y-2">
          <p>Verify your email to use AI and manage account connections.</p>
          <button disabled={busy} onClick={() => run(() => sendEmailVerification(user), 'Verification email sent.')}>Send verification email</button>
          <button className="ml-4" disabled={busy} onClick={() => run(async () => {
            await reload(user);
            await user.getIdToken(true);
            if (!user.emailVerified) throw new Error('Your email is still unverified.');
          }, 'Email verified.')}>Check verification</button>
        </section>
      )}
      <fieldset disabled={busy || !user.emailVerified} className="space-y-3 disabled:opacity-60">
        <legend className="font-semibold">Connected sign-in methods</legend>
        {(Object.keys(oauthProviders) as (keyof typeof oauthProviders)[]).map(id => {
          const linked = user.providerData.some(provider => provider.providerId === id);
          return (
            <div key={id} className="flex justify-between">
              <span>{providerNames[id]}</span>
              <button disabled={linked && user.providerData.length < 2} onClick={() => run(async () => {
                if (linked) await unlink(user, id);
                else await linkWithPopup(user, oauthProviders[id]());
                await reload(user);
              }, linked ? 'Provider unlinked.' : 'Provider linked.')}>{linked ? 'Unlink' : 'Link'}</button>
            </div>
          );
        })}
      </fieldset>
      <fieldset disabled={busy || !user.emailVerified} className="space-y-3 disabled:opacity-60">
        <legend className="font-semibold">Two-factor authentication</legend>
        {multiFactor(user).enrolledFactors.map(factor => (
          <div key={factor.uid} className="flex justify-between">
            <span>{factor.displayName || 'Authenticator'}</span>
            <button onClick={() => run(() => multiFactor(user).unenroll(factor), 'Authenticator removed.')}>Remove</button>
          </div>
        ))}
        {!secret && !multiFactor(user).enrolledFactors.length && (
          <button onClick={() => run(async () => {
            const session = await multiFactor(user).getSession();
            setSecret(await TotpMultiFactorGenerator.generateSecret(session));
          }, '')}>Set up authenticator app</button>
        )}
        {secret && (
          <form onSubmit={enroll} className="space-y-2">
            <p>Add this setup key to your authenticator app.</p>
            <code className="block break-all">{secret.secretKey}</code>
            <label>Code <input className="rounded border bg-transparent p-2" name="code" required inputMode="numeric" pattern="[0-9]{6}" autoComplete="one-time-code" /></label>
            <button className="ml-3">Enable</button>
            <button type="button" className="ml-3" onClick={() => setSecret(undefined)}>Cancel</button>
          </form>
        )}
      </fieldset>
      <button disabled={busy || !user.emailVerified} onClick={() => run(async () => {
        const token = await user.getIdToken();
        const response = await fetch('/api/auth/revoke-sessions', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: '{}',
        });
        if (!response.ok) throw new Error((await response.json()).error);
        await signOut(auth);
      }, 'All sessions revoked.')}>Sign out on all devices</button>
      {notice && <p role="status">{notice}</p>}
    </main>
  );
}
