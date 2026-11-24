import { useState, type FormEvent } from 'react';
import { FirebaseError } from 'firebase/app';
import {
  createUserWithEmailAndPassword, getMultiFactorResolver, sendEmailVerification,
  signInWithEmailAndPassword, signInWithPopup, TotpMultiFactorGenerator,
  type MultiFactorError, type MultiFactorResolver,
} from 'firebase/auth';
import { auth } from '../firebase';
import { oauthProviders } from '../lib/authProviders';

export default function AdditionalSignIn({ disabled, googleResolver }: { disabled: boolean; googleResolver?: MultiFactorResolver }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [localResolver, setResolver] = useState<MultiFactorResolver>();
  const [dismissed, setDismissed] = useState<MultiFactorResolver>();
  const resolver = localResolver ?? (dismissed === googleResolver ? undefined : googleResolver);
  const [failures, setFailures] = useState(0);
  const [blockedUntil, setBlockedUntil] = useState(0);

  async function attempt(action: () => Promise<unknown>) {
    if (Date.now() < blockedUntil) {
      setError('Wait a few seconds before trying again.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await action();
      setFailures(0);
      setBlockedUntil(0);
    } catch (err) {
      if (err instanceof FirebaseError && err.code === 'auth/multi-factor-auth-required') {
        setResolver(getMultiFactorResolver(auth, err as MultiFactorError));
      } else {
        setFailures(failures + 1);
        setBlockedUntil(Date.now() + Math.min(60_000, 1000 * 2 ** failures));
        setError('Sign-in could not be completed. Check your details and try again.');
      }
    } finally {
      setBusy(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get('email'));
    const password = String(form.get('password'));
    const signup = (event.nativeEvent as SubmitEvent).submitter?.getAttribute('value') === 'signup';
    return attempt(async () => {
      if (signup) {
        const { user } = await createUserWithEmailAndPassword(auth, email, password);
        await sendEmailVerification(user);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    });
  }

  if (resolver) {
    return (
      <form onSubmit={event => {
        event.preventDefault();
        const code = String(new FormData(event.currentTarget).get('code'));
        const factor = resolver.hints.find(hint => hint.factorId === TotpMultiFactorGenerator.FACTOR_ID);
        if (!factor) {
          setError('This account requires a different second factor.');
          return;
        }
        void attempt(() => resolver.resolveSignIn(TotpMultiFactorGenerator.assertionForSignIn(factor.uid, code)));
      }}>
        <label>Authenticator code <input name="code" required inputMode="numeric" pattern="[0-9]{6}" autoComplete="one-time-code" /></label>
        <button disabled={busy}>Verify</button>
        <button type="button" onClick={() => { setResolver(undefined); setDismissed(googleResolver); }}>Cancel</button>
        {error && <p role="alert">{error}</p>}
      </form>
    );
  }

  return (
    <div className="space-y-3 text-sm">
      <div className="flex gap-3">
        <button disabled={busy || disabled} onClick={() => attempt(() => signInWithPopup(auth, oauthProviders['github.com']()))}>Sign in with GitHub</button>
        <button disabled={busy || disabled} onClick={() => attempt(() => signInWithPopup(auth, oauthProviders['apple.com']()))}>Sign in with Apple</button>
      </div>
      <form className="space-y-3" onSubmit={submit}>
        <input className="w-full rounded border bg-transparent p-2" aria-label="Email" name="email" type="email" autoComplete="email" placeholder="Email" required />
        <input className="w-full rounded border bg-transparent p-2" aria-label="Password" name="password" type="password" autoComplete="current-password" placeholder="Password" required />
        <div className="flex gap-3">
          <button value="signin" disabled={busy || disabled}>Sign in with email</button>
          <button value="signup" disabled={busy || disabled}>Create account</button>
        </div>
      </form>
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
