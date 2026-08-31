interface Props {
  url: string;
}

export function VerifyEmail({ url }: Props) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width" />
      </head>
      <body>
        <p>Verify your email address to complete sign-up.</p>
        <p>
          <a href={url}>Verify email</a>
        </p>
        <p>Link expires in 24 hours. If you did not create this account, ignore this email.</p>
      </body>
    </html>
  );
}
