I will implement OTP login (magic link) using the Nodemailer provider.

### 1. Install Dependencies

Install `nodemailer` to enable email sending capabilities.

```bash
npm install nodemailer
```

### 2. Configure Authentication Provider

Update `auth.js` to include the Nodemailer provider.

* Import `Nodemailer` from `next-auth/providers/nodemailer`.

* Add the provider to the configuration with `server` and `from` settings.

* **Note:** You will need to provide `EMAIL_SERVER` (SMTP connection string) and `EMAIL_FROM` in your environment variables.

### 3. Update Login Interface

Modify `components/login/login-form.jsx` to add the email login option.

* Add an email input field and a "Sign in with Email" button.

* Update the form to handle email submission using `signIn("nodemailer", { email, callbackUrl })`.

* Add a separator between Social Login and Email Login for better UX.

### 4. Verification

* Verify that the login form displays the new email input.

* Confirm that submitting an email triggers the `signIn` flow (checking logs for development mode email preview or actual sending if SMTP is configured).

