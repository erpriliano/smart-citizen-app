import { zodResolver } from '@hookform/resolvers/zod';
import { LoaderCircleIcon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useLocation, useNavigate } from 'react-router-dom';
import { signInInputSchema, type SignInInput } from '@smart-citizen/identity-contracts';
import { isHttpClientError } from '@smart-citizen/shared-http-client';
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  Input,
} from '@smart-citizen/shared-ui';

import { useSignInMutation } from './session-query';

function safeDestination(state: unknown): string {
  if (typeof state !== 'object' || state === null) return '/';
  const from = Reflect.get(state, 'from');

  if (typeof from === 'string' && from.startsWith('/') && !from.startsWith('//')) {
    return from;
  }

  return '/';
}

function hasSignOutFailure(state: unknown): boolean {
  return (
    typeof state === 'object' && state !== null && Reflect.get(state, 'signOutFailed') === true
  );
}

function signInErrorMessage(error: Error | null): string | null {
  if (!error) return null;
  if (isHttpClientError(error) && error.status === 401) {
    return 'Email or password is incorrect.';
  }
  return 'Sign in is unavailable. Try again.';
}

export function SignInPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const signIn = useSignInMutation();
  const form = useForm<SignInInput>({
    resolver: zodResolver(signInInputSchema),
    defaultValues: { email: '', password: '' },
  });
  const errorMessage = signInErrorMessage(signIn.error);
  const signOutFailed = hasSignOutFailure(location.state);

  const submit = form.handleSubmit(async (input) => {
    try {
      await signIn.mutateAsync(input);
      navigate(safeDestination(location.state), {
        replace: true,
      });
    } catch {
      form.setFocus('email');
    }
  });

  return (
    <main className="grid min-h-screen place-items-center bg-background px-4 py-10 sm:px-6">
      <section
        aria-labelledby="sign-in-title"
        className="w-full max-w-sm rounded-md border bg-card px-6 py-8 shadow-sm sm:px-8"
      >
        <div className="flex flex-col gap-2">
          <span
            aria-hidden="true"
            className="grid size-10 place-items-center rounded-md bg-primary text-sm font-semibold text-primary-foreground"
          >
            SC
          </span>
          <h1 id="sign-in-title" className="mt-3 text-2xl leading-8 font-semibold text-foreground">
            Smart Citizen
          </h1>
          <p className="text-sm leading-5 text-muted-foreground">Administrative workspace</p>
        </div>

        <form className="mt-8 flex flex-col gap-5" noValidate onSubmit={submit}>
          {signOutFailed ? (
            <Alert>
              <AlertTitle>Sign out could not be confirmed.</AlertTitle>
              <AlertDescription>
                Close this browser on a shared device and try again.
              </AlertDescription>
            </Alert>
          ) : null}

          {errorMessage ? (
            <Alert variant="destructive">
              <AlertTitle>Sign in failed</AlertTitle>
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          ) : null}

          <FieldGroup>
            <Field data-invalid={Boolean(form.formState.errors.email)}>
              <FieldLabel htmlFor="email">Email address</FieldLabel>
              <Input
                id="email"
                type="email"
                autoComplete="username"
                spellCheck={false}
                aria-invalid={Boolean(form.formState.errors.email)}
                aria-describedby={form.formState.errors.email ? 'email-error' : undefined}
                disabled={signIn.isPending}
                {...form.register('email')}
              />
              <FieldError id="email-error" errors={[form.formState.errors.email]} />
            </Field>

            <Field data-invalid={Boolean(form.formState.errors.password)}>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                aria-invalid={Boolean(form.formState.errors.password)}
                aria-describedby={form.formState.errors.password ? 'password-error' : undefined}
                disabled={signIn.isPending}
                {...form.register('password')}
              />
              <FieldError id="password-error" errors={[form.formState.errors.password]} />
            </Field>
          </FieldGroup>

          <Button className="w-full" disabled={signIn.isPending} type="submit">
            {signIn.isPending ? (
              <LoaderCircleIcon data-icon="inline-start" className="animate-spin" />
            ) : null}
            Sign in
          </Button>
        </form>
      </section>
    </main>
  );
}
