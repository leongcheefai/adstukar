interface Props {
  url: string;
}

export function ResetPasswordEmail({ url }: Props) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width" />
      </head>
      <body>
        <p>We received a request to reset your password.</p>
        <p>
          <a href={url}>Reset password</a>
        </p>
        <p>Link expires in 1 hour. If you did not request this, ignore this email.</p>
      </body>
    </html>
  );
}
