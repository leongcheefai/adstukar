interface Props {
  url: string;
  oldEmail: string;
}

export function ChangeEmailEmail({ url, oldEmail }: Props) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width" />
      </head>
      <body>
        <p>
          A request was made to change the email address for your account (previously: {oldEmail}).
        </p>
        <p>
          <a href={url}>Confirm new email</a>
        </p>
        <p>Link expires in 24 hours. If you did not request this change, ignore this email.</p>
      </body>
    </html>
  );
}
